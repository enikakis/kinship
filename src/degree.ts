import { BLOOD, movesKey } from "./chain";
import type { Move } from "./types";

export type LegalDegree = { degree: number; line: "direct" | "collateral"; kind: "blood" | "affinity" };

/**
 * The degree of a relationship as the law counts it (Αστικός Κώδικας, άρθρα 1463–1464): one
 * degree for each generation between the two, through the common ancestor. By blood, or by
 * marriage (αγχιστεία) to the spouse's blood relatives, in the same degree. In the direct line
 * one descends from the other; otherwise the line is collateral. Null for a couple and for
 * relations through more than one marriage, which the law does not count.
 */
export function legalDegree(moves: readonly Move[]): LegalDegree | null {
  const key = movesKey(moves);
  const blood = key.replace(/^S|S$/, "");
  if (blood === "" || !BLOOD.test(blood)) return null;
  return {
    degree: blood.length,
    line: !blood.includes("U") || !blood.includes("D") ? "direct" : "collateral",
    kind: key !== blood ? "affinity" : "blood",
  };
}
