
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ClassifiedClause, ComplianceResult } from '@/types';
import { Loader2, ShieldQuestion } from 'lucide-react';

interface ComplianceViewerProps {
  clauses: ClassifiedClause[];
  results: Record<string, Partial<ComplianceResult> & { isLoading?: boolean }>;
  onCheckCompliance: (clause: string, clauseId: string) => void;
}

const statusClasses: Record<string, string> = {
  compliant: 'border-green-600 bg-green-500/10 text-green-400',
  partial: 'border-yellow-500 bg-yellow-500/10 text-yellow-400',
  'non-compliant': 'border-red-600 bg-red-500/10 text-red-400',
};

export default function ComplianceViewer({ clauses, results, onCheckCompliance }: ComplianceViewerProps) {

  if (!clauses || clauses.length === 0) {
    return (
      <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-8">
        <p>No clauses were found in this document.</p>
        <p className="text-xs mt-1">Compliance checks can only be run on documents with extracted clauses.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clause Compliance Analysis</CardTitle>
        <CardDescription>
          Click "Check Compliance" for any clause to get an AI-powered analysis against the selected regulation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh] w-full pr-4">
          <div className="space-y-4">
            {clauses.map((clause) => {
              const result = results[clause.id];
              const isLoading = result?.isLoading;
              const status = result?.status;

              return (
                <div
                  key={clause.id}
                  className={`p-4 rounded-lg border-l-4 transition-all ${status ? statusClasses[status] : 'border-border bg-card'}`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <p className="flex-1 text-sm text-foreground/90">{clause.clause}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCheckCompliance(clause.clause, clause.id)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldQuestion className="mr-2 h-4 w-4" />
                      )}
                      Check Compliance
                    </Button>
                  </div>
                  {result && !isLoading && (
                    <div className="mt-4 pt-4 border-t border-border/20 space-y-2 text-xs">
                       <p>
                        <strong>Regulation:</strong> <span className="font-semibold text-primary">{result.regulation}</span>
                      </p>
                       <p>
                        <strong>Status:</strong> <span className={`font-semibold ${statusClasses[status || '']?.split(' ')[2]}`}>{result.status}</span>
                      </p>
                      <p><strong>Explanation:</strong> {result.explanation}</p>
                      {result.suggestion && (
                        <div className="p-2 rounded-md bg-background/50">
                          <p><strong>Suggested Fix:</strong> {result.suggestion}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
