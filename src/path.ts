import type { Chain } from "./chain";
import { CheapestFirst } from "./queue";
import type { Tree } from "./tree";
import type { Move, Person } from "./types";

/**
 * A path search from one person, as far as it went: how each person it reached was reached (the
 * one before them on the chain, and the move from there).
 */
export type Search<P extends Person> = {
  tree: Tree<P>;
  from: P;
  previous: ReadonlyMap<string, { id: string; move: Move }>;
};

/**
 * The shortest chain between two people, preferring blood relations: with as many steps, the one
 * with fewer marriages wins. Null when they are not connected (or are the same person).
 */
export function findChain<P extends Person>(tree: Tree<P>, fromId: string, toId: string): Chain<P> | null {
  const from = tree.byId.get(fromId);
  if (!from || !tree.byId.get(toId) || fromId === toId) return null;
  return chainTo(search(tree, from, toId), toId);
}

/**
 * One search from a person to everyone connected to them. `chainTo(searchFrom(tree, a), b)` is
 * `findChain(tree, a, b)` for every `b`, ties included: the search only goes on past where
 * `findChain` stops, and a person's chain never changes once they are the cheapest left.
 * Null for an unknown person.
 */
export function searchFrom<P extends Person>(tree: Tree<P>, fromId: string): Search<P> | null {
  const from = tree.byId.get(fromId);
  return from ? search(tree, from, undefined) : null;
}

/** The chain a search found to a person; null when it did not reach them (or they are where it started). */
export function chainTo<P extends Person>({ tree, from, previous }: Search<P>, toId: string): Chain<P> | null {
  if (!previous.has(toId)) return null;
  const steps: Chain<P>["steps"] = [];
  for (let id = toId; id !== from.id; id = previous.get(id)!.id) {
    steps.unshift({ person: tree.byId.get(id)!, move: previous.get(id)!.move });
  }
  return { from, steps };
}

/** The search itself, stopping once it gets to `toId` (or going on to everyone without one). */
function search<P extends Person>(tree: Tree<P>, from: P, toId: string | undefined): Search<P> {
  const fromId = from.id;
  // Cost: 10 a step, and 1 more for a marriage, so blood relations win among equally short chains.
  const cost = new Map<string, number>([[fromId, 0]]);
  const previous = new Map<string, { id: string; move: Move }>();
  // Cheapest first; among equal costs the one queued first, which decides ties between chains.
  const queue = new CheapestFirst<string>();
  queue.push(fromId, 0);
  const reach = (id: string, total: number, via: string, move: Move) => {
    if (total >= (cost.get(id) ?? Infinity)) return;
    cost.set(id, total);
    previous.set(id, { id: via, move });
    queue.push(id, total);
  };
  for (let current = queue.pop(); current; current = queue.pop()) {
    const { value: id, cost: here } = current;
    if (id === toId) break;
    if (here > (cost.get(id) ?? Infinity)) continue;
    for (const person of tree.parents(id)) reach(person.id, here + 10, id, "up");
    for (const person of tree.children(id)) reach(person.id, here + 10, id, "down");
    for (const person of tree.spouses(id)) reach(person.id, here + 11, id, "spouse");
  }
  return { tree, from, previous };
}
