import fc from "fast-check";
import { createTree, type Tree } from "../tree";
import type { Sex } from "../types";
import { person, type TestPerson } from "./fixtures";

const arbSex: fc.Arbitrary<Sex> = fc.constantFrom("female", "male", "unknown");

/**
 * A random tree of 2–30 people. A parent always comes before their child in the list, so there
 * are no cycles, and a child has at most two parents. There are 0–10 unions between distinct people.
 */
export const arbTree: fc.Arbitrary<{ tree: Tree<TestPerson>; ids: string[] }> = fc
  .record({
    people: fc.array(
      fc.record({ sex: arbSex, born: fc.option(fc.integer({ min: 1700, max: 2020 }), { nil: undefined }) }),
      {
        minLength: 2,
        maxLength: 30,
      },
    ),
    // Indices are reduced to the people's range below.
    parentPicks: fc.array(fc.tuple(fc.nat(), fc.nat(), fc.nat()), { maxLength: 60 }),
    unionPicks: fc.array(fc.tuple(fc.nat(), fc.nat()), { maxLength: 10 }),
  })
  .map(({ people, parentPicks, unionPicks }) => {
    const n = people.length;
    const ids = people.map((_, i) => `p${i}`);
    const parents = new Map<number, Set<number>>();
    for (const [x, y] of parentPicks) {
      const child = 1 + (x % (n - 1));
      const parent = y % child;
      const set = parents.get(child) ?? new Set<number>();
      if (set.size < 2) set.add(parent);
      parents.set(child, set);
    }
    const parentLinks = [...parents].flatMap(([child, set]) =>
      [...set].map((p): [string, string] => [ids[p]!, ids[child]!]),
    );
    const unions = unionPicks.flatMap(([x, y]) => {
      const a = x % n;
      const b = y % n;
      return a === b ? [] : [{ a: ids[a]!, b: ids[b]! }];
    });
    const tree = createTree(
      { people: people.map((p, i) => person(ids[i]!, p.sex, p.born)), parents: parentLinks, unions },
      { born: (p: TestPerson) => p.born },
    );
    return { tree, ids };
  });

/** Two positions in `ids`, which may be the same person. */
export const arbPair = fc.tuple(fc.nat(), fc.nat());
