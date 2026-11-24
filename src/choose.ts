import { isBloodLine, movesOf, type Chain } from "./chain";
import { kindOf } from "./classify";
import { findChain } from "./path";
import { otherBloodTies, type BloodTie } from "./ties";
import type { Tree } from "./tree";
import type { Person } from "./types";

/**
 * Everything that relates two people: the main relationship, and the other blood ties after it.
 * A blood tie usually comes before a chain through marriages (or through the child of a
 * marriage), even a shorter one. But a relation by marriage with an everyday name (a couple, an
 * uncle by marriage, in-laws) comes before a distant blood tie, one beyond first cousins: in a
 * village an aunt's husband is often a distant cousin too, and he is her husband first of all.
 */
export function findRelationships<P extends Person>(
  tree: Tree<P>,
  fromId: string,
  toId: string,
): { main: Chain<P>; others: BloodTie<P>[]; couple: boolean } | null {
  const shortest = findChain(tree, fromId, toId);
  if (!shortest) return null;
  const ties = otherBloodTies(tree, shortest);
  const couple = shortest.steps.length === 1 && shortest.steps[0].move === "spouse";
  const closest = ties[0]?.chain;
  const bloodFirst =
    closest !== undefined &&
    !isBloodLine(shortest) &&
    !couple &&
    !(hasName(shortest) && closest.steps.length > FIRST_COUSIN_STEPS);
  return bloodFirst ? { main: closest, others: ties.slice(1), couple } : { main: shortest, others: ties, couple };
}

/** Steps between first cousins (up twice, down twice): blood ties this close always come first. */
const FIRST_COUSIN_STEPS = 4;

/**
 * Whether a chain has a name of its own, such as «κουνιάδος», rather than only a number of steps.
 * Both languages name the same relationships, so the main one is the same in either.
 */
const hasName = (chain: Chain<Person>) => {
  const sexes = [chain.from, ...chain.steps.map((step) => step.person)].map((person) => person.sex);
  const kind = kindOf(movesOf(chain), sexes, false);
  return kind !== "spouseOfRelative" && kind !== "relativeOfSpouse" && kind !== "unnamed";
};
