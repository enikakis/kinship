import type { Locale } from "./locale";
import { describeRelation, type RelationshipText } from "../describe";
import type { ConnectionDiagram as NewDiagram } from "../diagram";
import type { KinshipLocale } from "../locale";
import { el } from "../locales/el";
import { en } from "../locales/en";
import { relate, type Relationship as NewRelationship } from "../relate";
import type { TreeIndex, TreePerson } from "./tree";

const locales: Record<Locale, KinshipLocale> = { el, en };

/*
 * The original report, kept until the tests are ported: `relate` and `describeRelation` in the
 * old shape, with the two people marked on each diagram.
 */

/** One way two people are related, in words and drawn as a small tree. */
export type Relationship = RelationshipText & { diagram: ConnectionDiagram };

/** A blood tie besides the main relationship, through its own common ancestors. */
export type OtherTie = Relationship & { commonAncestors: string | null };

export type RelationReport = {
  from: TreePerson;
  to: TreePerson;
  main: Relationship;
  others: OtherTie[];
  couple: boolean;
};

/** How two people are related, in `locale`. Null when they are not connected (or are the same person). */
export function relationReport(index: TreeIndex, fromId: string, toId: string, locale: Locale): RelationReport | null {
  const relation = relate(index, fromId, toId);
  if (!relation) return null;
  const text = describeRelation(index, relation, locales[locale]);
  return {
    from: relation.main.from,
    to: relation.main.to,
    main: withDiagram(relation.main, text.main),
    others: relation.others.map((tie, i) => withDiagram(tie, text.others[i])),
    couple: relation.couple,
  };
}

/** A relationship's text with its diagram, the two people marked with what each is to the other. */
function withDiagram<T extends RelationshipText>(relationship: NewRelationship<TreePerson>, text: T) {
  return {
    ...text,
    diagram: {
      ...relationship.diagram,
      ends: [
        { id: relationship.from.id, role: text.roles?.self ?? null },
        { id: relationship.to.id, role: text.roles?.other ?? null },
      ],
    },
  };
}

/**
 * The chain laid out as a tree (see `chainDiagram`), with the two people compared and what each
 * is to the other (null: no everyday name).
 */
export type ConnectionDiagram = NewDiagram<TreePerson> & {
  ends: { id: string; role: string | null }[];
};
