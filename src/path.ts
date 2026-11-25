import type { Chain } from "./chain";
import { CheapestFirst } from "./queue";
import type { Tree } from "./tree";
import type { Move, Person } from "./types";

/**
 * The shortest chain between two people, preferring blood relations: with as many steps, the one
 * with fewer marriages wins. Null when they are not connected (or are the same person).
 */
export function findChain<P extends Person>(tree: Tree<P>, fromId: string, toId: string): Chain<P> | null {
  const from = tree.byId.get(fromId);
  if (!from || !tree.byId.get(toId) || fromId === toId) return null;
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
  if (!previous.has(toId)) return null;
  const steps: Chain<P>["steps"] = [];
  for (let id = toId; id !== fromId; id = previous.get(id)!.id) {
    steps.unshift({ person: tree.byId.get(id)!, move: previous.get(id)!.move });
  }
  return { from, steps };
}
