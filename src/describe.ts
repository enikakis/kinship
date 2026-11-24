import { reverseMoves } from "./chain";
import { nameQuery } from "./classify";
import type { KinshipLocale } from "./locale";
import type { OtherTie, Relation, Relationship } from "./relate";
import type { Tree } from "./tree";
import type { Person } from "./types";

/** One way two people are related, in words. */
export type RelationshipText = {
  /**
   * What the second person is to the first (`other`) and the first to the second (`self`), e.g.
   * «θεία» and «ανιψιός». Null for chains with no everyday name (distant relations by marriage).
   */
  roles: { other: string; self: string } | null;
  /** The relationship in a line: what the second person is to the first or, with no name for it, how far apart they are. */
  summary: string;
  /** The degree as the law counts it, e.g. «Συγγένεια εξ αίματος εκ πλαγίου, 3ου βαθμού»; null when it counts none. */
  degree: string | null;
  /** The chain as text, in its order: the first person's name, then each step, e.g. «πατέρας: Αντώνης Παπαδόπουλος». */
  chain: { id: string; text: string }[];
};

export type RelationText = {
  main: RelationshipText;
  /**
   * The other blood ties, each with its common ancestors, e.g. «Κοινοί πρόγονοι: Στέλιος
   * Παπαδόπουλος και Σοφία Παπαδοπούλου»; null when one of the two descends from the other.
   */
  others: (RelationshipText & { commonAncestors: string | null })[];
  couple: boolean;
};

/** A relation (see `relate`) in words, in `locale`. */
export function describeRelation<P extends Person>(tree: Tree<P>, relation: Relation<P>, locale: KinshipLocale): RelationText {
  return {
    main: relationshipText(tree, relation.main, locale),
    others: relation.others.map((tie) => ({
      ...relationshipText(tree, tie, locale),
      commonAncestors: commonAncestors(tree, tie, locale),
    })),
    couple: relation.couple,
  };
}

/** A relationship in words, both ways. */
function relationshipText<P extends Person>(
  tree: Tree<P>,
  relationship: Relationship<P>,
  locale: KinshipLocale,
): RelationshipText {
  const { from, path, moves, legalDegree } = relationship;
  const halfSibling = relationship.kind === "halfSibling";
  const sexes = [from, ...path.map((step) => step.person)].map((person) => person.sex);
  const other = locale.name(nameQuery(moves, sexes, halfSibling));
  const self = locale.name(nameQuery(reverseMoves(moves), [...sexes].reverse(), halfSibling));
  const roles = other !== null && self !== null ? { other, self } : null;
  return {
    roles,
    // Every blood relationship has a name, so only chains through marriages go without one.
    summary: roles?.other ?? locale.throughMarriages(marriagesOf(tree, relationship)),
    degree: legalDegree && locale.degree(legalDegree),
    chain: [
      { id: from.id, text: tree.name(from) },
      ...path.map(({ person, move }) => ({
        id: person.id,
        text: `${locale.step(move, person.sex)}: ${tree.name(person)}`,
      })),
    ],
  };
}

/** The couples along a relationship's chain, each as the names of the two spouses. */
function marriagesOf<P extends Person>(tree: Tree<P>, { from, path }: Relationship<P>): [string, string][] {
  return path.flatMap((step, i) =>
    step.move === "spouse" ? [[tree.name(i === 0 ? from : path[i - 1].person), tree.name(step.person)]] : [],
  );
}

/** The common ancestors of a blood tie, named; none on a direct line, where one is the other's ancestor. */
function commonAncestors<P extends Person>(tree: Tree<P>, tie: OtherTie<P>, locale: KinshipLocale): string | null {
  if (tie.commonAncestors.some((ancestor) => ancestor.id === tie.from.id || ancestor.id === tie.to.id)) return null;
  return locale.commonAncestors(tie.commonAncestors.map(tree.name));
}
