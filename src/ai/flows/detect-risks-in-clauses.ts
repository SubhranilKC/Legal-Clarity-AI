'use server';

/**
 * @fileOverview Detects potential risks in legal document clauses.
 *
 * - detectRisksInClauses - A function that takes a document's content and returns a list of clauses with risk assessments.
 * - DetectRisksInClausesInput - The input type for the function.
 * - DetectRisksInClausesOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectRisksInClausesInputSchema = z.object({
  documentContent: z.string().describe('The full text content of the legal document to analyze for risks.'),
});
export type DetectRisksInClausesInput = z.infer<typeof DetectRisksInClausesInputSchema>;


const RiskResultSchema = z.object({
    clause: z.string().describe('The exact text of the legal clause that was analyzed.'),
    riskLevel: z.enum(['Low', 'Medium', 'High']).describe('The assessed risk level for the clause.'),
    explanation: z.string().describe('A detailed explanation of why the clause was assigned its specific risk level.'),
});

const DetectRisksInClausesOutputSchema = z.object({
  risks: z.array(RiskResultSchema).describe('An array of identified risks, with each object containing the clause, its risk level, and an explanation.'),
});
export type DetectRisksInClausesOutput = z.infer<typeof DetectRisksInClausesOutputSchema>;


export async function detectRisksInClauses(input: DetectRisksInClausesInput): Promise<DetectRisksInClausesOutput> {
  return detectRisksInClausesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectRisksInClausesPrompt',
  input: {schema: DetectRisksInClausesInputSchema},
  output: {schema: DetectRisksInClausesOutputSchema},
  prompt: `You are an expert legal risk analyst. Your task is to analyze the provided legal document, identify individual clauses, and assess the potential risk associated with each clause.

For each distinct clause or provision in the document, you must:
1.  Identify the full text of the clause.
2.  Evaluate the clause for potential risks, such as ambiguity, one-sidedness, or potential for legal disputes.
3.  Assign a risk level: 'Low', 'Medium', or 'High'.
4.  Provide a clear, concise explanation for your risk assessment. Justify why the clause is rated as low, medium, or high risk.

Return the result as a single JSON object containing a 'risks' array. Each element in the array must be an object with three fields: 'clause', 'riskLevel', and 'explanation'.

If the document is empty or contains no discernible clauses, return a valid JSON object with an empty 'risks' array: {"risks": []}.

Document to Analyze:
{{{documentContent}}}
`,
});

const detectRisksInClausesFlow = ai.defineFlow(
  {
    name: 'detectRisksInClausesFlow',
    inputSchema: DetectRisksInClausesInputSchema,
    outputSchema: DetectRisksInClausesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
