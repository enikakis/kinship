import type { Person, TreeInput, TreeOptions } from "./types";

/**
 * The lookups `relate` needs; make one with `createTree`. Only trees made by `createTree` know the
 * order of the input `people`; any other object falls back to id order.
 */
export type Tree<P extends Person> = {
  readonly byId: ReadonlyMap<string, P>;
  /** Ordered by birth year (unknown last), then as given in `people`. */
  parents(id: string): P[];
  children(id: string): P[];
  spouses(id: string): P[];
  /**
   * Whether two people are half-siblings: both have two recorded parents and share only one. When
   * either one's other parent is not recorded we cannot tell, so we do not say so.
   */
  areHalfSiblings(a: string, b: string): boolean;
  name(person: P): string;
  born(person: P): number | undefined;
};

/** Where each person stands in the input's `people`, for every tree made by `createTree`. */
const positions = new WeakMap<Tree<Person>, ReadonlyMap<string, number>>();

/** Where a person stands in the input's `people` (0-based); Infinity for unknown ids. */
export function positionOf(tree: Tree<Person>, id: string): number {
  return positions.get(tree)?.get(id) ?? Infinity;
}

const defaultName = (person: Person) => {
  const name = (person as { name?: unknown }).name;
  return typeof name === "string" ? name : person.id;
};

/** Looks up relatives quickly in a tree of any size. */
export function createTree<P extends Person>(input: TreeInput<P>, options: TreeOptions<P> = {}): Tree<P> {
  const name = options.name ?? defaultName;
  const born = options.born ?? (() => undefined);

  const byId = new Map<string, P>();
  const position = new Map<string, number>();
  input.people.forEach((person, index) => {
    byId.set(person.id, person);
    position.set(person.id, index);
  });

  const parentIds = new Map<string, string[]>();
  const childIds = new Map<string, string[]>();
  const seenLinks = new Set<string>();
  for (const [parent, child] of input.parents) {
    if (!byId.has(parent) || !byId.has(child)) continue;
    const key = `${parent}\u0000${child}`;
    if (seenLinks.has(key)) continue;
    seenLinks.add(key);
    (parentIds.get(child) ?? parentIds.set(child, []).get(child)!).push(parent);
    (childIds.get(parent) ?? childIds.set(parent, []).get(parent)!).push(child);
  }

  const unions: { a: string; b: string }[] = [];
  const seenUnions = new Set<string>();
  for (const { a, b } of input.unions) {
    if (!byId.has(a) || !byId.has(b)) continue;
    const key = a < b ? `${a}\u0000${b}` : `${b}\u0000${a}`;
    if (seenUnions.has(key)) continue;
    seenUnions.add(key);
    unions.push({ a, b });
  }

  /** Oldest first; unknown birth last; ties as given. */
  const byBirth = (x: P, y: P) =>
    (born(x) ?? Infinity) - (born(y) ?? Infinity) || position.get(x.id)! - position.get(y.id)!;
  const people = (ids: readonly string[] | undefined) => (ids ?? []).map((id) => byId.get(id)!).sort(byBirth);

  // TODO(perf, docs/PLAN.md step 4): scans every union on each call, inside the path search.
  const spouses = (id: string) =>
    people(unions.filter((union) => union.a === id || union.b === id).map((union) => (union.a === id ? union.b : union.a)));

  const areHalfSiblings = (a: string, b: string) => {
    const ofA = parentIds.get(a) ?? [];
    const ofB = parentIds.get(b) ?? [];
    return ofA.length === 2 && ofB.length === 2 && ofA.filter((id) => ofB.includes(id)).length === 1;
  };

  const tree: Tree<P> = {
    byId,
    parents: (id) => people(parentIds.get(id)),
    children: (id) => people(childIds.get(id)),
    spouses,
    areHalfSiblings,
    name,
    born,
  };
  positions.set(tree, position);
  return tree;
}
