import { chooseRelationships, comesBefore, findRelationships } from "./choose";
import { chainTo, searchFrom } from "./path";
import { relationship, type Relation } from "./relate";
import { ancestorPaths, type AncestorLinesOf } from "./ties";
import type { Tree } from "./tree";
import type { Person } from "./types";

/** What one person is to another: the main relationship, and whether they are a couple. */
export type RelationEntry<P extends Person> = Pick<Relation<P>, "main" | "couple">;

/**
 * What everyone connected to one person is to them, keyed by person id in the order of the input
 * `people`. Pass an entry as `{ ...entry, others: [] }` to `describeRelation`.
 */
export type RelationToEveryone<P extends Person> = Map<string, RelationEntry<P>>;

/**
 * For every person connected to `fromId`, the same `main` and `couple` as `relate(tree, fromId, id)`.
 * `fromId` itself and unconnected people are left out; an unknown `fromId` gives an empty map.
 *
 * One search from `fromId` reaches everyone connected and gives each the chain `relate` would find
 * for the people after `fromId` in `people`. For the people before it, `relate` searches from them
 * instead (which may pick another of several equally short chains), so they get a search of their
 * own. `fromId`'s ancestor lines are worked out once, for everyone.
 */
export function relateAll<P extends Person>(tree: Tree<P>, fromId: string): RelationToEveryone<P> {
  const result: RelationToEveryone<P> = new Map();
  const search = searchFrom(tree, fromId);
  if (!search) return result;

  const mine = ancestorPaths(tree, fromId);
  const linesOf: AncestorLinesOf = (id) => (id === fromId ? mine : ancestorPaths(tree, id));
  for (const id of tree.byId.keys()) {
    const shortest = chainTo(search, id);
    if (!shortest) continue;
    const found = comesBefore(tree, id, fromId)
      ? findRelationships(tree, fromId, id, linesOf)
      : chooseRelationships(tree, shortest, linesOf);
    if (found) result.set(id, { main: relationship(tree, found.main), couple: found.couple });
  }
  return result;
}
