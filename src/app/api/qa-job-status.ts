// API route: GET /api/qa-job-status?jobId=...
// Returns the status/result of a Q&A job by job ID

import { NextRequest, NextResponse } from 'next/server';
import { getQAJobResult } from '../actions';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');
    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId parameter.' }, { status: 400 });
    }
    const result = await getQAJobResult(jobId);
    if (!result) {
      return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (err: any) {
    if (typeof console !== 'undefined') console.error('Error in qa-job-status:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
