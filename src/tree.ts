import type { Person, TreeInput, TreeOptions } from "./types";

/**
 * The lookups `relate` needs; make one with `createTree`. Only trees made by `createTree` know the
 * order of the input `people`; any other object falls back to id order.
 */
export type Tree<P extends Person> = {
  /** Every person, by id. */
  readonly byId: ReadonlyMap<string, P>;
  /** The recorded parents of a person, ordered by birth year (unknown last), then as given in `people`; empty for an unknown id. */
  parents(id: string): P[];
  /** The recorded children of a person, ordered by birth year (unknown last), then as given in `people`; empty for an unknown id. */
  children(id: string): P[];
  /** The spouses of a person, ordered by birth year (unknown last), then as given in `people`; empty for an unknown id. */
  spouses(id: string): P[];
  /**
   * Whether two people are half-siblings: both have two recorded parents and share only one. When
   * either one's other parent is not recorded we cannot tell, so we do not say so.
   */
  areHalfSiblings(a: string, b: string): boolean;
  /** How a person's name is written, as `TreeOptions.name` says. */
  name(person: P): string;
  /** A person's birth year, as `TreeOptions.born` says; undefined when unknown. */
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

/**
 * Indexes a tree's people, parent links and unions so relatives are found quickly in a tree of any
 * size. Links to unknown ids, to oneself and repeated links are skipped quietly; `validateTree`
 * reports them. Your own person objects are kept as they are and come back from `relate`.
 *
 * @param input The people, `[parentId, childId]` links and unions.
 * @param options How to write names and read birth years; see `TreeOptions`.
 * @returns The lookups `relate` and `relateAll` need.
 *
 * @example
 * ```ts
 * import { createTree, relate } from "@enikakis/kinship";
 *
 * const tree = createTree({
 *   people: [
 *     { id: "maria", name: "Maria", sex: "female" },
 *     { id: "dafni", name: "Dafni", sex: "female" },
 *     { id: "petros", name: "Petros", sex: "male" },
 *     { id: "anna", name: "Anna", sex: "female" },
 *     { id: "kostas", name: "Kostas", sex: "male" },
 *   ],
 *   parents: [
 *     ["maria", "dafni"],
 *     ["maria", "petros"],
 *     ["dafni", "anna"],
 *     ["petros", "kostas"],
 *   ],
 *   unions: [],
 * });
 *
 * relate(tree, "anna", "kostas")?.main.kind; // "cousin"
 * ```
 */
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
    if (parent === child || !byId.has(parent) || !byId.has(child)) continue;
    const key = `${parent}\u0000${child}`;
    if (seenLinks.has(key)) continue;
    seenLinks.add(key);
    (parentIds.get(child) ?? parentIds.set(child, []).get(child)!).push(parent);
    (childIds.get(parent) ?? childIds.set(parent, []).get(parent)!).push(child);
  }

  // Each person's spouses in the order of the unions; sorted by birth on lookup, like parents.
  const spouseIds = new Map<string, string[]>();
  const seenUnions = new Set<string>();
  for (const { a, b } of input.unions) {
    if (a === b || !byId.has(a) || !byId.has(b)) continue;
    const key = a < b ? `${a}\u0000${b}` : `${b}\u0000${a}`;
    if (seenUnions.has(key)) continue;
    seenUnions.add(key);
    (spouseIds.get(a) ?? spouseIds.set(a, []).get(a)!).push(b);
    (spouseIds.get(b) ?? spouseIds.set(b, []).get(b)!).push(a);
  }

  /** Oldest first; unknown birth last; ties as given. */
  const byBirth = (x: P, y: P) =>
    (born(x) ?? Infinity) - (born(y) ?? Infinity) || position.get(x.id)! - position.get(y.id)!;
  const people = (ids: readonly string[] | undefined) => (ids ?? []).map((id) => byId.get(id)!).sort(byBirth);

  const areHalfSiblings = (a: string, b: string) => {
    const ofA = parentIds.get(a) ?? [];
    const ofB = parentIds.get(b) ?? [];
    return ofA.length === 2 && ofB.length === 2 && ofA.filter((id) => ofB.includes(id)).length === 1;
  };

  const tree: Tree<P> = {
    byId,
    parents: (id) => people(parentIds.get(id)),
    children: (id) => people(childIds.get(id)),
    spouses: (id) => people(spouseIds.get(id)),
    areHalfSiblings,
    name,
    born,
  };
  positions.set(tree, position);
  return tree;
}
