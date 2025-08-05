// Gemini Embedding Utility (Advanced)
// Provides functions to get embeddings for text and compute similarity
// Uses Redis for persistent, scalable storage

import { createClient } from 'redis';

// --- Gemini Embedding API Integration ---
// Replace this with your actual Gemini API endpoint and key
const GEMINI_API_URL = process.env.GEMINI_API_URL || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export async function getGeminiEmbedding(text: string): Promise<number[]> {
  if (!GEMINI_API_URL || !GEMINI_API_KEY) throw new Error('Gemini API config missing');
  // Example: POST to Gemini API
  const res = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GEMINI_API_KEY}`,
    },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('Gemini embedding API error');
  const data = await res.json();
  if (!data.embedding) throw new Error('No embedding returned');
  return data.embedding;
}

// Batch embedding for efficiency
export async function getGeminiEmbeddings(texts: string[]): Promise<number[][]> {
  if (!GEMINI_API_URL || !GEMINI_API_KEY) throw new Error('Gemini API config missing');
  const res = await fetch(GEMINI_API_URL + '/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GEMINI_API_KEY}`,
    },
    body: JSON.stringify({ texts }),
  });
  if (!res.ok) throw new Error('Gemini batch embedding API error');
  const data = await res.json();
  if (!data.embeddings) throw new Error('No embeddings returned');
  return data.embeddings;
}

// Cosine similarity between two vectors
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error('Embedding vectors must be same length');
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// --- Redis-based Chunk Embedding Store ---
let redisClient: any = null;
let useRedis = false;
if (typeof process !== 'undefined' && process.env && process.env.REDIS_URL) {
  try {
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.connect().catch((err: any) => {
      console.error('Redis connection error (embeddings):', err);
      useRedis = false;
    });
    useRedis = true;
  } catch (e) {
    useRedis = false;
  }
}

// Store a chunk embedding in Redis (or in-memory fallback)
const inMemoryChunkEmbeddings: { [docId: string]: Array<{ chunkId: string, embedding: number[], text: string }> } = {};

export async function storeChunkEmbedding(docId: string, chunkId: string, embedding: number[], text: string) {
  if (useRedis && redisClient) {
    const key = `embeddings:${docId}`;
    const value = JSON.stringify({ chunkId, embedding, text });
    await redisClient.rPush(key, value);
  } else {
    if (!inMemoryChunkEmbeddings[docId]) inMemoryChunkEmbeddings[docId] = [];
    inMemoryChunkEmbeddings[docId].push({ chunkId, embedding, text });
  }
}

// Retrieve all chunk embeddings for a document from Redis (or in-memory fallback)
export async function getChunkEmbeddings(docId: string): Promise<Array<{ chunkId: string, embedding: number[], text: string }>> {
  if (useRedis && redisClient) {
    const key = `embeddings:${docId}`;
    const values = await redisClient.lRange(key, 0, -1);
    return values.map((v: string) => JSON.parse(v));
  } else {
    return inMemoryChunkEmbeddings[docId] || [];
  }
}

// (Optional) Clear all embeddings for a document
export async function clearChunkEmbeddings(docId: string) {
  if (useRedis && redisClient) {
    const key = `embeddings:${docId}`;
    await redisClient.del(key);
  } else {
    delete inMemoryChunkEmbeddings[docId];
  }
}
