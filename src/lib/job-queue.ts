// Job queue setup for background processing (Phase 2)
// Uses BullMQ for robust, Redis-backed job queue
// Supports in-memory fallback for dev/single-server (no Redis)

import { Queue, Worker, QueueEvents, Job } from 'bullmq';

let useRedis = false;
let connection: any = undefined;

if (typeof process !== 'undefined' && process.env && process.env.REDIS_URL) {
  useRedis = true;
  connection = { url: process.env.REDIS_URL };
}

// Fallback: simple in-memory queue for dev/testing
// Each job is tracked by jobId, with status and result for robust polling and debugging
const inMemoryQueue: { [queueName: string]: Array<{ data: any, resolve: (value: any) => void, reject: (reason: any) => void }> } = {};
const inMemoryJobStatus: { [jobId: string]: { status: string, result?: any, error?: string, createdAt: number, updatedAt: number } } = {};

export function createJobQueue(queueName: string) {
  if (useRedis) {
    const queue = new Queue(queueName, { connection });
    return queue;
  } else {
    // In-memory queue API (robust)
    if (!inMemoryQueue[queueName]) inMemoryQueue[queueName] = [];
    return {
      // Add a job to the queue, track status, and return jobId for polling
      add: (name: string, data: any, opts?: { jobId?: string }) => {
        return new Promise((resolve, reject) => {
          const jobId = opts?.jobId || `${Date.now()}-${Math.random()}`;
          inMemoryQueue[queueName].push({ data: { ...data, jobId }, resolve, reject });
          const now = Date.now();
          inMemoryJobStatus[jobId] = { status: 'queued', createdAt: now, updatedAt: now };
          resolve({ id: jobId });
        });
      },
      // Query job status/progress/result just like BullMQ
      getJob: (jobId: string) => {
        return {
          getState: async () => inMemoryJobStatus[jobId]?.status || 'not_found',
          returnvalue: inMemoryJobStatus[jobId]?.result,
          failedReason: inMemoryJobStatus[jobId]?.error,
          createdAt: inMemoryJobStatus[jobId]?.createdAt,
          updatedAt: inMemoryJobStatus[jobId]?.updatedAt,
        };
      },
      // Optionally: clear job result (for memory management)
      clearJob: (jobId: string) => {
        delete inMemoryJobStatus[jobId];
      },
      // List all jobs for debugging/monitoring
      listJobs: () => Object.entries(inMemoryJobStatus).map(([id, status]) => ({ id, ...status })),
    };
  }
}

export function createJobWorker(queueName: string, processor: (data: any) => Promise<any>) {
  if (useRedis) {
    const worker = new Worker(queueName, async (job: Job) => {
      return await processor(job.data);
    }, { connection });
    return worker;
  } else {
    // In-memory: process jobs immediately (async) and update status
    setInterval(() => {
      const queue = inMemoryQueue[queueName];
      if (queue && queue.length > 0) {
        const job = queue.shift();
        if (!job) return;
        const jobId = job.data?.jobId;
        const now = Date.now();
        if (!jobId) {
          // If no jobId, just process and resolve/reject without status
          processor(job.data)
            .then((result: any) => { if (job.resolve) job.resolve(result); })
            .catch((err: any) => { if (job.reject) job.reject(err); });
          return;
        }
        inMemoryJobStatus[jobId] = { ...inMemoryJobStatus[jobId], status: 'active', updatedAt: now };
        // Patch global for progress tracking in answerQuestionAction
        (global as any).currentJobId = jobId;
        (global as any).updateJobProgress = (id: string, progress: any) => {
          if (inMemoryJobStatus[id]) {
            inMemoryJobStatus[id] = { ...inMemoryJobStatus[id], ...progress, updatedAt: Date.now() };
          }
        };
        processor(job.data)
          .then(result => {
            inMemoryJobStatus[jobId] = { ...inMemoryJobStatus[jobId], status: 'completed', result, updatedAt: Date.now() };
            if (job.resolve) job.resolve(result);
            // Clean up globals
            delete (global as any).currentJobId;
            delete (global as any).updateJobProgress;
          })
          .catch(err => {
            inMemoryJobStatus[jobId] = { ...inMemoryJobStatus[jobId], status: 'failed', error: err?.message || 'Unknown error', updatedAt: Date.now() };
            if (job.reject) job.reject(err);
            // Clean up globals
            delete (global as any).currentJobId;
            delete (global as any).updateJobProgress;
          });
      }
    }, 100);
  }
}

// For advanced: add job status/progress tracking, events, etc.
