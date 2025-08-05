// API route: POST /api/submit-qa-job
// Submits a Q&A job to the background queue and returns a job ID

import { NextRequest, NextResponse } from 'next/server';
import { submitQAJob } from '../actions';

export async function POST(req: NextRequest) {
  try {
    const { documentContent, question, history, language } = await req.json();
    if (!documentContent || !question) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }
    // Defensive: ensure documentContent is string and question is string
    if (typeof documentContent !== 'string' || typeof question !== 'string') {
      return NextResponse.json({ error: 'Invalid input types.' }, { status: 400 });
    }
    const { jobId } = await submitQAJob(documentContent, question, history || [], language || 'en');
    if (!jobId) {
      return NextResponse.json({ error: 'Failed to create job.' }, { status: 500 });
    }
    return NextResponse.json({ jobId });
  } catch (err: any) {
    if (typeof console !== 'undefined') console.error('Error in submit-qa-job:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
