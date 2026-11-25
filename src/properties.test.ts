import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { movesOf, reverseMoves } from "./chain";
import { isNamedKind } from "./classify";
import { describeRelation } from "./describe";
import { legalDegree } from "./degree";
import { LOCALES } from "./locales";
import { findChain } from "./path";
import { relate, type OtherTie, type Relationship } from "./relate";
import { arbPair, arbTree } from "./testing/arbitraries";
import type { Move, Person } from "./types";

const arbMoves = fc.array(fc.constantFrom<Move>("up", "down", "spouse"), { maxLength: 12 });
const pick = (ids: string[], [x, y]: [number, number]): [string, string] => [ids[x % ids.length]!, ids[y % ids.length]!];

/** Every string in a value made of strings, arrays and plain objects. */
const strings = (value: unknown): string[] =>
  typeof value === "string"
    ? [value]
    : Array.isArray(value)
      ? value.flatMap(strings)
      : value && typeof value === "object"
        ? Object.values(value).flatMap(strings)
        : [];

describe("properties on random trees", () => {
  it("relate finds a relation both ways or neither", () => {
    fc.assert(
      fc.property(arbTree, arbPair, ({ tree, ids }, pair) => {
        const [a, b] = pick(ids, pair);
        expect(relate(tree, a, b) === null).toBe(relate(tree, b, a) === null);
      }),
      { numRuns: 500 },
    );
  });

  it("the chain from a to b is as long, with as many marriages, as the chain from b to a", () => {
    fc.assert(
      fc.property(arbTree, arbPair, ({ tree, ids }, pair) => {
        const [a, b] = pick(ids, pair);
        const forward = findChain(tree, a, b);
        const back = findChain(tree, b, a);
        expect(forward === null).toBe(back === null);
        if (!forward || !back) return;
        const marriages = (moves: Move[]) => moves.filter((move) => move === "spouse").length;
        expect(forward.steps.length).toBe(back.steps.length);
        expect(marriages(movesOf(forward))).toBe(marriages(movesOf(back)));
      }),
      { numRuns: 500 },
    );
  });

  it("gives the same relationship from either end", () => {
    const people = (r: Relationship<Person>) => [r.from, ...r.path.map((step) => step.person)].map((p) => p.id);
    const ancestorIds = (tie: OtherTie<Person>) => tie.commonAncestors.map((p) => p.id).sort();
    fc.assert(
      fc.property(arbTree, arbPair, ({ tree, ids }, pair) => {
        const [a, b] = pick(ids, pair);
        const there = relate(tree, a, b);
        const back = relate(tree, b, a);
        if (!there || !back) return;
        expect(people(back.main)).toEqual(people(there.main).reverse());
        expect(back.main.moves).toEqual(reverseMoves(there.main.moves));
        expect(back.main.legalDegree).toEqual(there.main.legalDegree);
        expect(back.couple).toBe(there.couple);
        expect(back.others).toHaveLength(there.others.length);
        expect(back.others.map(ancestorIds)).toEqual(there.others.map(ancestorIds));
        back.others.forEach((tie, i) => expect(people(tie)).toEqual(people(there.others[i]!).reverse()));
      }),
      { numRuns: 500 },
    );
  });

  it("reversing moves twice gives the moves back", () => {
    fc.assert(
      fc.property(arbMoves, (moves) => {
        expect(reverseMoves(reverseMoves(moves))).toEqual(moves);
      }),
      { numRuns: 500 },
    );
  });

  it("counts the same degree for a chain and its reverse", () => {
    fc.assert(
      fc.property(arbTree, arbPair, ({ tree, ids }, pair) => {
        const relation = relate(tree, ...pick(ids, pair));
        if (!relation) return;
        const { moves } = relation.main;
        expect(legalDegree(moves)).toEqual(legalDegree(reverseMoves(moves)));
      }),
      { numRuns: 500 },
    );
  });

  it("a blood or named marriage relationship has a name in every language", () => {
    fc.assert(
      fc.property(arbTree, arbPair, ({ tree, ids }, pair) => {
        const relation = relate(tree, ...pick(ids, pair));
        if (!relation) return;
        for (const locale of LOCALES) {
          const description = describeRelation(tree, relation, locale);
          if (isNamedKind(relation.main.kind)) expect(description.main.roles).not.toBeNull();
          // Other ties are all blood, so all have names.
          for (const tie of description.others) expect(tie.roles).not.toBeNull();
        }
      }),
      { numRuns: 500 },
    );
  });

  it("no text in a description says undefined or NaN", () => {
    fc.assert(
      fc.property(arbTree, arbPair, ({ tree, ids }, pair) => {
        const relation = relate(tree, ...pick(ids, pair));
        if (!relation) return;
        for (const locale of LOCALES) {
          for (const text of strings(describeRelation(tree, relation, locale))) {
            expect(text).not.toMatch(/undefined|NaN/);
          }
        }
      }),
      { numRuns: 500 },
    );
  });
});
