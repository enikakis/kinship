import { BLOOD, lastOf, movesKey, movesOf, type Chain } from "./chain";
import type { NameQuery } from "./locale";
import type { Tree } from "./tree";
import type { Move, Person, Sex } from "./types";

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

/** What a chain makes the last person to the first, in any language. */
export type Kind =
  | "ancestor"
  | "descendant"
  | "sibling"
  | "halfSibling"
  | "uncle"
  | "nephew"
  | "cousin"
  | MarriageKind
  | "spouseOfRelative"
  | "relativeOfSpouse"
  | "unnamed";

/** A blood tie: generations up to the closest common ancestor, then down. */
export type Blood = { up: number; down: number };

const bloodOf = (key: string): Blood => {
  const up = key.indexOf("D") < 0 ? key.length : key.indexOf("D");
  return { up, down: key.length - up };
};

/** The kind of a chain of moves; `sexes` are everyone on the chain, the first person first. */
export function kindOf(moves: readonly Move[], sexes: readonly Sex[], halfSibling: boolean): Kind {
  const key = movesKey(moves);
  if (BLOOD.test(key)) {
    const { up, down } = bloodOf(key);
    if (down === 0) return "ancestor";
    if (up === 0) return "descendant";
    if (up === 1 && down === 1) return halfSibling ? "halfSibling" : "sibling";
    if (down === 1) return "uncle";
    if (up === 1) return "nephew";
    return "cousin";
  }
  const marriage = marriageKind(key, sexes[sexes.length - 1], sexes[0]);
  if (marriage) return marriage;
  if (BLOOD.test(key.slice(0, -1)) && key.endsWith("S")) return "spouseOfRelative";
  if (key.startsWith("S") && BLOOD.test(key.slice(1))) return "relativeOfSpouse";
  return "unnamed";
}

/**
 * What a locale needs to name the last person of a chain to the first (see `NameQuery`): the
 * kind, and the generations of the blood part, which for a relation by marriage named through
 * the blood relative is the chain without its marriage step.
 */
export function nameQuery(moves: readonly Move[], sexes: readonly Sex[], halfSibling: boolean): NameQuery {
  const kind = kindOf(moves, sexes, halfSibling);
  const key = movesKey(moves);
  const bloodPart =
    kind === "spouseOfRelative" ? key.slice(0, -1) : kind === "relativeOfSpouse" ? key.slice(1) : key;
  return { kind, moves, blood: BLOOD.test(bloodPart) ? bloodOf(bloodPart) : null, sexes };
}

export type Classification = {
  kind: Kind;
  blood: Blood | null;
  cousin: { degree: number; removed: number } | null;
  /** On which parent's side, when the chain starts by going up to a parent of known sex. */
  side: "paternal" | "maternal" | null;
  /** Whose branch starts with the elder child of the common ancestor, when birth years tell. */
  elderBranch: "from" | "to" | null;
};

/** Classifies a chain: its kind, its generations when it is blood, and which side and branch. */
export function classify<P extends Person>(tree: Tree<P>, chain: Chain<P>): Classification {
  const moves = movesOf(chain);
  const key = movesKey(moves);
  const sexes = [chain.from.sex, ...chain.steps.map((step) => step.person.sex)];
  const halfSibling = key === "UD" && tree.areHalfSiblings(chain.from.id, lastOf(chain).id);
  const blood = BLOOD.test(key) ? bloodOf(key) : null;
  const cousin =
    blood && blood.up >= 2 && blood.down >= 2
      ? { degree: Math.min(blood.up, blood.down) - 1, removed: Math.abs(blood.up - blood.down) }
      : null;
  const parentSex = moves[0] === "up" ? chain.steps[0].person.sex : null;
  const side = parentSex === "male" ? "paternal" : parentSex === "female" ? "maternal" : null;
  return { kind: kindOf(moves, sexes, halfSibling), blood, cousin, side, elderBranch: elderBranch(tree, chain, blood) };
}

/** For a collateral tie: whose branch starts with the elder of the common ancestor's two children. */
function elderBranch<P extends Person>(tree: Tree<P>, chain: Chain<P>, blood: Blood | null): "from" | "to" | null {
  if (!blood || blood.up < 1 || blood.down < 1) return null;
  const fromSide = blood.up === 1 ? chain.from : chain.steps[blood.up - 2].person;
  const toSide = chain.steps[blood.up].person;
  const a = tree.born(fromSide);
  const b = tree.born(toSide);
  if (a === undefined || b === undefined || a === b) return null;
  return a < b ? "from" : "to";
}
