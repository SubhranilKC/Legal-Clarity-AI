
'use server';

import mammoth from 'mammoth';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// NOTE: pdf-parse is imported dynamically inside extractTextFromDataUri to avoid server-side issues.
let pdf: typeof import('pdf-parse');


export async function extractTextFromDataUri(dataUri: string): Promise<string> {
  const match = dataUri.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid data URI format');
  }

  const mimeType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, 'base64');

  try {
    if (mimeType === 'application/pdf') {
      if (!pdf) {
        // Dynamically import pdf-parse and assign its default export
        pdf = (await import('pdf-parse')).default;
      }
      const data = await pdf(buffer);
      return data.text;
    } else if (
      mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const { value } = await mammoth.extractRawText({ buffer });
      return value;
    } else if (mimeType.startsWith('text/')) {
      return buffer.toString('utf-8');
    } else if (mimeType.startsWith('image/')) {
        const ocrPrompt = ai.definePrompt({
            name: 'ocrPrompt',
            input: { schema: z.object({ doc: z.string() }) },
            prompt: `Extract all text from the following document image. The text might be rotated or in a complex layout, do your best to reconstruct the full text content accurately: {{media url=doc}}`
        });
        const result = await ocrPrompt({ doc: dataUri });
        return result.output || '';
    }
  } catch (err) {
      console.error(`Error processing file with MIME type ${mimeType}:`, err);
      throw new Error(`Failed to process file with MIME type: ${mimeType}`);
  }


  throw new Error(`Unsupported MIME type: ${mimeType}`);
}
