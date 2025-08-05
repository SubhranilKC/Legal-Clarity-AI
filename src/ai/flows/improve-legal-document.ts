'use server';

/**
 * @fileOverview Implements a Genkit flow for improving a legal document by suggesting specific replacements.
 *
 * - improveLegalDocument - A function that takes a document's content and returns a list of proposed improvements.
 * - ImproveLegalDocumentInput - The input type for the improveLegalDocument function.
 * - ImproveLegalDocumentOutput - The return type for the improveLegalDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImproveLegalDocumentInputSchema = z.object({
  documentContent: z.string().describe('The content of the legal document to be improved.'),
  language: z.string().optional().describe('The language for the improvements.'),
});
export type ImproveLegalDocumentInput = z.infer<typeof ImproveLegalDocumentInputSchema>;

const ImproveLegalDocumentOutputSchema = z.object({
  replacements: z.array(z.object({
    original: z.string().describe('The exact text from the original document to be replaced.'),
    improved: z.string().describe('The new, improved text to replace the original.'),
  })).describe('A list of proposed text replacements to improve the document.'),
});
export type ImproveLegalDocumentOutput = z.infer<typeof ImproveLegalDocumentOutputSchema>;

export async function improveLegalDocument(input: ImproveLegalDocumentInput): Promise<ImproveLegalDocumentOutput> {
  return improveLegalDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'improveLegalDocumentPrompt',
  input: {schema: ImproveLegalDocumentInputSchema},
  output: {schema: ImproveLegalDocumentOutputSchema},
  prompt: `You are a world-class lawyer. Please review the following legal document and identify areas for improvement.

  Things to look for:
  - Clarity and simplicity
  - Removal of ambiguous language
  - Ensuring all necessary clauses are present for this type of document
  - Correcting any legal inconsistencies or potential issues

{{#if language}}
You MUST provide all improvements and explanations in the following language: {{{language}}}.
The only exception is for direct quotes, which should remain in their original language from the document.
{{/if}}

  Instead of rewriting the entire document, you must provide a list of specific replacements. For each improvement, provide the exact original text snippet that should be replaced and the new, improved text that should replace it.

  Return the result as a JSON object with a 'replacements' array. Each item in the array should be an object with 'original' and 'improved' fields.

  Original Document:
  {{{documentContent}}}
  `,
});

const improveLegalDocumentFlow = ai.defineFlow(
  {
    name: 'improveLegalDocumentFlow',
    inputSchema: ImproveLegalDocumentInputSchema,
    outputSchema: ImproveLegalDocumentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
