/** Deterministic HSL color for a genome's color-hash, so related genomes render in visually similar hues. */
export function colorFromHash(hash: number): string {
  const hue = hash % 360;
  const sat = 65 + (hash % 20);
  const light = 45 + ((hash >> 8) % 20);
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}
