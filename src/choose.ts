import { type Chain, isBloodLine, movesOf, reverseChain, sexesOf } from "./chain";
import { isNamedKind, kindOf } from "./classify";
import { findChain } from "./path";
import { type AncestorLinesOf, type BloodTie, otherBloodTies } from "./ties";
import { positionOf, type Tree } from "./tree";
import type { Person } from "./types";

/**
 * Everything that relates two people: the main relationship, and the other blood ties after it.
 * A blood tie usually comes before a chain through marriages (or through the child of a
 * marriage), even a shorter one. But a relation by marriage with an everyday name (a couple, an
 * uncle by marriage, in-laws) comes before a distant blood tie, one beyond first cousins: in a
 * village an aunt's husband is often a distant cousin too, and he is her husband first of all.
 *
 * The search runs from whichever of the two comes first in the tree's `people`, and the answer is
 * read backwards for the other direction, so it is the same relationship from either end.
 */
export function findRelationships<P extends Person>(
  tree: Tree<P>,
  fromId: string,
  toId: string,
  linesOf?: AncestorLinesOf,
): Relationships<P> | null {
  if (comesBefore(tree, toId, fromId)) {
    const found = findRelationships(tree, toId, fromId, linesOf);
    if (!found) return null;
    return {
      main: reverseChain(found.main),
      others: found.others.map((tie) => ({ ...tie, chain: reverseChain(tie.chain) })),
      couple: found.couple,
    };
  }
  const shortest = findChain(tree, fromId, toId);
  return shortest && chooseRelationships(tree, shortest, linesOf);
}

/** The main relationship, the other blood ties after it, and whether the two are a couple. */
export type Relationships<P extends Person> = { main: Chain<P>; others: BloodTie<P>[]; couple: boolean };

/**
 * Given the shortest chain between two people (from the one that comes first in `people`, as
 * `findRelationships` searches), which relationship comes first and which are the other blood
 * ties. The chain must start at whichever person comes first in `people`, since ties depend on
 * the direction of the search. `linesOf` may give ancestor lines worked out before.
 */
export function chooseRelationships<P extends Person>(
  tree: Tree<P>,
  shortest: Chain<P>,
  linesOf?: AncestorLinesOf,
): Relationships<P> {
  const ties = otherBloodTies(tree, shortest, linesOf);
  const couple = shortest.steps.length === 1 && shortest.steps[0].move === "spouse";
  const closest = ties[0]?.chain;
  const bloodFirst =
    closest !== undefined &&
    !isBloodLine(shortest) &&
    !couple &&
    !(hasName(shortest) && closest.steps.length > FIRST_COUSIN_STEPS);
  return bloodFirst ? { main: closest, others: ties.slice(1), couple } : { main: shortest, others: ties, couple };
}

/**
 * Whether one person comes before another in the tree's `people`. For a tree not made by
 * `createTree` (no positions known) it compares ids, so the answer is still deterministic.
 */
export const comesBefore = (tree: Tree<Person>, a: string, b: string): boolean => {
  const [x, y] = [positionOf(tree, a), positionOf(tree, b)];
  return x !== y ? x < y : a < b;
};

/** Steps between first cousins (up twice, down twice): blood ties this close always come first. */
const FIRST_COUSIN_STEPS = 4;

/**
 * Whether a chain has a name of its own, such as «κουνιάδος», rather than only a number of steps.
 * Both languages name the same relationships, so the main one is the same in either.
 */
const hasName = (chain: Chain<Person>) => {
  return isNamedKind(kindOf(movesOf(chain), sexesOf(chain), false));
};
