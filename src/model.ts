import { z } from "zod";
import { normalize } from "@/shared/lib/search";

/* ---------- The tree as the site reads it (`family_tree()`) ---------- */

/** A date that may be only a year, a month and year, or a full date. */
const fuzzyDateSchema = z.object({
  year: z.number().int().optional(),
  month: z.number().int().min(1).max(12).optional(),
  day: z.number().int().min(1).max(31).optional(),
  approx: z.boolean().optional(),
  place: z.string().optional(),
});
export type FuzzyDate = z.infer<typeof fuzzyDateSchema>;

const imageSchema = z.object({
  src: z.string(),
  srcSm: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  alt: z.string().optional(),
});

export const SEXES = ["female", "male", "unknown"] as const;
export type Sex = (typeof SEXES)[number];

export const treePersonSchema = z.object({
  id: z.string(),
  given_name: z.string(),
  surname: z.string(),
  sex: z.enum(SEXES),
  living: z.boolean(),
  /** For visitors, a members-only person: only their place in the tree, no name or details. */
  locked: z.boolean().optional(),
  nickname: z.string().optional(),
  birth_surname: z.string().optional(),
  birth: fuzzyDateSchema.optional(),
  death: fuzzyDateSchema.optional(),
  occupation: z.string().optional(),
  bio: z.string().optional(),
  photo: imageSchema.nullable().optional(),
});
/** A person with only the details the reader may see. */
export type TreePerson = z.infer<typeof treePersonSchema>;

const treeUnionSchema = fuzzyDateSchema.extend({ id: z.string(), a: z.string(), b: z.string() });
export type TreeUnion = z.infer<typeof treeUnionSchema>;

const treeSchema = z.object({
  people: z.array(treePersonSchema),
  /** [parent, child] */
  parents: z.array(z.tuple([z.string(), z.string()])),
  unions: z.array(treeUnionSchema),
});
export type Tree = z.infer<typeof treeSchema>;

/** The result of `family_tree()`, checked: it is built by the database as `jsonb`. */
export const parseTree = (value: unknown): Tree => treeSchema.parse(value);

export const emptyTree: Tree = { people: [], parents: [], unions: [] };

/* ---------- Relatives ---------- */

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
  const spouses = (id: string): Spouse[] =>
    tree.unions
      .filter((union) => union.a === id || union.b === id)
      .map((union) => ({ union, person: byId.get(union.a === id ? union.b : union.a)! }))
      .filter((spouse) => spouse.person);
  /** Brothers and sisters, including half-siblings (who share one parent). */
  const siblings = (id: string) => {
    const ids = new Set(parentIds.get(id)?.flatMap((parent) => childIds.get(parent) ?? []));
    ids.delete(id);
    return people([...ids]);
  };
  /**
   * Whether two people are half-siblings: both have two recorded parents and share only one. When
   * either one's other parent is not recorded we cannot tell, so we do not say so.
   */
  const areHalfSiblings = (a: string, b: string) => {
    const ofA = parentIds.get(a) ?? [];
    const ofB = parentIds.get(b) ?? [];
    return ofA.length === 2 && ofB.length === 2 && ofA.filter((id) => ofB.includes(id)).length === 1;
  };
  const grandparents = (id: string) => unique(parents(id).flatMap((parent) => parents(parent.id)));
  const grandchildren = (id: string) => unique(children(id).flatMap((child) => children(child.id)));

  return { byId, parents, children, spouses, siblings, areHalfSiblings, grandparents, grandchildren };
}

export type TreeIndex = ReturnType<typeof indexTree>;

const unique = (people: TreePerson[]) => [...new Map(people.map((person) => [person.id, person])).values()];

/** Oldest first; people without a birth year last. */
export const byBirth = (a: TreePerson, b: TreePerson) =>
  (a.birth?.year ?? 9999) - (b.birth?.year ?? 9999) || a.given_name.localeCompare(b.given_name, "el");

/* ---------- Families ---------- */

/**
 * A family groups the masculine and feminine forms of a surname (Παπαδόπουλος / Παπαδοπούλου), which differ
 * in Greek only by the final ς.
 */
export const familyKey = (surname: string) => normalize(surname).replace(/σ$/, "");

/**
 * Whether someone was born into a family, by the surname they were born with: a woman who took the
 * family's name when she married still came from her own family.
 */
export const bornInto = (person: Pick<TreePerson, "surname" | "birth_surname">, family: Pick<Family, "key">) =>
  familyKey(person.birth_surname || person.surname) === family.key;

/** Another family a family is related to by marriage, with the number of marriages. */
export type Relation = { key: string; name: string; marriages: number };

/** A family: the people of a surname and the spouses who married into it from elsewhere. */
export type Family = { key: string; name: string; people: TreePerson[]; relatedTo: Relation[] };

/** The surname a group is shown by: its most common masculine form, or its most common form. */
function surnameOf(people: TreePerson[]) {
  const counts = new Map<string, number>();
  for (const person of people) counts.set(person.surname, (counts.get(person.surname) ?? 0) + 1);
  const ranked = [...counts].sort((a, b) => b[1] - a[1]);
  return (ranked.find(([name]) => /ς$/.test(name)) ?? ranked[0])[0];
}

/**
 * The families of the tree, largest first. A surname is a family when it spans at least two
 * generations (someone with a parent of the same surname); spouses who married in from a surname
 * that is not a family here are counted in their spouse's family, not as families of their own.
 */
export function familiesOf(tree: Tree, index: TreeIndex = indexTree(tree)): Family[] {
  const groups = new Map<string, TreePerson[]>();
  for (const person of tree.people) {
    const key = familyKey(person.surname);
    if (key) (groups.get(key) ?? groups.set(key, []).get(key)!).push(person);
  }
  const keyOf = (person: TreePerson) => familyKey(person.surname);
  const spansGenerations = (people: TreePerson[]) =>
    people.some((person) => index.parents(person.id).some((parent) => keyOf(parent) === keyOf(person)));

  const families = new Map<string, Family>();
  for (const [key, people] of groups) {
    if (spansGenerations(people))
      families.set(key, { key, name: surnameOf(people), people: [...people], relatedTo: [] });
  }
  for (const [key, people] of groups) {
    if (families.has(key)) continue;
    for (const person of people) {
      for (const { person: spouse } of index.spouses(person.id)) {
        const family = families.get(keyOf(spouse));
        if (family && !family.people.includes(person)) family.people.push(person);
      }
    }
  }

  for (const family of families.values()) {
    const relations = new Map<string, Relation>();
    const counted = new Set<string>();
    for (const person of family.people) {
      if (keyOf(person) !== family.key) continue;
      for (const { person: spouse, union } of index.spouses(person.id)) {
        const key = keyOf(spouse);
        if (!key || key === family.key || counted.has(union.id)) continue;
        counted.add(union.id);
        const relation = relations.get(key) ?? {
          key,
          name: families.get(key)?.name ?? surnameOf(groups.get(key)!),
          marriages: 0,
        };
        relation.marriages += 1;
        relations.set(key, relation);
      }
    }
    family.relatedTo = [...relations.values()].sort(
      (a, b) => b.marriages - a.marriages || a.name.localeCompare(b.name, "el"),
    );
    family.people.sort(byBirth);
  }
  return [...families.values()].sort((a, b) => b.people.length - a.people.length || a.name.localeCompare(b.name, "el"));
}

/* ---------- The tree at a glance ---------- */

/** A family with the first known person of each of its lines (people of the surname not known to be related). */
export type FamilySummary = Family & { lines: TreePerson[] };

export type TreeOverview = { people: number; generations: number; families: FamilySummary[] };

/** The figures of the tree and its families, each with the person it starts from. */
export function treeOverview(tree: Tree): TreeOverview {
  const index = indexTree(tree);
  return {
    people: tree.people.length,
    generations: generationCount(tree, index),
    families: familiesOf(tree, index).map((family) => ({ ...family, lines: familyLines(family, index) })),
  };
}

/** How many generations the longest line from parent to child spans (1 for people without relatives). */
export function generationCount(tree: Tree, index: TreeIndex = indexTree(tree)): number {
  const depth = new Map<string, number>();
  const visit = (id: string, path: Set<string>): number => {
    const known = depth.get(id);
    if (known !== undefined) return known;
    // The database refuses cycles; this only keeps a broken tree from looping forever.
    if (path.has(id)) return 0;
    path.add(id);
    const generations = 1 + index.parents(id).reduce((most, parent) => Math.max(most, visit(parent.id, path)), 0);
    path.delete(id);
    depth.set(id, generations);
    return generations;
  };
  return tree.people.reduce((most, person) => Math.max(most, visit(person.id, new Set())), 0);
}

/**
 * The people each line of a family starts from, the largest line first. A family is often several
 * lines that share a surname without a known common ancestor. A line starts from a member without
 * parents in the family; a couple starts one line, from the one born into the family.
 */
export function familyLines(family: Family, index: TreeIndex): TreePerson[] {
  const members = new Set(family.people.map((person) => person.id));
  const inFamily = (people: TreePerson[]) => people.filter((person) => members.has(person.id));
  const descendants = (id: string) => {
    const seen = new Set<string>();
    const queue = [id];
    while (queue.length > 0) {
      for (const child of inFamily(index.children(queue.pop()!))) {
        if (seen.has(child.id)) continue;
        seen.add(child.id);
        queue.push(child.id);
      }
    }
    return seen;
  };
  const ranked = family.people
    .filter((person) => inFamily(index.parents(person.id)).length === 0)
    .map((person) => ({ person, descendants: descendants(person.id), bornInto: bornInto(person, family) }))
    .sort(
      (a, b) =>
        b.descendants.size - a.descendants.size ||
        Number(b.bornInto) - Number(a.bornInto) ||
        byBirth(a.person, b.person),
    );

  // A root whose descendants are already in a line (a spouse, or a later branch) adds no new line.
  const covered = new Set<string>();
  const heads: TreePerson[] = [];
  for (const { person, descendants: line } of ranked) {
    if (line.size === 0 || [...line].some((id) => covered.has(id))) continue;
    heads.push(person);
    for (const id of line) covered.add(id);
  }
  return heads.length > 0 ? heads : [ranked[0]?.person ?? [...family.people].sort(byBirth)[0]];
}

/**
 * Whether a person's names (also at birth, and nickname) contain every word of the search; null
 * when the search has no words. The public search and the curators' lists find people alike.
 */
export function nameMatcher(query: string) {
  const words = normalize(query).split(" ").filter(Boolean);
  if (words.length === 0) return null;
  return (person: Pick<TreePerson, "given_name" | "surname" | "birth_surname" | "nickname">) => {
    const text = normalize(
      [person.given_name, person.surname, person.birth_surname, person.nickname].filter(Boolean).join(" "),
    );
    return words.every((word) => text.includes(word));
  };
}

/** People whose names (also at birth, and nickname) contain every word of the search. */
export function searchPeople(tree: Tree, query: string, limit = 50): TreePerson[] {
  const matches = nameMatcher(query);
  if (!matches) return [];
  return tree.people
    .filter((person) => !person.locked && matches(person))
    .sort(byBirth)
    .slice(0, limit);
}
