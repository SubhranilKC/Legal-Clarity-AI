'use server';

/**
 * @fileOverview Implements a Genkit flow for answering legal questions based on uploaded documents.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { translateText, normalizeLanguage } from '@/lib/utils';

// Language map for translation clarity
const LANGUAGE_NAMES: Record<string, string> = {
  af: 'Afrikaans', sq: 'Albanian', am: 'Amharic', ar: 'Arabic', hy: 'Armenian', az: 'Azerbaijani', eu: 'Basque', be: 'Belarusian', bn: 'Bengali',
  bs: 'Bosnian', bg: 'Bulgarian', ca: 'Catalan', ceb: 'Cebuano', ny: 'Chichewa', 'zh-CN': 'Chinese (Simplified)', 'zh-TW': 'Chinese (Traditional)',
  co: 'Corsican', hr: 'Croatian', cs: 'Czech', da: 'Danish', nl: 'Dutch', en: 'English', eo: 'Esperanto', et: 'Estonian', tl: 'Filipino', fi: 'Finnish',
  fr: 'French', fy: 'Frisian', gl: 'Galician', ka: 'Georgian', de: 'German', el: 'Greek', gu: 'Gujarati', ht: 'Haitian Creole', ha: 'Hausa',
  Hawaiian: 'Hawaiian', Hebrew: 'Hebrew', Hindi: 'Hindi', Hmong: 'Hmong', Hungarian: 'Hungarian', Icelandic: 'Icelandic', Igbo: 'Igbo',
  Indonesian: 'Indonesian', Irish: 'Irish', Italian: 'Italian', Japanese: 'Japanese', Javanese: 'Javanese', Kannada: 'Kannada', Kazakh: 'Kazakh',
  Khmer: 'Khmer', Kinyarwanda: 'Kinyarwanda', Korean: 'Korean', 'Kurdish (Kurmanji)': 'Kurdish (Kurmanji)', Kyrgyz: 'Kyrgyz', Lao: 'Lao',
  Latin: 'Latin', Latvian: 'Latvian', Lithuanian: 'Lithuanian', Luxembourgish: 'Luxembourgish', Macedonian: 'Macedonian', Malagasy: 'Malagasy',
  Malay: 'Malay', Malayalam: 'Malayalam', Maltese: 'Maltese', Maori: 'Maori', Marathi: 'Marathi', Mongolian: 'Mongolian',
  'Myanmar (Burmese)': 'Myanmar (Burmese)', Nepali: 'Nepali', Norwegian: 'Norwegian', 'Odia (Oriya)': 'Odia (Oriya)', Pashto: 'Pashto',
  Persian: 'Persian', Polish: 'Polish', Portuguese: 'Portuguese', Punjabi: 'Punjabi', Romanian: 'Romanian', Russian: 'Russian', Samoan: 'Samoan',
  'Scots Gaelic': 'Scots Gaelic', Serbian: 'Serbian', Sesotho: 'Sesotho', Shona: 'Shona', Sindhi: 'Sindhi', Sinhala: 'Sinhala', Slovak: 'Slovak',
  Slovenian: 'Slovenian', Somali: 'Somali', Spanish: 'Spanish', Sundanese: 'Sundanese', Swahili: 'Swahili', Swedish: 'Swedish', Tajik: 'Tajik',
  Tamil: 'Tamil', Tatar: 'Tatar', Telugu: 'Telugu', Thai: 'Thai', Turkish: 'Turkish', Turkmen: 'Turkmen', Ukrainian: 'Ukrainian', Urdu: 'Urdu',
  Uyghur: 'Uyghur', Uzbek: 'Uzbek', Vietnamese: 'Vietnamese', Welsh: 'Welsh', Xhosa: 'Xhosa', Yiddish: 'Yiddish', Yoruba: 'Yoruba', Zulu: 'Zulu'
};

// Schemas
const ConversationTurnSchema = z.object({
  question: z.string().describe("A question that was previously asked."),
  answer: z.string().describe("The answer that was previously given.")
});

const AnswerLegalQuestionsInputSchema = z.object({
  question: z.string().describe('The question asked by the user about the legal document.'),
  documentContent: z.string().describe('The content of the uploaded legal document(s).'),
  history: z.array(ConversationTurnSchema).optional().describe('The history of the conversation so far.'),
  language: z.string().optional().describe('The language for the answer.'),
});
export type AnswerLegalQuestionsInput = z.infer<typeof AnswerLegalQuestionsInputSchema>;

const AnswerLegalQuestionsOutputSchema = z.object({
  answer: z.string().describe('The answer based on the legal document.'),
  feedback: z.string().describe('Feedback or clause analysis.'),
  citations: z.array(z.string()).describe('Supporting quotes from the document.'),
  followUpQuestions: z.array(z.string()).describe('Suggested follow-up questions.'),
  coverageStatus: z.enum(['yes', 'no', 'not mentioned']).optional(),
  summary: z.string().optional(),
});
export type AnswerLegalQuestionsOutput = z.infer<typeof AnswerLegalQuestionsOutputSchema>;

// Extended schema
const AnswerLegalQuestionsPromptInputSchema = AnswerLegalQuestionsInputSchema.extend({
  languageName: z.string().optional(),
});

// Prompt definition
const prompt = ai.definePrompt({
  name: 'answerLegalQuestionsPrompt',
  input: { schema: AnswerLegalQuestionsPromptInputSchema },
  output: { schema: AnswerLegalQuestionsOutputSchema },
  prompt: `{{#if language}}
IMPORTANT: All responses MUST be in {{languageName}} ({{language}}). If not, the answer will be rejected.
{{/if}}

You are a highly experienced legal policy assistant. Your job is to answer a user's question using ONLY the provided document(s), following strict legal reasoning and citation rules.

---

## 📌 INSTRUCTIONS FOR LEGAL CLARITY AI

### 🚫 Core Constraints
- DO NOT use any external knowledge.
- DO NOT assume or infer anything not explicitly stated in the documents.
- DO NOT reference general insurance knowledge or "typical" policy behavior.
- DO NOT give "yes" or "no" unless supported by a specific clause.

---

## 🧠 UNDERSTAND THE QUESTION

You are given:
- A **user query** (may include: age, gender, location, policy name, and scenario).
- One or more **policy documents**.
- Optional **chat history**.

Determine:
- The policy type being referenced: Health, Motor, Travel, Life, etc.
- Whether the uploaded document matches the policy type being asked about.
- If not matched → Respond: _"The provided document(s) do not match the domain of the question. Unable to determine coverage."_

---

## 🔍 DOCUMENT ANALYSIS PROCESS

1. Analyze all documents **sequentially**.
2. Identify **relevant clauses** that clearly answer the question.
   - A document is relevant **only if** it explicitly mentions or excludes the scenario.
3. Ignore all documents that are unrelated, silent, or from a different policy domain.
4. If documents contradict each other (one says covered, another says not), choose \`"not mentioned"\` as the \`coverageStatus\`.

---

## ❓ IF QUESTION IS VAGUE OR UNANSWERABLE

Examples:
- Too short or keyword-only (e.g., “pre-existing?”)
- References a condition outside the scope of the documents (e.g., car insurance asked but health doc provided)

Respond with:
- _"The question is too vague or lacks sufficient detail to provide a precise answer."_
**OR**
- _"The document provided is unrelated to the question. Please upload the correct policy document."_

---

## 📄 OUTPUT FORMAT (MANDATORY FIELDS)

Return a **valid JSON** object containing:

- \`coverageStatus\`: MUST be one of \`"yes"\`, \`"no"\`, or \`"not mentioned"\`
- \`summary\`: One-sentence answer that begins with "Yes", "No", or "Not mentioned"
- \`answer\`: Detailed bullet points with clause references
- \`citations\`: Direct quotes from the policy with source, clause number, and page
- \`feedback\`: Clause-based analysis of why the question was answered the way it was
- \`followUpQuestions\`: 2–3 possible questions the user might ask next (e.g., waiting period, exceptions)

---

## 🧾 CLAUSE STRUCTURE

### ✅ INCLUDE if covered:
- Mention clause number, benefit limits, conditions, and exceptions.
- Example: "Clause 12.1 on Page 14 states coverage for XYZ up to INR 5L."

### ❌ EXCLUDE if not covered:
- Refer to the exclusion clause with reason.
- Example: "Clause 9b, Page 16 excludes treatment for alcohol addiction."

### ⚠ CONDITIONAL / INDETERMINATE:
- Example: "Clause is ambiguous or mentions requirement not confirmed in the user scenario."

---

## ⚖️ EXAMPLES

### ❌ Mismatched Domain
**Q:** Does this car insurance cover engine damage?  
**Doc:** Health Insurance PDF  
**A:** _"This document is unrelated to the question. Coverage cannot be determined."_

### ❓ Contradictory Clauses
One clause says "covered", another says "not covered"  
**A:** _"Due to contradictory clauses, coverage status is 'not mentioned'."_

### ❓ Insufficient Detail
**Q:** "Accident coverage?"  
**A:** _"The question is too vague. Please specify injury type, policy plan, or location."_

---

## 💡 FALLBACK LOGIC

If no \`coverageStatus\` can be derived from any clause:
- Set \`coverageStatus = "not mentioned"\`
- Set \`summary = "Not mentioned in the document."\`
- Set \`answer = "The document does not contain enough information to determine the coverage status."\`
- Return an empty \`citations\` array
- Suggest follow-up questions that could help get a more specific answer

---

## ✨ FINAL REMINDER

- NO assumptions  
- NO extra knowledge  
- EVERY statement must be backed by a clause with a quote and citation  
- Format output in **valid JSON only**

---

User Question:  
{{{question}}}

Document Content(s):  
{{{documentContent}}}
`
});

// Flow definition
const answerLegalQuestionsFlow = ai.defineFlow(
  {
    name: 'answerLegalQuestionsFlow',
    inputSchema: AnswerLegalQuestionsPromptInputSchema,
    outputSchema: AnswerLegalQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

// Public function
export async function answerLegalQuestions(input: AnswerLegalQuestionsInput): Promise<AnswerLegalQuestionsOutput> {
  const lang = normalizeLanguage(input.language || 'en');
  const languageName = LANGUAGE_NAMES[lang] || lang;
  const output = await answerLegalQuestionsFlow({ ...input, language: lang, languageName });

  const isLikelyInLanguage = (text: string, code: string): boolean => {
    if (!text || !code) return true;
    if (code === 'en') return /[a-zA-Z]/.test(text);

    const samples: Record<string, string[]> = {
      fr: ['le', 'la', 'et', 'est', 'pour', 'avec'],
      es: ['el', 'la', 'y', 'es', 'para', 'con'],
      de: ['der', 'die', 'und', 'ist', 'für', 'mit'],
      hi: ['है', 'और', 'के', 'का', 'में'],
      bn: ['এবং', 'হয়', 'জন্য', 'সঙ্গে'],
    };
    return samples[code]?.some(word => text.includes(word)) ?? true;
  };

  if (lang !== 'en') {
    try {
      if (!isLikelyInLanguage(output.answer, lang)) {
        output.answer = await translateText(output.answer, lang);
      }
      if (!isLikelyInLanguage(output.feedback, lang)) {
        output.feedback = await translateText(output.feedback, lang);
      }
      if (output.summary && !isLikelyInLanguage(output.summary, lang)) {
        output.summary = await translateText(output.summary, lang);
      }
      output.followUpQuestions = await Promise.all(
        output.followUpQuestions.map(async q =>
          isLikelyInLanguage(q, lang) ? q : await translateText(q, lang)
        )
      );
    } catch (e) {
      console.error('Translation error:', e);
    }
  }

  return output;
}
