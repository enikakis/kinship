import type { Chain } from "../chain";
import type { Tree } from "../tree";
import type { Move, Person } from "../types";

/**
 * `findChain` as it was before the speed-ups (commit 988f771 on main), kept verbatim so tests can
 * check that the faster search returns exactly the same chain, ties included.
 */
export function referenceFindChain<P extends Person>(tree: Tree<P>, fromId: string, toId: string): Chain<P> | null {
  const from = tree.byId.get(fromId);
  if (!from || !tree.byId.get(toId) || fromId === toId) return null;
  // Cost: 10 a step, and 1 more for a marriage, so blood relations win among equally short chains.
  const cost = new Map<string, number>([[fromId, 0]]);
  const previous = new Map<string, { id: string; move: Move }>();
  const queue: { id: string; cost: number }[] = [{ id: fromId, cost: 0 }];
  while (queue.length > 0) {
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift()!;
    if (current.id === toId) break;
    if (current.cost > (cost.get(current.id) ?? Infinity)) continue;
    const next: [P, Move][] = [
      ...tree.parents(current.id).map((person): [P, Move] => [person, "up"]),
      ...tree.children(current.id).map((person): [P, Move] => [person, "down"]),
      ...tree.spouses(current.id).map((person): [P, Move] => [person, "spouse"]),
    ];
    for (const [person, move] of next) {
      const total = current.cost + (move === "spouse" ? 11 : 10);
      if (total >= (cost.get(person.id) ?? Infinity)) continue;
      cost.set(person.id, total);
      previous.set(person.id, { id: current.id, move });
      queue.push({ id: person.id, cost: total });
    }
  }
  if (!previous.has(toId)) return null;
  const steps: Chain<P>["steps"] = [];
  for (let id = toId; id !== fromId; id = previous.get(id)!.id) {
    steps.unshift({ person: tree.byId.get(id)!, move: previous.get(id)!.move });
  }
  return { from, steps };
}
