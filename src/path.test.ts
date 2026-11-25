import fc from "fast-check";
import { describe, expect, it } from "vitest";
import type { Chain } from "./chain";
import { chainTo, findChain, searchFrom } from "./path";
import { arbPair, arbTree } from "./testing/arbitraries";
import type { TestPerson } from "./testing/fixtures";
import { largeTree } from "./testing/large-tree";
import { referenceFindChain } from "./testing/reference-path";
import { samplePairs } from "./testing/sample-pairs";
import { createTree } from "./tree";
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

describe("one search from a person to everyone", () => {
  it("gives every target the chain findChain finds, ties included, on random trees", () => {
    fc.assert(
      fc.property(arbTree, ({ tree, ids }) => {
        for (const a of ids) {
          const search = searchFrom(tree, a)!;
          for (const b of ids) expect(shape(chainTo(search, b)), `${a} → ${b}`).toEqual(shape(findChain(tree, a, b)));
        }
      }),
      { numRuns: 300 },
    );
  });

  it("gives 200 people of the large tree the chain findChain finds", () => {
    const input = largeTree();
    const tree = createTree(input, { born: (p: TestPerson) => p.born });
    const search = searchFrom(tree, input.people[5000]!.id)!;
    let found = 0;
    for (let i = 0; i < input.people.length; i += 50) {
      const to = input.people[i]!.id;
      const chain = chainTo(search, to);
      expect(shape(chain), to).toEqual(shape(findChain(tree, input.people[5000]!.id, to)));
      if (chain) found++;
    }
    expect(found).toBeGreaterThan(150);
  }, 120_000);

  it("is null for an unknown person, and reaches no one unknown or the person themselves", () => {
    const { tree, ids } = fc.sample(arbTree, { numRuns: 1, seed: 1 })[0]!;
    expect(searchFrom(tree, "ghost")).toBeNull();
    const search = searchFrom(tree, ids[0]!)!;
    expect(chainTo(search, ids[0]!)).toBeNull();
    expect(chainTo(search, "ghost")).toBeNull();
  });
});
