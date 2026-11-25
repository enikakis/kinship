import { type Chain, lastOf, movesOf } from "./chain";
import { findRelationships } from "./choose";
import { type Classification, classify } from "./classify";
import { type LegalDegree, legalDegree } from "./degree";
import { type ConnectionDiagram, chainDiagram } from "./diagram";
import type { Tree } from "./tree";
import type { Move, Person } from "./types";

/** One way two people are related: what it is, the chain that makes it, and how to draw it. */
export type Relationship<P extends Person> = Classification & {
  from: P;
  to: P;
  /** Each person after `from`, with how they were reached; the last one is `to`. */
  path: { person: P; move: Move }[];
  moves: Move[];
  /** The degree as the law counts it; null when it counts none. */
  legalDegree: LegalDegree | null;
  diagram: ConnectionDiagram<P>;
};

/** A blood tie besides the main relationship, through its own common ancestors. */
export type OtherTie<P extends Person> = Relationship<P> & {
  /** The closest common ancestors of this tie: one person, or a couple (often). */
  commonAncestors: P[];
};

/** How two people are related: the main relationship, the other blood ties, and whether they are a couple. */
export type Relation<P extends Person> = {
  /**
   * The relationship to name first. Blood comes first, with two exceptions: a couple always comes
   * first as a couple, and another named relation by marriage (an aunt's husband, an in-law) comes
   * before a blood tie more distant than first cousins: in a village an aunt's husband is often a
   * distant cousin too, but her husband first.
   */
  main: Relationship<P>;
  /** The other blood ties, closest first. */
  others: OtherTie<P>[];
  /** They are married to each other: their blood ties were there before they married. */
  couple: boolean;
};

/**
 * How two people of the tree are related: the main relationship and the other blood ties, as
 * data, with the caller's own person objects. Null when they are not connected (or are the same
 * person). `describeRelation` puts it into words. `relate(tree, b, a)` is `relate(tree, a, b)`
 * read backwards: the same relationship, from the other end.
 *
 * @param tree A tree made by `createTree`.
 * @param fromId The id of the first person (the viewer).
 * @param toId The id of the second person.
 * @returns The relation, or null for people who are not connected, the same person, or an id that
 * is not in the tree (use `validateTree` to tell these apart).
 *
 * @example
 * ```ts
 * // `tree` as in `createTree`: Anna and Kostas are grandchildren of Maria.
 * const relation = relate(tree, "anna", "kostas");
 * relation?.main.kind; // "cousin"
 * relation?.main.cousin; // { degree: 1, removed: 0 }
 * relation?.main.legalDegree; // { degree: 4, line: "collateral", kind: "blood" }
 * relate(tree, "anna", "nobody"); // null
 * ```
 */
export function relate<P extends Person>(tree: Tree<P>, fromId: string, toId: string): Relation<P> | null {
  const found = findRelationships(tree, fromId, toId);
  if (!found) return null;
  return {
    main: relationship(tree, found.main),
    others: found.others.map((tie) => ({ ...relationship(tree, tie.chain), commonAncestors: tie.ancestors })),
    couple: found.couple,
  };
}

/** One relationship, as data, from the chain that makes it (`relateAll` builds its entries with it too). */
export function relationship<P extends Person>(tree: Tree<P>, chain: Chain<P>): Relationship<P> {
  const moves = movesOf(chain);
  return {
    ...classify(tree, chain),
    from: chain.from,
    to: lastOf(chain),
    path: chain.steps,
    moves,
    legalDegree: legalDegree(moves),
    diagram: chainDiagram(chain),
  };
}
