
'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { detectRisksAction } from '@/app/actions';
import type { RiskResult } from '@/types';

import DocumentUploader from '@/components/document-uploader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, FileText } from 'lucide-react';
import GeneratingLoader from '@/components/generating-loader';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';


const riskLevelColors: Record<string, string> = {
  Low: 'bg-green-500/10 text-green-400 border-green-500/20',
  Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  High: 'bg-red-500/10 text-red-400 border-red-500/20',
};


function RiskResultsViewer({ results, documentName }: { results: RiskResult[], documentName: string }) {
    if (results.length === 0) {
        return (
            <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-8">
                <p>No risks were identified.</p>
                <p className="text-xs mt-1">The document might not contain any clauses with detectable risks.</p>
            </div>
        )
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center">
                    <FileText className="mr-2" />
                    Risk Analysis for: <span className="ml-2 font-bold text-primary">{documentName}</span>
                </CardTitle>
                <CardDescription>
                    The AI has analyzed the document and identified the following potential risks.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="multiple" className="w-full space-y-4">
                    {results.map((item, index) => (
                        <AccordionItem value={`item-${index}`} key={index} className="border bg-background/50 rounded-lg px-4">
                            <AccordionTrigger className="text-left hover:no-underline">
                                <div className="flex items-center justify-between w-full">
                                    <span className="font-semibold flex-1 pr-4">{item.clause}</span>
                                    <Badge variant="outline" className={riskLevelColors[item.riskLevel] || 'bg-gray-500/10 text-gray-400'}>
                                        {item.riskLevel} Risk
                                    </Badge>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-2 pt-2">
                                     <h4 className="font-semibold text-primary">Explanation:</h4>
                                     <p className="text-sm text-foreground/80 leading-relaxed">{item.explanation}</p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    );
}


export default function RiskDetectionPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [riskResults, setRiskResults] = useState<{ risks: RiskResult[]; documentName: string; } | null>(null);

    const handleAnalyze = async (files: { name: string, dataUri: string }[]) => {
        if (files.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a file.' });
            return;
        }
        if (files.length > 1) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select only one file for risk detection.' });
            return;
        }

        setIsLoading(true);
        setRiskResults(null);

        const file = files[0];

        try {
            const result = await detectRisksAction(file.dataUri, file.name);
            setRiskResults(result);
        } catch (error) {
            console.error('Error in detectRisksAction:', error);
            toast({
                variant: 'destructive',
                title: 'Analysis Failed',
                description: 'An unexpected error occurred while analyzing the document for risks.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="mx-auto max-w-lg w-full text-center py-12 flex flex-col items-center justify-center min-h-screen">
                <GeneratingLoader />
                <h2 className="text-2xl font-semibold text-foreground mt-8">Detecting Risks...</h2>
                <p className="text-muted-foreground">Please wait while the AI analyzes your document. This may take a moment.</p>
            </div>
        );
    }
    
    if (riskResults) {
        return (
            <>
                <Header />
                <RiskResultsViewer results={riskResults.risks} documentName={riskResults.documentName} />
                <Footer />
            </>
        )
    }

    return (
        <>
        <Header />
        <div className="text-center mb-12 flex-grow flex flex-col justify-center">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-4 flex items-center justify-center">
              <AlertCircle className="mr-4 h-12 w-12 gemini-text-gradient" />
              <span className="gemini-text-gradient">AI-Powered Risk Detection</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mx-auto">
              Upload a legal document (PDF, DOCX, or TXT) to automatically identify and evaluate potentially risky clauses. The AI will assign a risk level and provide a detailed explanation for each finding.
            </p>
          
          <DocumentUploader onAnalyze={handleAnalyze} isLoading={isLoading} showTitle={false} />
        </div>
        <Footer />
        </>
    );
}
