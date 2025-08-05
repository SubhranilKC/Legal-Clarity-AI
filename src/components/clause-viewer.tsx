import { useMemo, useRef, createRef } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ClassifiedClause } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { ClipboardCopy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ClauseViewerProps {
  clauses: ClassifiedClause[];
  documentText: string;
}

const categoryColors: Record<string, string> = {
  Liability: 'bg-red-500/10 text-red-400 border-red-500/20',
  'Intellectual Property': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Confidentiality: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Termination: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Payment: 'bg-green-500/10 text-green-400 border-green-500/20',
  Warranty: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Indemnification: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  'Dispute Resolution': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  'Data Protection': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  Compliance: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  Other: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const HighlightedDocument = ({ documentText, clauses, clauseRefs }: { documentText: string, clauses: ClassifiedClause[], clauseRefs: React.RefObject<HTMLSpanElement>[] }) => {
    const highlightedText = useMemo(() => {
        if (!documentText || !clauses || clauses.length === 0) {
            return <pre className="whitespace-pre-wrap font-body text-sm">{documentText || 'Document text is not available for this file type.'}</pre>;
        }

        let tempText = documentText;
        const clauseMap = new Map();
        
        clauses.forEach((item, index) => {
            const placeholder = `__CLAUSE_PLACEHOLDER_${index}__`;
            const escapedClause = escapeRegExp(item.clause.trim());
            const regex = new RegExp(escapedClause, 'g');
            if(tempText.match(regex)) {
                tempText = tempText.replace(regex, placeholder);
                clauseMap.set(placeholder, {item, index});
            }
        });

        const parts = tempText.split(/(__CLAUSE_PLACEHOLDER_\d+__)/g);

        return (
            <pre className="whitespace-pre-wrap font-body text-sm">
                {parts.map((part, index) => {
                    if (clauseMap.has(part)) {
                        const {item: clauseItem, index: clauseIndex} = clauseMap.get(part);
                        const colorClass = categoryColors[clauseItem.category] || categoryColors['Other'];
                        return (
                            <span key={index} ref={clauseRefs[clauseIndex]} className={`rounded-md px-1 py-0.5 ${colorClass} bg-opacity-30 transition-all duration-300`}>
                                {clauseItem.clause}
                            </span>
                        );
                    }
                    return <span key={index}>{part}</span>;
                })}
            </pre>
        );

    }, [documentText, clauses, clauseRefs]);

    return highlightedText;
};


export default function ClauseViewer({ clauses, documentText }: ClauseViewerProps) {
  const { toast } = useToast();

  const groupedClauses = useMemo(() => {
    if (!clauses) return {};
    return clauses.reduce((acc, clause) => {
      const { category } = clause;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(clause);
      return acc;
    }, {} as Record<string, ClassifiedClause[]>);
  }, [clauses]);

  const categories = Object.keys(groupedClauses).sort();

  const clauseRefs = useMemo(() => Array(clauses.length).fill(0).map(() => createRef<HTMLSpanElement>()), [clauses.length]);

  const handleClauseClick = (clauseText: string) => {
    const clauseIndex = clauses.findIndex(c => c.clause === clauseText);
    if (clauseIndex !== -1 && clauseRefs[clauseIndex].current) {
        const element = clauseRefs[clauseIndex].current;
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Add a temporary highlight effect
        element?.classList.add('bg-primary', 'text-primary-foreground');
        setTimeout(() => {
            element?.classList.remove('bg-primary', 'text-primary-foreground');
        }, 1500);
    }
  };

  const handleCopyClause = (clauseText: string) => {
    navigator.clipboard.writeText(clauseText).then(() => {
        toast({
            title: 'Clause Copied!',
            description: 'The clause text has been copied to your clipboard.',
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

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
      <Card className="shadow-lg h-fit lg:h-auto">
        <CardHeader>
          <CardTitle className="font-headline">Extracted Clauses</CardTitle>
          <CardDescription>
            Click a clause to view in document. Use the copy icon to save.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clauses && clauses.length > 0 ? (
            <ScrollArea className="h-[60vh] w-full">
              <Accordion type="multiple" className="w-full">
                {categories.map((category) => (
                  <AccordionItem value={category} key={category}>
                    <AccordionTrigger className="text-left hover:no-underline">
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold text-primary">{category}</span>
                        <Badge variant="outline" className={`${categoryColors[category] || categoryColors['Other']} mr-4`}>
                          {groupedClauses[category].length} clause(s)
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2">
                        {groupedClauses[category].map((item, index) => (
                          <li key={index} className="rounded-md border bg-background text-sm leading-relaxed group relative">
                            <p className="p-4 cursor-pointer" onClick={() => handleClauseClick(item.clause)}>{item.clause}</p>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleCopyClause(item.clause)}
                            >
                                <ClipboardCopy className="h-4 w-4" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>
          ) : (
            <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-8">
              <p>No clauses were found.</p>
              <p className="text-xs mt-1">The document might be empty or not contain recognizable legal clauses.</p>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="shadow-lg h-fit lg:h-auto">
        <CardHeader>
          <CardTitle className="font-headline">Original Document</CardTitle>
          <CardDescription>
            Clauses are highlighted in the original text.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
              <HighlightedDocument documentText={documentText} clauses={clauses} clauseRefs={clauseRefs} />
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
