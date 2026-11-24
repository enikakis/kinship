/*
 * The family tree the kinship code works on, and quick lookups of relatives.
 *
 * Extracted from vrisies-history-hub (src/features/family-tree/model.ts and person-display.ts):
 * only what kinship.ts needs, without zod and without the site's own fields (photos, bios…).
 * Still site-shaped (`given_name`, `surname`, `living`): making `Person` generic is step 2 of
 * docs/PLAN.md.
 */

export const SEXES = ["female", "male", "unknown"] as const;
export type Sex = (typeof SEXES)[number];

/** A date that may be only a year, a month and year, or a full date. */
export type FuzzyDate = { year?: number; month?: number; day?: number; approx?: boolean };

export type TreePerson = {
  id: string;
  given_name: string;
  surname: string;
  sex: Sex;
  living?: boolean;
  birth?: FuzzyDate;
};

/** A marriage (or partnership) between persons `a` and `b`. */
export type TreeUnion = FuzzyDate & { id: string; a: string; b: string };

export type Tree = {
  people: TreePerson[];
  /** [parent, child] */
  parents: [string, string][];
  unions: TreeUnion[];
};

export type Spouse = { person: TreePerson; union: TreeUnion };

/** Looks up relatives quickly in a tree of any size. */
export function indexTree(tree: Tree) {
  const byId = new Map(tree.people.map((person) => [person.id, person]));
  const parentIds = new Map<string, string[]>();
  const childIds = new Map<string, string[]>();
  for (const [parent, child] of tree.parents) {
    if (!byId.has(parent) || !byId.has(child)) continue;
    (parentIds.get(child) ?? parentIds.set(child, []).get(child)!).push(parent);
    (childIds.get(parent) ?? childIds.set(parent, []).get(parent)!).push(child);
  }
  const people = (ids: string[] | undefined) => (ids ?? []).map((id) => byId.get(id)!).sort(byBirth);

  const parents = (id: string) => people(parentIds.get(id));
  const children = (id: string) => people(childIds.get(id));
  // TODO(perf, docs/PLAN.md step 4): scans every union on each call, inside the path search.
  const spouses = (id: string): Spouse[] =>
    tree.unions
      .filter((union) => union.a === id || union.b === id)
      .map((union) => ({ union, person: byId.get(union.a === id ? union.b : union.a)! }))
      .filter((spouse) => spouse.person);
  /**
   * Whether two people are half-siblings: both have two recorded parents and share only one. When
   * either one's other parent is not recorded we cannot tell, so we do not say so.
   */
  const areHalfSiblings = (a: string, b: string) => {
    const ofA = parentIds.get(a) ?? [];
    const ofB = parentIds.get(b) ?? [];
    return ofA.length === 2 && ofB.length === 2 && ofA.filter((id) => ofB.includes(id)).length === 1;
  };

  return { byId, parents, children, spouses, areHalfSiblings };
}

export type TreeIndex = ReturnType<typeof indexTree>;

/** Oldest first; people without a birth year last. */
export const byBirth = (a: TreePerson, b: TreePerson) =>
  (a.birth?.year ?? 9999) - (b.birth?.year ?? 9999) || a.given_name.localeCompare(b.given_name, "el");

export const fullName = (person: Pick<TreePerson, "given_name" | "surname">) =>
  [person.given_name, person.surname].filter(Boolean).join(" ");
