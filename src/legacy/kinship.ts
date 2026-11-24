import type { Locale } from "./locale";
import { lastOf, movesKey, reverseMoves, type Chain } from "../chain";
import { findRelationships } from "../choose";
import { nameQuery } from "../classify";
import { chainDiagram, type ConnectionDiagram as NewDiagram } from "../diagram";
import { legalDegree } from "../degree";
import type { KinshipLocale } from "../locale";
import { el } from "../locales/el";
import { en } from "../locales/en";
import type { BloodTie } from "../ties";
import { fullName, type TreeIndex, type TreePerson } from "./tree";

/** The chain of this module's people. */
type Connection = Chain<TreePerson>;

const locales: Record<Locale, KinshipLocale> = { el, en };

/*
 * How two people of the tree are related: the shortest chain of parents, children and marriages
 * between them, the other ways they are related by blood, and all of it put into words, in Greek
 * or English. `relationReport` is the whole interface: the page only shows what it returns.
 */

/* ---------- The report ---------- */

/** One way two people are related, in words and drawn as a small tree. */
export type Relationship = {
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
  diagram: ConnectionDiagram;
};

/** A blood tie besides the main relationship, through its own common ancestors. */
export type OtherTie = Relationship & {
  /** e.g. «Κοινοί πρόγονοι: Στέλιος Παπαδόπουλος και Σοφία Παπαδοπούλου»; null when one of the two descends from the other. */
  commonAncestors: string | null;
};

export type RelationReport = {
  from: TreePerson;
  to: TreePerson;
  /** The relationship to name first (see `findRelationships`). */
  main: Relationship;
  /** The other blood ties, closest first. */
  others: OtherTie[];
  /** They are married to each other: their blood ties were there before they married. */
  couple: boolean;
};

/** How two people are related, in `locale`. Null when they are not connected (or are the same person). */
export function relationReport(index: TreeIndex, fromId: string, toId: string, locale: Locale): RelationReport | null {
  const found = findRelationships(index, fromId, toId);
  if (!found) return null;
  return {
    from: found.main.from,
    to: lastOf(found.main),
    main: describeChain(index, found.main, locale),
    others: found.others.map((tie) => ({
      ...describeChain(index, tie.chain, locale),
      commonAncestors: commonAncestors(tie, locale),
    })),
    couple: found.couple,
  };
}

/** A chain in words, both ways, and as a diagram with the two people marked. */
function describeChain(index: TreeIndex, connection: Connection, locale: Locale): Relationship {
  const { from, steps } = connection;
  const to = lastOf(connection);
  const moves = steps.map((step) => step.move);
  const halfSibling = movesKey(moves) === "UD" && index.areHalfSiblings(from.id, to.id);
  const sexes = [from, ...steps.map((step) => step.person)].map((person) => person.sex);
  const language = locales[locale];
  const other = language.name(nameQuery(moves, sexes, halfSibling));
  const self = language.name(nameQuery(reverseMoves(moves), [...sexes].reverse(), halfSibling));
  const roles = other !== null && self !== null ? { other, self } : null;
  const degree = legalDegree(moves);
  return {
    roles,
    // Every blood relationship has a name, so only chains through marriages go without one.
    summary: roles?.other ?? language.throughMarriages(marriagesOf(connection)),
    degree: degree && language.degree(degree),
    chain: [
      { id: from.id, text: fullName(from) },
      ...steps.map(({ person, move }) => ({
        id: person.id,
        text: `${language.step(move, person.sex)}: ${fullName(person)}`,
      })),
    ],
    diagram: {
      ...chainDiagram(connection),
      ends: [
        { id: from.id, role: roles?.self ?? null },
        { id: to.id, role: roles?.other ?? null },
      ],
    },
  };
}

/** The couples along a chain, each as the names of the two spouses. */
function marriagesOf({ from, steps }: Connection): [string, string][] {
  return steps.flatMap((step, i) =>
    step.move === "spouse" ? [[fullName(i === 0 ? from : steps[i - 1].person), fullName(step.person)]] : [],
  );
}

/** The common ancestors of a blood tie, named; none on a direct line, where one is the other's ancestor. */
function commonAncestors(tie: BloodTie<TreePerson>, locale: Locale) {
  const ends = [tie.chain.from.id, lastOf(tie.chain).id];
  if (tie.ancestors.some((ancestor) => ends.includes(ancestor.id))) return null;
  return locales[locale].commonAncestors(tie.ancestors.map(fullName));
}

/* ---------- The chain as a small tree ---------- */

/**
 * The chain laid out as a tree (see `chainDiagram`), with the two people compared and what each
 * is to the other (null: no everyday name).
 */
export type ConnectionDiagram = NewDiagram<TreePerson> & {
  ends: { id: string; role: string | null }[];
};
