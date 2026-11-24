import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { movesOf, reverseMoves } from "./chain";
import type { MarriageKind } from "./classify";
import { describeRelation } from "./describe";
import { legalDegree } from "./degree";
import { el } from "./locales/el";
import { en } from "./locales/en";
import { findChain } from "./path";
import { relate } from "./relate";
import { arbPair, arbTree } from "./testing/arbitraries";
import type { Move } from "./types";

const BLOOD_KINDS = ["ancestor", "descendant", "sibling", "halfSibling", "uncle", "nephew", "cousin"];
const MARRIAGE_KINDS: MarriageKind[] = [
  "spouse",
  "parentInLaw",
  "childInLaw",
  "siblingInLaw",
  "coParentInLaw",
  "coSiblingInLaw",
  "uncleByMarriage",
  "nephewByMarriage",
  "stepParent",
  "stepChild",
];
const NAMED_KINDS: string[] = [...BLOOD_KINDS, ...MARRIAGE_KINDS];

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
    );
  });

  it("reversing moves twice gives the moves back", () => {
    fc.assert(
      fc.property(arbMoves, (moves) => {
        expect(reverseMoves(reverseMoves(moves))).toEqual(moves);
      }),
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
    );
  });

  it("a blood or named marriage relationship has a name in both languages", () => {
    fc.assert(
      fc.property(arbTree, arbPair, ({ tree, ids }, pair) => {
        const relation = relate(tree, ...pick(ids, pair));
        if (!relation || !NAMED_KINDS.includes(relation.main.kind)) return;
        expect(describeRelation(tree, relation, el).main.roles).not.toBeNull();
        expect(describeRelation(tree, relation, en).main.roles).not.toBeNull();
      }),
    );
  });

  it("no text in a description says undefined or NaN", () => {
    fc.assert(
      fc.property(arbTree, arbPair, ({ tree, ids }, pair) => {
        const relation = relate(tree, ...pick(ids, pair));
        if (!relation) return;
        for (const locale of [el, en]) {
          for (const text of strings(describeRelation(tree, relation, locale))) {
            expect(text).not.toMatch(/undefined|NaN/);
          }
        }
      }),
    );
  });
});
