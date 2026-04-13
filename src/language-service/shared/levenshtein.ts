/**
 * Iterative Levenshtein edit distance (insert / delete / substitute = 1).
 * Returns the minimum number of single-character edits to transform `a` into `b`.
 */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev: number[] = new Array(b.length + 1);
  let curr: number[] = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost
      );
    }
    const tmp = prev;
    prev = curr;
    curr = tmp;
  }

  return prev[b.length];
}

/**
 * Find the closest candidate from a list by Levenshtein distance.
 * Returns the candidate and its distance, or null if no candidate is
 * within `maxDistance` of `target`.
 */
export function closestMatch(
  target: string,
  candidates: Iterable<string>,
  maxDistance = 2
): { match: string; distance: number } | null {
  let best: { match: string; distance: number } | null = null;
  for (const candidate of candidates) {
    const distance = levenshtein(target, candidate);
    if (distance > maxDistance) continue;
    if (!best || distance < best.distance) {
      best = { match: candidate, distance };
    }
  }
  return best;
}
