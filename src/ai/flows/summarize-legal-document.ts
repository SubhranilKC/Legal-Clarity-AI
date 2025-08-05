'use server';

/**
 * @fileOverview Implements a Genkit flow for summarizing a legal document.
 *
 * - summarizeLegalDocument - A function that takes a document's content and returns a summary.
 * - SummarizeLegalDocumentInput - The input type for the summarizeLegalDocument function.
 * - SummarizeLegalDocumentOutput - The return type for the summarizeLegalDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeLegalDocumentInputSchema = z.object({
  documentContent: z.string().describe('The content of the legal document to be summarized.'),
  language: z.string().optional().describe('The language for the summary.'),
});
export type SummarizeLegalDocumentInput = z.infer<typeof SummarizeLegalDocumentInputSchema>;

const SummarizeLegalDocumentOutputSchema = z.object({
  summary: z.string().describe('The AI-generated summary of the legal document.'),
});
export type SummarizeLegalDocumentOutput = z.infer<typeof SummarizeLegalDocumentOutputSchema>;

export async function summarizeLegalDocument(input: SummarizeLegalDocumentInput): Promise<SummarizeLegalDocumentOutput> {
  return summarizeLegalDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeLegalDocumentPrompt',
  input: {schema: SummarizeLegalDocumentInputSchema},
  output: {schema: SummarizeLegalDocumentOutputSchema},
  prompt: `You are a world-class legal assistant. Please review the following legal document and provide a concise summary.
  
  The summary should highlight the key terms, obligations, and potential risks. Do not use any markdown or special formatting.

{{#if language}}
You MUST provide your entire summary in the following language: {{{language}}}.
The only exception is for direct quotes, which should remain in their original language from the document.
{{/if}}

  Original Document:
  {{{documentContent}}}
  `,
});

const summarizeLegalDocumentFlow = ai.defineFlow(
  {
    name: 'summarizeLegalDocumentFlow',
    inputSchema: SummarizeLegalDocumentInputSchema,
    outputSchema: SummarizeLegalDocumentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
