// Summary cache with pluggable backend: in-memory (default) or Redis (if configured)
// Key: hash of document/chunk, Value: summary string

let redisClient: any = null;
let useRedis = false;
const summaryCache = new Map<string, string>();

// Try to load Redis if REDIS_URL is set
if (typeof process !== 'undefined' && process.env && process.env.REDIS_URL) {
  try {
    // Dynamically import redis only if needed
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createClient } = require('redis');
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.connect().catch((err: any) => {
      console.error('Redis connection error:', err);
      useRedis = false;
    });
    useRedis = true;
    console.log('Using Redis for summary cache.');
  } catch (e) {
    console.warn('Redis not available, falling back to in-memory cache.');
    useRedis = false;
  }
}

export async function getSummaryFromCache(hash: string): Promise<string | undefined> {
  if (useRedis && redisClient) {
    try {
      const val = await redisClient.get(hash);
      return val ?? undefined;
    } catch (e) {
      console.error('Redis get error:', e);
      // fallback to memory
    }
  }
  return summaryCache.get(hash);
}

export async function setSummaryInCache(hash: string, summary: string): Promise<void> {
  if (useRedis && redisClient) {
    try {
      await redisClient.set(hash, summary);
      return;
    } catch (e) {
      console.error('Redis set error:', e);
      // fallback to memory
    }
  }
  summaryCache.set(hash, summary);
}

// Utility to hash a string (simple, non-cryptographic for demo; use SHA256 in prod)
export function simpleHash(str: string): string {
  let hash = 0, i, chr;
  if (str.length === 0) return hash.toString();
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString();
}
