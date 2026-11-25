import fc from "fast-check";
import { describe, expect, it } from "vitest";
import type { Chain } from "./chain";
import { findChain } from "./path";
import { createTree } from "./tree";
import { arbPair, arbTree } from "./testing/arbitraries";
import type { TestPerson } from "./testing/fixtures";
import { largeTree } from "./testing/large-tree";
import { referenceFindChain } from "./testing/reference-path";
import { samplePairs } from "./testing/sample-pairs";
import type { Person } from "./types";

/** A chain as the people on it and how each was reached, so a mismatch reads well. */
const shape = (chain: Chain<Person> | null) =>
  chain && [chain.from.id, ...chain.steps.map((step) => `${step.move}:${step.person.id}`)];

describe("findChain against the reference copy", () => {
  it("finds the same chain, ties included, on random trees", () => {
    fc.assert(
      fc.property(arbTree, arbPair, ({ tree, ids }, [x, y]) => {
        const a = ids[x % ids.length]!;
        const b = ids[y % ids.length]!;
        expect(shape(findChain(tree, a, b))).toEqual(shape(referenceFindChain(tree, a, b)));
      }),
      { numRuns: 1000 },
    );
  });

  it("finds the same chain for 100 fixed pairs on the large tree", () => {
    const input = largeTree();
    const tree = createTree(input, { born: (p: TestPerson) => p.born });
    // Half the pairs are a short walk apart (related, often by marriage), half are random people.
    let found = 0;
    for (const [from, to] of samplePairs(input, 100, 2026, 3)) {
      const chain = findChain(tree, from, to);
      expect(shape(chain), `${from} → ${to}`).toEqual(shape(referenceFindChain(tree, from, to)));
      if (chain) found++;
    }
    // Most pairs are related, so the comparison covers real chains, not just nulls.
    expect(found).toBeGreaterThan(90);
  }, 120_000);
});
