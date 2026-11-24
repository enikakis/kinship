import type { Sex } from "./types";

/** A relation by marriage with a name of its own (the same in every language). */
export type MarriageKind =
  | "spouse"
  | "parentInLaw"
  | "childInLaw"
  | "siblingInLaw"
  | "coParentInLaw"
  | "coSiblingInLaw"
  | "uncleByMarriage"
  | "nephewByMarriage"
  | "stepParent"
  | "stepChild";

/** Relations by marriage with a name of their own. */
const BY_MARRIAGE: Record<string, MarriageKind> = {
  S: "spouse",
  SU: "parentInLaw",
  DS: "childInLaw",
  SUD: "siblingInLaw",
  UDS: "siblingInLaw",
  DSU: "coParentInLaw",
  US: "stepParent",
  SD: "stepChild",
  // An aunt's husband, or a spouse's uncle; and the other way round.
  UUDS: "uncleByMarriage",
  SUUD: "uncleByMarriage",
  SUDD: "nephewByMarriage",
  UDDS: "nephewByMarriage",
};

/** The name of a relation by marriage, in any language; null when it has none. */
export function marriageKind(key: string, sex: Sex, otherSex: Sex): MarriageKind | null {
  // Two men married to sisters, or two women married to brothers; other pairs have no name.
  if (key === "SUDS") return sex !== "unknown" && sex === otherSex ? "coSiblingInLaw" : null;
  return BY_MARRIAGE[key] ?? null;
}
