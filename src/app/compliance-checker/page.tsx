
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import ComplianceViewer from '@/components/compliance-viewer';
import { checkComplianceAction } from '@/app/actions';
import type { AnalyzedDocument, ComplianceResult, ComplianceState } from '@/types';

const SUPPORTED_REGULATIONS = [
  { value: 'GDPR', label: 'GDPR (General Data Protection Regulation)' },
  { value: 'HIPAA', label: 'HIPAA (Health Insurance Portability and Accountability Act)' },
  { value: 'PCI DSS', label: 'PCI DSS (Payment Card Industry Data Security Standard)' },
  { value: 'Indian Data Protection Bill', label: 'Indian Data Protection Bill' },
];

function ComplianceCheckerClient({ documents }: { documents: AnalyzedDocument[] }) {
  const { toast } = useToast();
  const [activeDocument, setActiveDocument] = useState<AnalyzedDocument | null>(documents.length > 0 ? documents[0] : null);
  const [selectedRegulation, setSelectedRegulation] = useState<string>(SUPPORTED_REGULATIONS[0].value);
  const [complianceState, setComplianceState] = useState<ComplianceState>({});

  const handleCheckCompliance = async (clause: string, clauseId: string) => {
    if (!activeDocument) return;

    setComplianceState(prevState => {
        const docResults = prevState[activeDocument.name] || {};
        return {
            ...prevState,
            [activeDocument.name]: { ...docResults, [clauseId]: { ...docResults[clauseId], isLoading: true } }
        };
    });

    try {
        const result = await checkComplianceAction(clause, selectedRegulation);
        setComplianceState(prevState => {
            const docResults = prevState[activeDocument.name] || {};
            return {
                ...prevState,
                [activeDocument.name]: {
                    ...docResults,
                    [clauseId]: {
                        ...result,
                        clause,
                        regulation: selectedRegulation,
                        isLoading: false,
                    }
                }
            };
        });
    } catch (error) {
        console.error("Compliance check failed:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to check compliance for this clause.',
        });
        setComplianceState(prevState => {
            const docResults = prevState[activeDocument.name] || {};
            return {
                ...prevState,
                [activeDocument.name]: { ...docResults, [clauseId]: { ...docResults[clauseId], isLoading: false } }
            };
        });
    }
  };

  const handleBatchCheck = () => {
    if (!activeDocument) return;
    activeDocument.clauses.forEach(clause => {
        handleCheckCompliance(clause.clause, clause.id);
    });
  };

  if (documents.length === 0) {
      return (
          <Card className="shadow-2xl border-0 bg-card/60 backdrop-blur-sm text-center">
              <CardHeader>
                  <CardTitle className="text-2xl font-bold">No Documents Analyzed</CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-muted-foreground mb-4">Please analyze a document on the home page first.</p>
                  <Button asChild>
                      <Link href="/">Analyze Documents</Link>
                  </Button>
              </CardContent>
          </Card>
      );
  }

  return (
    <>
      <Card className="shadow-2xl border-0 bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-4xl font-extrabold tracking-tighter gemini-text-gradient flex items-center">
            <ShieldCheck className="mr-4 h-10 w-10" />
            Compliance Checker
          </CardTitle>
          <CardDescription className="text-lg text-foreground/80 pt-2">
            Select a document and a regulation to check for compliance issues clause by clause.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                    <label className="font-semibold">Document</label>
                    <Select onValueChange={(name) => setActiveDocument(documents.find(d => d.name === name) || null)} defaultValue={activeDocument?.name}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a document" />
                        </SelectTrigger>
                        <SelectContent>
                            {documents.map(doc => (
                                <SelectItem key={doc.name} value={doc.name}>{doc.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <label className="font-semibold">Regulation</label>
                    <Select onValueChange={setSelectedRegulation} defaultValue={selectedRegulation}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a regulation" />
                        </SelectTrigger>
                        <SelectContent>
                            {SUPPORTED_REGULATIONS.map(reg => (
                                <SelectItem key={reg.value} value={reg.value}>{reg.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={handleBatchCheck} disabled={!activeDocument}>
                    Check All Clauses
                </Button>
            </div>

            {activeDocument && (
                <ComplianceViewer
                    clauses={activeDocument.clauses}
                    results={complianceState[activeDocument.name] || {}}
                    onCheckCompliance={handleCheckCompliance}
                />
            )}
        </CardContent>
      </Card>
    </>
  );
}


export default function ComplianceCheckerPage() {
    const [documents, setDocuments] = useState<AnalyzedDocument[]>([]);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        if (typeof window !== 'undefined') {
            const storedDocs = sessionStorage.getItem('analyzedDocuments');
            if (storedDocs) {
                setDocuments(JSON.parse(storedDocs));
            }
        }
    }, []);
    
    if (!isClient) {
        return null; // Or a loading spinner
    }

    return (
        <>
            <Header />
            <div className="flex flex-1 flex-col bg-background text-foreground">
                <ComplianceCheckerClient documents={documents} />
            </div>
            <Footer />
        </>
    );
}
