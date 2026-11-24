/*
 * The family tree the kinship code works on, and quick lookups of relatives.
 *
 * Extracted from vrisies-history-hub (src/features/family-tree/model.ts and person-display.ts):
 * only what kinship.ts needs, without zod and without the site's own fields (photos, bios…).
 * Still site-shaped (`given_name`, `surname`, `living`): making `Person` generic is step 2 of
 * docs/PLAN.md.
 */

import { createTree, type Tree as NewTree } from "../tree";

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

/** Looks up relatives quickly in a tree of any size. */
export function indexTree(tree: Tree) {
  return createTree(tree, { name: fullName, born: (person) => person.birth?.year });
}

export type TreeIndex = NewTree<TreePerson>;

export const fullName = (person: Pick<TreePerson, "given_name" | "surname">) =>
  [person.given_name, person.surname].filter(Boolean).join(" ");
