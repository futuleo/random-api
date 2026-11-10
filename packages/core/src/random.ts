export function createSeededRandom(seed: string): () => number {
  if (typeof seed !== "string" || seed.length === 0)
    throw new TypeError("A non-empty string seed is required.");
  if (seed.length > 256)
    throw new RangeError("Seed must contain at most 256 characters.");
  let state = 2166136261;
  for (let index = 0; index < seed.length; index += 1)
    state = Math.imul(state ^ seed.charCodeAt(index), 16777619) >>> 0;
  return () => {
    // Mulberry32 keeps seeded output identical in browsers and Node.js.
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
