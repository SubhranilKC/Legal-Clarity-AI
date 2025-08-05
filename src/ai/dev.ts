'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/extract-legal-clauses.ts';
import '@/ai/flows/answer-legal-questions.ts';
import '@/ai/flows/improve-legal-document.ts';
import '@/ai/flows/summarize-legal-document.ts';
import '@/ai/flows/humanize-response.ts';
import '@/ai/flows/detect-risks-in-clauses.ts';
import '@/ai/flows/generate-report.ts';
import '@/ai/flows/check-compliance.ts';
