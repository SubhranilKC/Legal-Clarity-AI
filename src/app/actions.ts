'use server';
import { getGeminiEmbedding, storeChunkEmbedding, getChunkEmbeddings, cosineSimilarity } from '@/lib/gemini-embeddings';
import { createJobQueue } from '@/lib/job-queue';
import { v4 as uuidv4 } from 'uuid';

// Create a BullMQ queue for Q&A jobs
const qaQueue = createJobQueue('qa');

// In-memory job result store for dev/fallback (keyed by jobId)
const inMemoryJobResults: Record<string, any> = {};

// Submit a Q&A job to the queue and return a job ID
export async function submitQAJob(documentContent: string, question: string, history: { question: string, answer: string }[], language: string): Promise<{ jobId: string }> {
  const jobId = uuidv4();
  if (qaQueue.add) {
    // BullMQ or in-memory queue
    await qaQueue.add('qa', { documentContent, question, history, language }, { jobId });
  } else {
    // Fallback: run immediately and store result
    answerQuestionAction(documentContent, question, history, language).then(result => {
      inMemoryJobResults[jobId] = { status: 'completed', result };
    }).catch(err => {
      inMemoryJobResults[jobId] = { status: 'failed', error: err?.message || 'Unknown error' };
    });
  }
  inMemoryJobResults[jobId] = { status: 'queued' };
  return { jobId };
}

// Get job status/result by job ID
export async function getQAJobResult(jobId: string): Promise<{ status: string, result?: any, error?: string }> {
  // BullMQ: check if this is a BullMQ queue (has getJob method)
  if (typeof (qaQueue as any).getJob === 'function') {
    const job = await (qaQueue as any).getJob(jobId);
    if (!job) return { status: 'not_found' };
    const state = await job.getState();
    if (state === 'completed') {
      return { status: 'completed', result: job.returnvalue };
    } else if (state === 'failed') {
      return { status: 'failed', error: job.failedReason };
    } else {
      return { status: state };
    }
  } else {
    // In-memory fallback
    return inMemoryJobResults[jobId] || { status: 'not_found' };
  }
}

import { extractAndClassifyLegalClauses, type ExtractAndClassifyLegalClausesOutput } from '@/ai/flows/extract-legal-clauses';
import { answerLegalQuestions, type AnswerLegalQuestionsOutput } from '@/ai/flows/answer-legal-questions';
import { improveLegalDocument, type ImproveLegalDocumentOutput } from '@/ai/flows/improve-legal-document';
import { summarizeLegalDocument, type SummarizeLegalDocumentOutput } from '@/ai/flows/summarize-legal-document';
import { humanizeResponse, type HumanizeResponseOutput } from '@/ai/flows/humanize-response';
import { detectRisksInClauses, type DetectRisksInClausesOutput } from '@/ai/flows/detect-risks-in-clauses';
import { extractTextFromDataUri } from '@/lib/document-utils';
import { generateReport, type GenerateReportOutput } from '@/ai/flows/generate-report';
import { checkCompliance, type CheckComplianceOutput } from '@/ai/flows/check-compliance';
import type { ClassifiedClause } from '@/types';
import { getSummaryFromCache, setSummaryInCache, simpleHash } from '@/lib/summary-cache';


async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  let lastError: Error | undefined;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (lastError.message?.includes('503 Service Unavailable') || lastError.message?.includes('429 Too Many Requests')) {
        // Exponential backoff
        await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
      } else {
        // Not a retryable error
        throw lastError;
      }
    }
  }
  throw lastError;
}


export async function analyzeDocumentAction(documentDataUri: string): Promise<Omit<ExtractAndClassifyLegalClausesOutput, 'clauses'> & { clauses: ClassifiedClause[] }> {
  try {
    const result = await withRetry(() => extractAndClassifyLegalClauses({ documentDataUri, language: undefined }));
    // Add a unique ID to each clause
    const clausesWithIds: ClassifiedClause[] = result.clauses.map((clause, index) => ({
        ...clause,
        id: `${Date.now()}-${index}`,
    }));
    return { ...result, clauses: clausesWithIds };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error in analyzeDocumentAction:', error.message);
      console.error('Stack trace:', error.stack);
    } else {
      console.error('Non-Error exception in analyzeDocumentAction:', error);
    }
    throw error;
  }
}

// Helper: detect if the question is a broad summary request
// Detect if the question is a broad summary request (robust, regex and keyword based)
function isBroadSummaryQuestion(question: string): boolean {
  const q = question.trim().toLowerCase();
  // Keyword/phrase patterns (expand as needed)
  const patterns = [
    'summarize', 'summary', 'overview', 'explain', 'content', 'state', 'cover', 'contain', 'what do', 'what does', 'what is', 'all documents', 'all files', 'these documents', 'these files', 'everything', 'give me', 'list', 'outline', 'describe', 'provide', 'show', 'details', 'key points', 'main points', 'main ideas', 'main topics', 'main clauses', 'main sections', 'main terms', 'main provisions', 'main obligations', 'main risks', 'main benefits', 'main exclusions', 'main definitions', 'main conditions', 'main requirements', 'main features', 'main coverage', 'main summary', 'main summary of', 'main summary for', 'main summary about', 'main summary on', 'main summary regarding', 'main summary concerning', 'main summary relating to', 'main summary with respect to', 'main summary in relation to', 'main summary in connection with', 'main summary in regard to', 'main summary in reference to', 'main summary in respect of', 'main summary in respect to', 'main summary in respect with', 'main summary in respect for', 'main summary in respect about', 'main summary in respect on', 'main summary in respect regarding', 'main summary in respect concerning', 'main summary in respect relating to', 'main summary in respect with respect to', 'main summary in respect in relation to', 'main summary in respect in connection with', 'main summary in respect in regard to', 'main summary in respect in reference to', 'main summary in respect in respect of', 'main summary in respect in respect to', 'main summary in respect in respect with', 'main summary in respect in respect for', 'main summary in respect in respect about', 'main summary in respect in respect on', 'main summary in respect in respect regarding', 'main summary in respect in respect concerning', 'main summary in respect in respect relating to', 'main summary in respect in respect with respect to', 'main summary in respect in respect in relation to', 'main summary in respect in respect in connection with', 'main summary in respect in respect in regard to', 'main summary in respect in respect in reference to', 'main summary in respect in respect in respect of', 'main summary in respect in respect in respect to', 'main summary in respect in respect in respect with', 'main summary in respect in respect in respect for', 'main summary in respect in respect in respect about', 'main summary in respect in respect in respect on', 'main summary in respect in respect in respect regarding', 'main summary in respect in respect in respect concerning', 'main summary in respect in respect in respect relating to', 'main summary in respect in respect in respect with respect to', 'main summary in respect in respect in respect in relation to', 'main summary in respect in respect in respect in connection with', 'main summary in respect in respect in respect in regard to', 'main summary in respect in respect in respect in reference to', 'main summary in respect in respect in respect in respect of', 'main summary in respect in respect in respect in respect to', 'main summary in respect in respect in respect in respect with', 'main summary in respect in respect in respect in respect for', 'main summary in respect in respect in respect in respect about', 'main summary in respect in respect in respect in respect on', 'main summary in respect in respect in respect in respect regarding', 'main summary in respect in respect in respect in respect concerning', 'main summary in respect in respect in respect in respect relating to', 'main summary in respect in respect in respect in respect with respect to',
  ];
  // If question contains any pattern and mentions "all" or "these" docs/files, treat as summary
  if ((q.includes('all documents') || q.includes('all files') || q.includes('these documents') || q.includes('these files') || q.includes('everything')) && patterns.some(p => q.includes(p))) {
    return true;
  }
  // Regex for common summary questions
  if (/summar(y|ize|ising|ization|ing)\b/.test(q) && /(all|these|every|multiple) (documents|files)/.test(q)) return true;
  if (/overview|explain|content|state|cover|contain/.test(q) && /(all|these|every|multiple) (documents|files)/.test(q)) return true;
  // Fallback: catch common summary requests
  if (/summar(y|ize|ising|ization|ing)\b/.test(q)) return true;
  return false;
}

// Helper: parse documentContent into an array of { name, fullText }
function parseDocumentContent(documentContent: string): { name: string, fullText: string }[] {
  // Assumes format: Document: {name}\n\n{fullText}\n\n---\n\n...
  const docs: { name: string, fullText: string }[] = [];
  const parts = documentContent.split(/\n\n---\n\n/);
  for (const part of parts) {
    const match = part.match(/^Document: (.+?)\n\n([\s\S]*)$/);
    if (match) {
      docs.push({ name: match[1].trim(), fullText: match[2].trim() });
    }
  }
  return docs;
}

// Helper: chunk a string into logical pieces (by paragraphs, up to maxChars)
function chunkText(text: string, maxChars: number = 12000): string[] {
  if (text.length <= maxChars) return [text];
  const paragraphs = text.split(/\n{2,}/);
  const chunks: string[] = [];
  let current = '';
  for (const para of paragraphs) {
    if ((current + '\n\n' + para).length > maxChars) {
      if (current) chunks.push(current);
      current = para;
    } else {
      current = current ? current + '\n\n' + para : para;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

// New: Generate and store Gemini embeddings for each chunk (call after chunking)
export async function embedAndStoreChunks(docId: string, chunks: string[]): Promise<void> {
  for (let i = 0; i < chunks.length; i++) {
    const chunkId = `${docId}:chunk:${i}`;
    try {
      const embedding = await getGeminiEmbedding(chunks[i]);
      storeChunkEmbedding(docId, chunkId, embedding, chunks[i]);
    } catch (e) {
      // Log and skip embedding errors
      console.error('Embedding error for chunk', chunkId, e);
    }
  }
}

export async function answerQuestionAction(documentContent: string, question: string, history: { question: string, answer: string }[], language: string): Promise<AnswerLegalQuestionsOutput> {
  try {
    if (isBroadSummaryQuestion(question)) {
      const docs = parseDocumentContent(documentContent);
      // Sequentially process each document and update job progress (for progress bar)
      const summariesResult: { name: string; summary: string; chunkCount: number; errors?: string[] }[] = [];
      // Progress tracking: if running in a job, update job status
      let jobId = undefined;
      if (typeof global !== 'undefined' && (global as any).currentJobId) jobId = (global as any).currentJobId;
      for (let i = 0; i < docs.length; i++) {
        const doc = docs[i];
        if (!doc.fullText) {
          summariesResult.push({ name: doc.name, summary: 'No content available.', chunkCount: 0 });
          // Update progress
          if (jobId && typeof global !== 'undefined' && (global as any).updateJobProgress) {
            (global as any).updateJobProgress(jobId, {
              currentDoc: i + 1,
              totalDocs: docs.length,
              completedSummaries: [...summariesResult],
              status: 'in_progress',
            });
          }
          continue;
        }
        const chunks = chunkText(doc.fullText);
        let chunkSummaries: string[] = [];
        let errors: string[] = [];
        for (let j = 0; j < chunks.length; j++) {
          try {
            const chunkSummary = (await withRetry(() => summarizeLegalDocument({ documentContent: chunks[j], language }))).summary;
            chunkSummaries.push(chunkSummary);
          } catch (e) {
            errors.push(`Chunk ${j+1}: Could not summarize due to an error: ${e instanceof Error ? e.message : String(e)}`);
            if (typeof console !== 'undefined') console.error(`Summarization error for doc '${doc.name}', chunk ${j+1}:`, e);
          }
          // Update chunk progress (optional, for fine-grained progress)
          if (jobId && typeof global !== 'undefined' && (global as any).updateJobProgress) {
            (global as any).updateJobProgress(jobId, {
              currentDoc: i + 1,
              totalDocs: docs.length,
              currentChunk: j + 1,
              totalChunks: chunks.length,
              completedSummaries: [...summariesResult],
              status: 'in_progress',
            });
          }
        }
        let finalSummary = '';
        if (chunkSummaries.length === 1) {
          finalSummary = chunkSummaries[0];
        } else if (chunkSummaries.length > 1) {
          try {
            finalSummary = (await withRetry(() => summarizeLegalDocument({ documentContent: chunkSummaries.join('\n\n'), language }))).summary;
          } catch (e) {
            finalSummary = chunkSummaries.join('\n\n');
            errors.push('Could not generate a combined summary, showing chunk summaries instead.');
            if (typeof console !== 'undefined') console.error(`Combined summary error for doc '${doc.name}':`, e);
          }
        } else {
          finalSummary = 'No summary could be generated.';
        }
        summariesResult.push({ name: doc.name, summary: finalSummary, chunkCount: chunks.length, errors: errors.length ? errors : undefined });
        // Update progress after each document
        if (jobId && typeof global !== 'undefined' && (global as any).updateJobProgress) {
          (global as any).updateJobProgress(jobId, {
            currentDoc: i + 1,
            totalDocs: docs.length,
            completedSummaries: [...summariesResult],
            status: i + 1 === docs.length ? 'completed' : 'in_progress',
          });
        }
      }

      // Advanced suggestion logic
      let followUpSuggestions: string[] = [];
      if (summariesResult.length === 1) {
        followUpSuggestions = [
          `Would you like to see a detailed breakdown of sections or clauses in '${summariesResult[0].name}'?`,
          `Do you want to search for a specific term or clause in '${summariesResult[0].name}'?`,
        ];
      } else if (summariesResult.length > 1) {
        followUpSuggestions = [
          'Would you like to see a detailed breakdown of a specific document?',
          'Do you want to compare two documents on a specific topic?',
          'Would you like to search for a specific clause or keyword across all documents?',
        ];
      }

      // Format the answer with details (do not change output structure)
      const answer = summariesResult.map(s => {
        let out = `Document: '${s.name}'`;
        if (s.chunkCount > 1) out += ` (summarized in ${s.chunkCount} parts)`;
        out += `\n- ${s.summary.replace(/\n/g, '\n- ')}`;
        if (s.errors) out += `\n[Note: ${s.errors.join(' ')}]`;
        return out;
      }).join('\n\n');
      return {
        answer,
        feedback: 'Detailed summaries of all documents are provided below. Large documents are chunked and summarized in parts for accuracy.',
        citations: [],
        followUpQuestions: followUpSuggestions,
      };
    }

    // Default: per-document QA logic (always process all docs)
    const docs = parseDocumentContent(documentContent);
    const perDocResults: any[] = [];
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      if (!doc.fullText) {
        perDocResults.push({
          name: doc.name,
          answer: 'No content available.',
          feedback: '',
          citations: [],
          followUpQuestions: [],
          status: 'not_found',
        });
        continue;
      }
      // Run Q&A for this document, strictly sequentially, and handle errors gracefully
      try {
        const qaResult = await withRetry(() => answerLegalQuestions({ documentContent: doc.fullText, question, history, language }));
        const [humanizedAnswer, humanizedFeedback] = await Promise.all([
          withRetry(() => humanizeResponse({ rawText: qaResult.answer })),
          withRetry(() => humanizeResponse({ rawText: qaResult.feedback }))
        ]);
        const isNotFound = qaResult.answer.trim().toLowerCase().includes('cannot be found in the provided document');
        perDocResults.push({
          name: doc.name,
          answer: humanizedAnswer.humanizedText,
          feedback: humanizedFeedback.humanizedText,
          citations: qaResult.citations,
          followUpQuestions: qaResult.followUpQuestions,
          status: isNotFound ? 'not_found' : 'answered',
        });
      } catch (e) {
        perDocResults.push({
          name: doc.name,
          answer: 'An error occurred while processing this document.',
          feedback: '',
          citations: [],
          followUpQuestions: [],
          status: 'error',
        });
      }
    }
    // Optionally: update job progress here if running in a job
    // Return both legacy and per-document fields for compatibility
    const answer = perDocResults.map(r => `Document: '${r.name}'\n- ${r.answer}`).join('\n\n');
    // Combine all feedbacks for a global feedback section
    const feedback = perDocResults
      .filter(r => r.feedback && r.feedback.trim() && r.feedback.trim().toLowerCase() !== 'no feedback available.')
      .map(r => `Document: '${r.name}'\n${r.feedback}`)
      .join('\n\n');
    return Object.assign({
      answer,
      feedback,
      citations: [],
      followUpQuestions: [],
    }, { perDocument: perDocResults });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error in answerQuestionAction:', error.message);
      console.error('Stack trace:', error.stack);
    } else {
      console.error('Non-Error exception in answerQuestionAction:', error);
    }
    throw error;
  }
}

export async function improveDocumentAction(documentContent: string, language?: string): Promise<ImproveLegalDocumentOutput> {
  try {
    const response = await withRetry(() => improveLegalDocument({ documentContent, language }));
    return response;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error in improveDocumentAction:', error.message);
      console.error('Stack trace:', error.stack);
    } else {
      console.error('Non-Error exception in improveDocumentAction:', error);
    }
    throw error;
  }
}

export async function summarizeDocumentAction(documentContent: string): Promise<HumanizeResponseOutput> {
    try {
      const initialResponse = await withRetry(() => summarizeLegalDocument({ documentContent, language: undefined }));
      const humanizedSummary = await withRetry(() => humanizeResponse({ rawText: initialResponse.summary }));
      return humanizedSummary;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error in summarizeDocumentAction:', error.message);
            console.error('Stack trace:', error.stack);
        } else {
            console.error('Non-Error exception in summarizeDocumentAction:', error);
        }
        throw error;
    }
  }

export async function humanizeDocumentAction(documentContent: string): Promise<HumanizeResponseOutput> {
  try {
    const response = await withRetry(() => humanizeResponse({ rawText: documentContent }));
    return response;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error in humanizeDocumentAction:', error.message);
      console.error('Stack trace:', error.stack);
    } else {
      console.error('Non-Error exception in humanizeDocumentAction:', error);
    }
    throw error;
  }
}


export async function detectRisksAction(documentDataUri: string, documentName: string): Promise<{ risks: DetectRisksInClausesOutput['risks'], documentName: string }> {
    try {
        const documentContent = await extractTextFromDataUri(documentDataUri);
        const { risks } = await withRetry(() => detectRisksInClauses({ documentContent }));
        return { risks, documentName }; 
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error in detectRisksAction:', error.message);
            console.error('Stack trace:', error.stack);
        } else {
            console.error('Non-Error exception in detectRisksAction:', error);
        }
        throw error;
    }
}

export async function generateReportAction(documentContent: string): Promise<GenerateReportOutput> {
    try {
        const result = await withRetry(() => generateReport({ documentContent }));
        
        const [humanizedParties, humanizedObligations, humanizedRisks, humanizedSummary] = await Promise.all([
            withRetry(() => humanizeResponse({ rawText: result.partiesInvolved })),
            withRetry(() => humanizeResponse({ rawText: result.keyObligations })),
            withRetry(() => humanizeResponse({ rawText: result.risksAndLiabilities })),
            withRetry(() => humanizeResponse({ rawText: result.overallSummary }))
        ]);

        return {
            partiesInvolved: humanizedParties.humanizedText,
            keyObligations: humanizedObligations.humanizedText,
            risksAndLiabilities: humanizedRisks.humanizedText,
            overallSummary: humanizedSummary.humanizedText,
        };
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error in generateReportAction:', error.message);
            console.error('Stack trace:', error.stack);
        } else {
            console.error('Non-Error exception in generateReportAction:', error);
        }
        throw error;
    }
}


export async function checkComplianceAction(clause: string, regulation: string): Promise<CheckComplianceOutput> {
    try {
      return await withRetry(() => checkCompliance({ clause, regulation }));
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error in checkComplianceAction:', error.message);
        console.error('Stack trace:', error.stack);
      } else {
        console.error('Non-Error exception in checkComplianceAction:', error);
      }
      throw error;
    }
  }
