'use server';

/**
 * @fileOverview Extracts and classifies legal clauses from a document and returns the full document text.
 *
 * - extractAndClassifyLegalClauses - Extracts and classifies legal clauses from a document.
 * - ExtractAndClassifyLegalClausesInput - The input type for the function.
 * - ExtractAndClassifyLegalClausesOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { extractTextFromDataUri } from '@/lib/document-utils';


const ExtractAndClassifyLegalClausesInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe('The data URI of the legal document to extract clauses from.'),
  language: z.string().optional().describe('The language for the clause extraction/classification.'),
});
export type ExtractAndClassifyLegalClausesInput = z.infer<typeof ExtractAndClassifyLegalClausesInputSchema>;

const ExtractAndClassifyLegalClausesOutputSchema = z.object({
  clauses: z
    .array(
      z.object({
        clause: z.string().describe('The text of the individual legal clause.'),
        category: z.string().describe('The classified category of the legal clause.'),
      })
    )
    .describe('An array of legal clauses extracted and classified from the document.'),
  fullText: z.string().describe("The full text content of the document."),
});
export type ExtractAndClassifyLegalClausesOutput = z.infer<typeof ExtractAndClassifyLegalClausesOutputSchema>;


export async function extractAndClassifyLegalClauses(input: ExtractAndClassifyLegalClausesInput): Promise<ExtractAndClassifyLegalClausesOutput> {
  const fullText = await extractTextFromDataUri(input.documentDataUri);
  if (!fullText.trim()) {
    return { clauses: [], fullText: '' };
  }
  const result = await extractAndClassifyLegalClausesFlow({ documentText: fullText });
  return { ...result, fullText };
}

const prompt = ai.definePrompt({
  name: 'extractAndClassifyLegalClausesPrompt',
  input: {schema: z.object({ documentText: z.string(), language: z.string().optional() })},
  output: {schema: z.object({
      clauses: z
        .array(
          z.object({
            clause: z.string().describe('The text of the individual legal clause.'),
            category: z.string().describe('The classified category of the legal clause.'),
          })
        )
        .describe('An array of legal clauses extracted and classified from the document.'),
    })
  },
  prompt: `You are a legal expert. Your task is to extract all legal clauses from the provided document and classify each one into a relevant category.

  Carefully review the entire document. Identify distinct legal clauses, which are specific provisions or articles within the contract.

  For each clause you identify, you must assign it to one of the following predefined categories:
  - Liability
  - Intellectual Property
  - Confidentiality
  - Termination
  - Payment
  - Warranty
  - Indemnification
  - Dispute Resolution
  - Data Protection
  - Compliance
  - Other (use this for any clause that does not fit into the other categories)

{{#if language}}
You MUST provide all clause text and category names in the following language: {{{language}}}.
The only exception is for direct quotes, which should remain in their original language from the document.
{{/if}}

  Return the result as a single JSON object. This object must contain a 'clauses' array. Each element in the array should be an object with two fields: 'clause' (the full text of the clause) and 'category' (the assigned category).

  If you cannot find any clauses in the document, or if the document is empty or unreadable, you MUST return a valid JSON object with an empty 'clauses' array: e.g., {"clauses": []}. Do not return an error or any other text.

  Document:
  {{{documentText}}}`,
});

const extractAndClassifyLegalClausesFlow = ai.defineFlow(
  {
    name: 'extractAndClassifyLegalClausesFlow',
    inputSchema: z.object({ documentText: z.string() }),
    outputSchema: z.object({
        clauses: z
          .array(
            z.object({
              clause: z.string().describe('The text of the individual legal clause.'),
              category: z.string().describe('The classified category of the legal clause.'),
            })
          )
          .describe('An array of legal clauses extracted and classified from the document.'),
      }),
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
