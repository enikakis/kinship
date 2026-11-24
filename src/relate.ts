import { lastOf, movesOf, type Chain } from "./chain";
import { findRelationships } from "./choose";
import { classify, type Classification } from "./classify";
import { legalDegree, type LegalDegree } from "./degree";
import { chainDiagram, type ConnectionDiagram } from "./diagram";
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

/** A blood tie besides the main relationship, through its own common ancestors (a couple, often). */
export type OtherTie<P extends Person> = Relationship<P> & { commonAncestors: P[] };

export type Relation<P extends Person> = {
  /** The relationship to name first (see `findRelationships`). */
  main: Relationship<P>;
  /** The other blood ties, closest first. */
  others: OtherTie<P>[];
  /** They are married to each other: their blood ties were there before they married. */
  couple: boolean;
};

/**
 * How two people of the tree are related: the main relationship and the other blood ties, as
 * data, with the caller's own person objects. Null when they are not connected (or are the same
 * person). `describeRelation` puts it into words.
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

function relationship<P extends Person>(tree: Tree<P>, chain: Chain<P>): Relationship<P> {
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
