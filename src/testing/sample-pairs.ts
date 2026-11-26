import type { Person, TreeInput } from "../types";

/**
 * A fixed list of `count` pairs of different people from `input`, the same for the same `seed`.
 * Every other pair, starting with the first, is a walk of `shortestWalk` to `shortestWalk + 7` steps
 * through parents and unions from a random person (so they are related, often distantly); the rest
 * are two random people (mostly far apart or unrelated). Throws if it keeps drawing the same person
 * twice, which only a tiny or unlinked tree would cause.
 */
export function samplePairs<P extends Person>(
  input: Required<TreeInput<P>>,
  count: number,
  seed: number,
  shortestWalk = 4,
): [string, string][] {
  let state = seed >>> 0;
  const next = (n: number) => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return (state >>> 8) % n;
  };
  const neighbours = new Map<string, string[]>();
  const link = (a: string, b: string) => {
    (neighbours.get(a) ?? neighbours.set(a, []).get(a)!).push(b);
    (neighbours.get(b) ?? neighbours.set(b, []).get(b)!).push(a);
  };
  for (const [p, c] of input.parents) link(p, c);
  for (const { a, b } of input.unions) link(a, b);

  const pairs: [string, string][] = [];
  for (let attempts = 0; pairs.length < count; attempts++) {
    if (attempts >= 10 * count) throw new Error(`samplePairs: too many draws gave the same person twice`);
    const from = input.people[next(input.people.length)]!.id;
    let to = from;
    if (pairs.length % 2 === 0) {
      for (let step = shortestWalk + next(8); step > 0 && neighbours.has(to); step--) {
        to = neighbours.get(to)![next(neighbours.get(to)!.length)]!;
      }
    } else {
      to = input.people[next(input.people.length)]!.id;
    }
    if (to !== from) pairs.push([from, to]);
  }
  return pairs;
}
