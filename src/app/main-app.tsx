
'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { AppState, AnalyzedDocument, ConversationTurn, Improvement } from '@/types';
import { useRouter } from 'next/navigation';

import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

import DocumentUploader from '@/components/document-uploader';
import ClauseViewer from '@/components/clause-viewer';
import QAInterface from '@/components/qa-interface';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, FileText, Download, Printer, ClipboardCopy, BarChart2, Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

type AnalysisViewProps = {
  documents: AnalyzedDocument[];
  activeDocumentName: string;
  conversation: ConversationTurn[];
  improvingState: Record<string, { inProgress: boolean; content: string; replacements: Improvement[] }>;
  summarizingState: Record<string, { inProgress: boolean; content: string; }>;
  isAnswering: boolean;
  onSetActiveDocument: (name: string) => void;
  onAskQuestion: (question: string, scope: string[], language: string) => void;
  onImproveDocument: (documentName: string) => void;
  onSummarizeDocument: (documentName: string) => void;
  onReset: () => void;
};


function AnalysisView({
  documents,
  activeDocumentName,
  conversation,
  improvingState,
  summarizingState,
  onSetActiveDocument,
  isAnswering,
  onAskQuestion,
  onImproveDocument,
  onSummarizeDocument,
  onReset,
}: AnalysisViewProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedDocForReport, setSelectedDocForReport] = useState<AnalyzedDocument | null>(null);

  const activeDocument = documents.find(d => d.name === activeDocumentName);
  const improvedDocState = activeDocument ? improvingState[activeDocument.name] : undefined;
  const summaryState = activeDocument ? summarizingState[activeDocument.name] : undefined;
  
  const handleGenerateReport = () => {
    if (!selectedDocForReport) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a document to generate a report.',
      });
      return;
    }
    setReportDialogOpen(false);
    // Use sessionStorage to pass large data to avoid URL length limits
    sessionStorage.setItem('reportDocumentContent', selectedDocForReport.fullText);
    sessionStorage.setItem('reportDocumentName', selectedDocForReport.name);
    
    router.push(`/report`);
  };

  const handleDownload = async (format: 'pdf' | 'docx' | 'txt') => {
      if (!activeDocument || !improvedDocState || !improvedDocState.content) return;

      const { name } = activeDocument;
      const baseFilename = name.substring(0, name.lastIndexOf('.')) || name;
      const improvedFilename = `${baseFilename}-improved`;
      const improvedContent = improvedDocState.content;

      if (format === 'txt') {
          const blob = new Blob([improvedContent], { type: 'text/plain;charset=utf-8' });
          saveAs(blob, `${improvedFilename}.txt`);
          return;
      }

      if (format === 'pdf') {
          const doc = new jsPDF();
          const pageHeight = doc.internal.pageSize.getHeight();
          const pageWidth = doc.internal.pageSize.getWidth();
          const margin = 15;
          const textLines = doc.splitTextToSize(improvedContent, pageWidth - margin * 2);

          let y = margin;
          textLines.forEach((line: string) => {
              if (y + 7 > pageHeight - margin) {
                  doc.addPage();
                  y = margin;
              }
              doc.text(line, margin, y);
              y += 7; // Line height
          });
          
          doc.save(`${improvedFilename}.pdf`);
          return;
      }

      if (format === 'docx') {
         try {
              const doc = new Document({
                  sections: [{
                    properties: {},
                    children: improvedContent.split('\n').map(line =>
                      new Paragraph({
                        children: [new TextRun(line)]
                      })
                    ),
                  }],
              });
              
              const blob = await Packer.toBlob(doc);
              saveAs(blob, `${improvedFilename}.docx`);
         } catch (e) {
              console.error("Error creating DOCX file:", e);
              toast({
                  variant: 'destructive',
                  title: 'Error',
                  description: 'Could not generate DOCX file. Please try downloading as TXT or PDF.',
              });
         }
      }
  };

  const handlePrint = () => {
      if (!activeDocument || !improvedDocState || !improvedDocState.content) return;
      const contentToPrint = improvedDocState.content;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
          printWindow.document.write(`<html><head><title>Print Document</title></head><body><pre style="white-space: pre-wrap; font-family: sans-serif;">${contentToPrint}</pre></body></html>`);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
      }
  };

  const handleCopy = () => {
      if (!activeDocument || !improvedDocState || !improvedDocState.content) return;
      const contentToCopy = improvedDocState.content;

      navigator.clipboard.writeText(contentToCopy).then(() => {
        toast({
          title: 'Copied!',
          description: 'The improved document text has been copied to your clipboard.',
        });
      }, (err) => {
        console.error('Could not copy text: ', err);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to copy text to clipboard.',
        });
      });
    };

  if (!activeDocument) {
    return (
      <div className="text-center py-10">
        <p>Something went wrong. Please try analyzing your documents again.</p>
        <Button onClick={onReset} className="mt-4">Start Over</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-center flex-wrap gap-4">
        <Button variant="ghost" onClick={onReset}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Analyze New Documents
        </Button>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          {documents.length > 1 && (
            <Select onValueChange={onSetActiveDocument} defaultValue={activeDocumentName}>
              <SelectTrigger className="w-full md:w-[280px]">
                <SelectValue placeholder="Select a document" />
              </SelectTrigger>
              <SelectContent>
                {documents.map(doc => (
                  <SelectItem key={doc.name} value={doc.name}>{doc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="w-full md:w-auto">
            <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
              <DialogTrigger asChild>
                  <Button className="w-full">
                      <BarChart2 className="mr-2 h-4 w-4" />
                      Generate Report
                  </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                      <DialogTitle>Select Document for Report</DialogTitle>
                      <DialogDescription>
                      Choose one document to generate a comprehensive AI report for.
                      </DialogDescription>
                  </DialogHeader>
                  <Command>
                      <CommandInput placeholder="Filter documents..." />
                      <CommandList>
                      <CommandEmpty>No documents to select.</CommandEmpty>
                      <CommandGroup>
                          {documents.map((doc) => (
                          <CommandItem
                              key={doc.name}
                              value={doc.name}
                              onSelect={() => setSelectedDocForReport(doc)}
                          >
                              <FileText className="mr-2 h-4 w-4" />
                              <span>{doc.name}</span>
                              <Check
                              className={cn(
                                  "ml-auto h-4 w-4",
                                  selectedDocForReport?.name === doc.name ? "opacity-100" : "opacity-0"
                              )}
                              />
                          </CommandItem>
                          ))}
                      </CommandGroup>
                      </CommandList>
                  </Command>
                  <DialogFooter>
                      <Button onClick={handleGenerateReport} disabled={!selectedDocForReport}>
                          Generate
                      </Button>
                  </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>


      <Tabs defaultValue="analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="analysis">Clause Analysis</TabsTrigger>
          <TabsTrigger value="qa">Q&A</TabsTrigger>
          <TabsTrigger value="improve">Improve Document</TabsTrigger>
          <TabsTrigger value="summarize">Summarize</TabsTrigger>
        </TabsList>
        <TabsContent value="analysis">
          <ClauseViewer clauses={activeDocument.clauses} documentText={activeDocument.fullText} />
        </TabsContent>
        <TabsContent value="qa">
          <QAInterface
            onAskQuestion={onAskQuestion}
            isLoading={isAnswering}
            conversation={conversation}
            documents={documents}
            activeDocumentName={activeDocumentName}
          />
        </TabsContent>
        <TabsContent value="improve">
          <Card>
            <CardHeader>
              <CardTitle>Improve Your Document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => onImproveDocument(activeDocument.name)} disabled={improvedDocState?.inProgress}>
                <Sparkles className="mr-2 h-4 w-4" />
                {improvedDocState?.inProgress ? 'Improving...' : 'Improve Document with AI'}
              </Button>
              {improvedDocState?.inProgress && <div className="flex items-center space-x-2">
                  <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-6 w-6"></div>
                  <span>AI is reviewing your document...</span>
                </div>}
              {improvedDocState?.content && (
                 <Card className="mt-4">
                   <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                     <CardTitle className="flex items-center">
                       <FileText className="mr-2" />
                       AI-Improved Document
                     </CardTitle>
                     <div className="flex items-center gap-2 flex-wrap">
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button variant="outline">
                             <Download className="mr-2 h-4 w-4" />
                             Download
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent>
                           <DropdownMenuItem onClick={() => handleDownload('pdf')}>PDF</DropdownMenuItem>
                           <DropdownMenuItem onClick={() => handleDownload('docx')}>DOCX</DropdownMenuItem>
                           <DropdownMenuItem onClick={() => handleDownload('txt')}>TXT</DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                       <Button variant="outline" onClick={handlePrint}>
                         <Printer className="mr-2 h-4 w-4" />
                         Print
                       </Button>
                       <Button variant="outline" onClick={handleCopy}>
                          <ClipboardCopy className="mr-2 h-4 w-4" />
                          Copy
                        </Button>
                     </div>
                   </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96 w-full rounded-md border p-4">
                       <pre className="whitespace-pre-wrap font-body text-sm">{improvedDocState.content}</pre>
                    </ScrollArea>
                  </CardContent>
                 </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="summarize">
          <Card>
            <CardHeader>
              <CardTitle>Summarize Your Document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => onSummarizeDocument(activeDocument.name)} disabled={summaryState?.inProgress}>
                <Sparkles className="mr-2 h-4 w-4" />
                {summaryState?.inProgress ? 'Summarizing...' : 'Summarize with AI'}
              </Button>
              {summaryState?.inProgress && <div className="flex items-center space-x-2">
                  <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-6 w-6"></div>
                  <span>AI is summarizing your document...</span>
                </div>}
              {summaryState?.content && (
                 <Card className="mt-4">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center">
                      <FileText className="mr-2" />
                      AI-Generated Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                     <p className="whitespace-pre-wrap font-body text-sm">{summaryState.content}</p>
                  </CardContent>
                 </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


interface MainAppProps {
    view: 'upload' | 'analysis';
    isAnalyzing: boolean;
    onAnalyze: (files: { name: string; dataUri: string }[]) => Promise<void>;
    appState: AppState;
    setActiveDocName: (name: string) => void;
    isAnswering: boolean;
    onAskQuestion: (question: string, scope: string[], language: string) => Promise<void>;
    onImproveDocument: (documentName: string) => Promise<void>;
    onSummarizeDocument: (documentName: string) => Promise<void>;
    resetView: () => void;
}

export default function MainApp({
    view,
    isAnalyzing,
    onAnalyze,
    appState,
    setActiveDocName,
    isAnswering,
    onAskQuestion,
    onImproveDocument,
    onSummarizeDocument,
    resetView,
}: MainAppProps) {
    if (view === 'upload') {
        return <DocumentUploader onAnalyze={onAnalyze} isLoading={isAnalyzing} />;
    }

    return (
        <AnalysisView
            documents={appState.documents}
            activeDocumentName={appState.activeDocumentName}
            conversation={appState.conversation}
            improvingState={appState.improvingState}
            summarizingState={appState.summarizingState}
            onSetActiveDocument={setActiveDocName}
            isAnswering={isAnswering}
            onAskQuestion={onAskQuestion}
            onImproveDocument={onImproveDocument}
            onSummarizeDocument={onSummarizeDocument}
            onReset={resetView}
        />
    );
}

    
