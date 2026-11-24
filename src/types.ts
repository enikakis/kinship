export type Sex = "female" | "male" | "unknown";

/** The least the library needs to know about a person; any extra fields are yours. */
export type Person = { id: string; sex: Sex };

export type Move = "up" | "down" | "spouse";

export type TreeInput<P extends Person> = {
  people: readonly P[];
  /** [parentId, childId] */
  parents: readonly (readonly [parentId: string, childId: string])[];
  unions: readonly { a: string; b: string }[];
};

export type TreeOptions<P extends Person> = {
  /** How to write a person's name. Default: their `name` property if it is a string, else their id. */
  name?: (person: P) => string;
  /**
   * Birth year. Relatives are ordered by it, oldest first, which decides which of two equally
   * short chains wins (with the order of `people` as the final tie-break), and it tells
   * `elderBranch`. Default: unknown for everyone.
   */
  born?: (person: P) => number | undefined;
};
