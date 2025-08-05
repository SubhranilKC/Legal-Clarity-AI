export type ClassifiedClause = {
  id: string; // Unique identifier for the clause
  clause: string;
  category: string;
};

export type RiskResult = {
  clause: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  explanation: string;
};


export type QAResult = {
  answer: string;
  explanation?: string;
  assumptions?: string;
  feedback: string;
  citations: string[];
  followUpQuestions: string[];
  coverageStatus?: 'yes' | 'no' | 'not mentioned'; // Explicit coverage status for robust summary
  summary?: string; // One-sentence summary for display
};

export type ConversationTurn = {
  question: string;
  scope: string[]; // Array of document names
  result: QAResult;
};

export type Improvement = {
    original: string;
    improved: string;
};

export type AnalyzedDocument = {
  name: string;
  clauses: ClassifiedClause[];
  fullText: string;
  dataUri?: string; // dataUri is optional and shouldn't be stored long-term
};

export type ComplianceResult = {
  clause: string;
  regulation: string;
  status: 'compliant' | 'partial' | 'non-compliant';
  explanation: string;
  suggestion?: string;
};

// Maps a document name to its compliance results
// The inner key is the clause ID
export type ComplianceState = Record<string, Record<string, Partial<ComplianceResult> & { isLoading?: boolean }>>;

export type AppState = {
    documents: AnalyzedDocument[];
    activeDocumentName: string;
    conversation: ConversationTurn[];
    improvingState: Record<string, { inProgress: boolean; content: string; replacements: Improvement[] }>;
    summarizingState: Record<string, { inProgress: boolean; content: string }>;
    complianceState: ComplianceState;
};
