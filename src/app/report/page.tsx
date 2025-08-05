
'use client';

import { Suspense, useEffect, useState } from 'react';
import { generateReportAction } from '@/app/actions';
import type { GenerateReportOutput } from '@/ai/flows/generate-report';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ListChecks, ShieldAlert, FileText, BarChart2 } from 'lucide-react';
import GeneratingLoader from '@/components/generating-loader';
import { useToast } from '@/hooks/use-toast';

function ReportView({ documentName, report }: { documentName: string; report: GenerateReportOutput }) {
  return (
    <div className="space-y-8">
      <Card className="shadow-2xl border-0 bg-card/60 backdrop-blur-sm">
        <CardHeader>
            <CardTitle className="text-2xl md:text-4xl font-extrabold tracking-tighter gemini-text-gradient flex items-center">
                <BarChart2 className="mr-2 md:mr-4 h-8 w-8 md:h-10 md:w-10" />
                AI Report: <span className="ml-2 truncate">{documentName}</span>
            </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Users className="mr-2 text-primary"/> Parties Involved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap font-body text-sm">{report.partiesInvolved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><ListChecks className="mr-2 text-primary"/> Key Obligations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap font-body text-sm">{report.keyObligations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><ShieldAlert className="mr-2 text-primary"/> Risks and Liabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap font-body text-sm">{report.risksAndLiabilities}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><FileText className="mr-2 text-primary"/> Overall Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap font-body text-sm">{report.overallSummary}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ReportGenerator() {
  const { toast } = useToast();
  const [report, setReport] = useState<GenerateReportOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [documentName, setDocumentName] = useState('your document');
  const [documentContent, setDocumentContent] = useState<string | null>(null);


  useEffect(() => {
    // This now runs only on the client
    const name = sessionStorage.getItem('reportDocumentName');
    const content = sessionStorage.getItem('reportDocumentContent');
    setDocumentName(name || 'your document');
    setDocumentContent(content);

    // Clean up session storage after reading
    sessionStorage.removeItem('reportDocumentName');
    sessionStorage.removeItem('reportDocumentContent');
  }, []);

  useEffect(() => {
    if (documentContent === null) {
        // Still waiting for the first effect to run
        return;
    }

    if (!documentContent) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No document content found to generate a report.',
        });
        setIsLoading(false);
        return;
    }

    const fetchReport = async () => {
      try {
        setIsLoading(true);
        const result = await generateReportAction(documentContent);
        setReport(result);
      } catch (error) {
        console.error("Failed to generate report:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to generate the report. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [documentContent, toast]);

  if (isLoading) {
    return (
        <div className="mx-auto max-w-lg w-full text-center py-12 flex flex-col items-center justify-center">
            <GeneratingLoader />
            <h2 className="text-2xl font-semibold text-foreground mt-8">Generating Report...</h2>
            <p className="text-muted-foreground">Please wait while the AI analyzes your document. This may take a moment.</p>
        </div>
    );
  }

  if (!report) {
    return (
        <div className="text-center text-muted-foreground">
            <p>Could not generate a report for this document.</p>
        </div>
    );
  }

  return <ReportView documentName={documentName} report={report} />;
}


export default function ReportPage() {
    return (
        <>
        <Header />
            <Suspense fallback={<div className="text-center">Loading...</div>}>
                <ReportGenerator />
            </Suspense>
        <Footer />
        </>
    );
}


    
