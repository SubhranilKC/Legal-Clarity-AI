'use server';

/**
 * @fileOverview Implements a Genkit flow for checking a legal clause against a specific regulation.
 *
 * - checkCompliance - A function that takes a clause and a regulation, and returns a compliance analysis.
 * - CheckComplianceInput - The input type for the function.
 * - CheckComplianceOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CheckComplianceInputSchema = z.object({
  clause: z.string().describe('The legal clause to be checked for compliance.'),
  regulation: z.string().describe('The name of the regulation to check against (e.g., "GDPR", "HIPAA").'),
});
export type CheckComplianceInput = z.infer<typeof CheckComplianceInputSchema>;

const CheckComplianceOutputSchema = z.object({
  status: z.enum(['compliant', 'partial', 'non-compliant']).describe('The compliance status of the clause.'),
  explanation: z.string().describe('A detailed explanation of the compliance status.'),
  missingElements: z.array(z.string()).optional().describe('A list of elements that are missing for full compliance, if any.'),
  suggestion: z.string().optional().describe('A recommended rewrite of the clause to improve compliance.'),
});
export type CheckComplianceOutput = z.infer<typeof CheckComplianceOutputSchema>;

export async function checkCompliance(input: CheckComplianceInput): Promise<CheckComplianceOutput> {
  return checkComplianceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'checkCompliancePrompt',
  input: { schema: CheckComplianceInputSchema },
  output: { schema: CheckComplianceOutputSchema },
  prompt: `You are a legal compliance expert. Your task is to analyze a single legal clause and determine if it complies with a specific regulation.

Analyze the given clause against the rules of the specified regulation.

Regulation: {{{regulation}}}
Clause: "{{{clause}}}"

Based on your analysis, you must return a JSON object with the following fields:
- "status": One of 'compliant', 'partial', or 'non-compliant'.
- "explanation": A clear and detailed explanation of why the clause has the given status.
- "missingElements": An array of strings listing any specific elements that are missing for full compliance. If fully compliant, this should be an empty array.
- "suggestion": A concrete, rewritten version of the clause that would make it compliant. If no rewrite is needed, this can be omitted.
`,
});

const checkComplianceFlow = ai.defineFlow(
  {
    name: 'checkComplianceFlow',
    inputSchema: CheckComplianceInputSchema,
    outputSchema: CheckComplianceOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
