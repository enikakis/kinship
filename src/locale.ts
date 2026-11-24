import type { Blood, Kind } from "./classify";
import type { LegalDegree } from "./degree";
import type { Move, Sex } from "./types";

/** What a locale needs to name what the last person of a chain is to the first. */
export type NameQuery = {
  kind: Kind;
  /** From the viewer to the named person. */
  moves: readonly Move[];
  /**
   * Generations up and down of the blood part: the whole chain when it is blood; the blood
   * relative's chain for "spouseOfRelative" (without the last, marriage step) and
   * "relativeOfSpouse" (without the first); null for the other relations by marriage.
   */
  blood: Blood | null;
  /** Everyone on the chain, viewer first, named person last. */
  sexes: readonly Sex[];
};

/** A language relationships are named in: its words and its grammar. */
export interface KinshipLocale {
  /** e.g. "el", "en". */
  readonly code: string;
  /** What the named person is to the viewer, e.g. «θεία»; null when there is no everyday name. */
  name(query: NameQuery): string | null;
  /** One step of a chain: the next person is a parent, a child or a spouse, e.g. «πατέρας», "son". */
  step(move: Move, sex: Sex): string;
  /** The legal degree in a line, e.g. «Συγγένεια εξ αίματος εκ πλαγίου, 3ου βαθμού». */
  degree(degree: LegalDegree): string;
  /** Two people related only through marriages, each couple as the names of the two spouses. */
  throughMarriages(couples: readonly (readonly [string, string])[]): string;
  /** The common ancestors of a blood tie, named. */
  commonAncestors(names: readonly string[]): string;
}
