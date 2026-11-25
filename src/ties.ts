import { isBloodLine, lastOf, type Chain } from "./chain";
import type { Tree } from "./tree";
import type { Person } from "./types";

/** A blood relationship through one common ancestor (or couple of ancestors), besides the main one. */
export type BloodTie<P extends Person> = { chain: Chain<P>; ancestors: P[] };

/** For a person and each of their ancestors (the person included), the shortest line between them, the person first. */
export type AncestorLines = ReadonlyMap<string, readonly string[]>;

/**
 * Gives a person's ancestor lines: `ancestorPaths(tree, id)`, or the same lines worked out
 * before (`relateAll` works out its own person's lines once, for everyone else).
 */
export type AncestorLinesOf = (id: string) => AncestorLines;

/**
 * The other ways two people are related by blood, closest first: one for each common ancestor
 * (a couple counts once) other than the one the main chain goes through. Two brothers who married
 * two sisters have children related twice; a couple may have been cousins before they married.
 */
export function otherBloodTies<P extends Person>(
  tree: Tree<P>,
  main: Chain<P>,
  linesOf: AncestorLinesOf = (id) => ancestorPaths(tree, id),
): BloodTie<P>[] {
  const a = main.from.id;
  const b = lastOf(main).id;
  const upA = linesOf(a);
  const upB = linesOf(b);
  const common = new Set([...upA.keys()].filter((id) => upB.has(id)));
  // The closest common ancestors: none of their children is a common ancestor too.
  const closest = [...common].filter((id) => !tree.children(id).some((child) => common.has(child.id)));

  const groups: string[][] = [];
  for (const id of closest) {
    const spouses = new Set(tree.spouses(id).map((spouse) => spouse.id));
    const group = groups.find((members) => members.some((member) => spouses.has(member)));
    if (group) group.push(id);
    else groups.push([id]);
  }

  const mainIsBlood = isBloodLine(main);
  const onMainChain = new Set([a, ...main.steps.map((step) => step.person.id)]);
  return groups
    .filter((group) => !(mainIsBlood && group.some((id) => onMainChain.has(id))))
    .map((group) => {
      const top = group[0];
      const up = upA.get(top)!;
      const down = [...upB.get(top)!].reverse();
      const steps: Chain<P>["steps"] = [
        ...up.slice(1).map((id) => ({ person: tree.byId.get(id)!, move: "up" as const })),
        ...down.slice(1).map((id) => ({ person: tree.byId.get(id)!, move: "down" as const })),
      ];
      return { chain: { from: main.from, steps }, ancestors: group.map((id) => tree.byId.get(id)!) };
    })
    .sort((x, y) => x.chain.steps.length - y.chain.steps.length);
}

/** A person's ancestor lines (see `AncestorLines`), found by walking up one generation at a time. */
export function ancestorPaths<P extends Person>(tree: Tree<P>, id: string): AncestorLines {
  const paths = new Map<string, string[]>([[id, [id]]]);
  let generation = [id];
  while (generation.length > 0) {
    const next: string[] = [];
    for (const current of generation) {
      for (const parent of tree.parents(current)) {
        if (paths.has(parent.id)) continue;
        paths.set(parent.id, [...paths.get(current)!, parent.id]);
        next.push(parent.id);
      }
    }
    generation = next;
  }
  return paths;
}
