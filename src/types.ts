/** A person's sex as the names need it; "unknown" gives both forms where a language has them («θείος/θεία»). */
export type Sex = "female" | "male" | "unknown";

/** The least the library needs to know about a person; any extra fields are yours. */
export type Person = { id: string; sex: Sex };

/** One step along a chain of relatives: to a parent, to a child, or to a spouse. */
export type Move = "up" | "down" | "spouse";

/**
 * The raw data of a family tree, which `createTree` indexes and `validateTree` checks. `fromGedcom`
 * reads a GEDCOM file into this shape.
 */
export type TreeInput<P extends Person> = {
  /** Everyone in the tree; ids must be unique. */
  people: readonly P[];
  /** [parentId, childId]. Default: none. */
  parents?: readonly (readonly [parentId: string, childId: string])[];
  /** Married couples, by the ids of the two spouses; the order within a pair does not matter. Default: none. */
  unions?: readonly { a: string; b: string }[];
};

/** How `createTree` reads your person objects. */
export type TreeOptions<P extends Person> = {
  /** How to write a person's name. Default: their `name` property if it is a string, else their id. */
  name?: (person: P) => string;
  /**
   * Birth year. Relatives are ordered by it, oldest first, which decides which of two equally
   * short chains wins (with the order of `people` as the final tie-break), and it tells
   * `elderBranch`. The search always runs from whichever of the two people comes first in
   * `people`, so when chains tie the answer is the same from either end. Default: unknown for
   * everyone.
   */
  born?: (person: P) => number | undefined;
};
