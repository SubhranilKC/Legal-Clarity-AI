// Job worker for background document Q&A/summarization (Phase 2)
// Run this as a separate process for background job processing

import { createJobWorker } from '@/lib/job-queue';
import { answerQuestionAction } from './actions';

// Worker for the 'qa' queue
createJobWorker('qa', async (data) => {
  // data: { documentContent, question, history, language }
  return await answerQuestionAction(data.documentContent, data.question, data.history, data.language);
});

console.log('QA job worker started.');
