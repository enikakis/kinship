import { relate, type Relation } from "./relate";
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
 * Runs `relate` per person, after one breadth-first walk finds who is connected at all.
 */
export function relateAll<P extends Person>(tree: Tree<P>, fromId: string): RelationToEveryone<P> {
  const result: RelationToEveryone<P> = new Map();
  if (!tree.byId.has(fromId)) return result;

  const reached = new Set([fromId]);
  const queue = [fromId];
  for (let next = 0; next < queue.length; next++) {
    const id = queue[next]!;
    for (const other of [...tree.parents(id), ...tree.children(id), ...tree.spouses(id)]) {
      if (reached.has(other.id)) continue;
      reached.add(other.id);
      queue.push(other.id);
    }
  }

  for (const id of tree.byId.keys()) {
    if (id === fromId || !reached.has(id)) continue;
    const relation = relate(tree, fromId, id);
    if (relation) result.set(id, { main: relation.main, couple: relation.couple });
  }
  return result;
}
