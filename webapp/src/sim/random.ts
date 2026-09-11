// Small, fast, seedable PRNG (mulberry32). Deterministic when seeded so that
// "deterministic" mode can reproduce a run exactly, like biosim4's RNGSeed option.

export class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** Returns a uint32 in [0, 0xffffffff]. */
  nextUint32(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0);
  }

  /** Returns a float in [0, 1). */
  nextFloat(): number {
    return this.nextUint32() / 0x100000000;
  }

  /** Returns an integer in [min, max] inclusive. */
  nextInt(min: number, max: number): number {
    return min + Math.floor(this.nextFloat() * (max - min + 1));
  }

  /** Returns true with probability `p` (0..1). */
  chance(p: number): boolean {
    return this.nextFloat() < p;
  }
}

export function makeSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}
