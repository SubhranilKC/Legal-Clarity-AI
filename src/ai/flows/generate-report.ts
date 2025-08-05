
'use server';

/**
 * @fileOverview Implements a Genkit flow for generating a comprehensive report on a legal document.
 *
 * - generateReport - A function that takes a document's content and returns a structured report.
 * - GenerateReportInput - The input type for the function.
 * - GenerateReportOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateReportInputSchema = z.object({
  documentContent: z.string().describe('The full text content of the legal document to be reported on.'),
});
export type GenerateReportInput = z.infer<typeof GenerateReportInputSchema>;

const GenerateReportOutputSchema = z.object({
  partiesInvolved: z.string().describe("A summary of the parties involved in the agreement."),
  keyObligations: z.string().describe("An analysis of the key obligations, responsibilities, and duties for each party."),
  risksAndLiabilities: z.string().describe("An identification of potential risks, liabilities, and indemnification clauses."),
  overallSummary: z.string().describe("A concise overall summary and conclusion of the document's purpose and key terms."),
});
export type GenerateReportOutput = z.infer<typeof GenerateReportOutputSchema>;

export async function generateReport(input: GenerateReportInput): Promise<GenerateReportOutput> {
  return generateReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateReportPrompt',
  input: { schema: GenerateReportInputSchema },
  output: { schema: GenerateReportOutputSchema },
  prompt: `You are an expert legal analyst. Your task is to generate a comprehensive, structured report based on the provided legal document.

Analyze the document and extract the following information. Present each section clearly. Use bullet points where appropriate to improve readability.

1.  **Parties Involved:** Identify all parties mentioned in the document and their roles.
2.  **Key Obligations:** Detail the primary responsibilities, duties, and commitments of each party.
3.  **Risks and Liabilities:** Pinpoint potential risks, liabilities, and any indemnification or limitation of liability clauses.
4.  **Overall Summary:** Provide a concise conclusion that summarizes the document's main purpose and most critical terms.

Do not add conversational fluff or introductory sentences. The output must be a clean JSON object with the requested fields.

Document Content:
{{{documentContent}}}
`,
});

const generateReportFlow = ai.defineFlow(
  {
    name: 'generateReportFlow',
    inputSchema: GenerateReportInputSchema,
    outputSchema: GenerateReportOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
