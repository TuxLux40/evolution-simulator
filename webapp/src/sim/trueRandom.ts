// Fetches a seed from drand -- the public, verifiable randomness beacon that
// Cloudflare hosts (fed in part by their "lava lamp wall" LavaRand entropy
// source, which has no public API of its own). Used to seed a run's PRNG,
// not for individual mutations: those happen thousands of times per second
// and can't wait on a network round trip.

const DRAND_ENDPOINT = 'https://drand.cloudflare.com/public/latest';

interface DrandResponse {
  round: number;
  randomness: string; // 64 hex chars (32 bytes)
  signature: string;
}

export async function fetchTrueRandomSeed(): Promise<number> {
  const res = await fetch(DRAND_ENDPOINT);
  if (!res.ok) throw new Error(`drand request failed: ${res.status}`);
  const data = (await res.json()) as Partial<DrandResponse>;
  if (typeof data.randomness !== 'string' || !/^[0-9a-f]{16,}$/i.test(data.randomness)) {
    throw new Error('unexpected drand response shape');
  }
  // Take the first 8 hex chars (32 bits) of the beacon's randomness as our seed.
  const seed = Number.parseInt(data.randomness.slice(0, 8), 16);
  if (!Number.isFinite(seed)) throw new Error('failed to parse randomness into a seed');
  return seed >>> 0;
}
