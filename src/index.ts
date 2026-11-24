/*
 * Public entry point: `createTree`, then `relate` for how two people are related, as data, and
 * `describeRelation` to put it into words in a locale. Designed in
 * docs/superpowers/specs/2026-11-24-kinship-v1-design.md.
 */
export { createTree } from "./tree";
export type { Tree } from "./tree";
export { relate } from "./relate";
export type { OtherTie, Relation, Relationship } from "./relate";
export { describeRelation } from "./describe";
export type { RelationshipText, RelationText } from "./describe";
export type { Blood, Kind } from "./classify";
export type { LegalDegree } from "./degree";
export type { ConnectionDiagram, DiagramNode } from "./diagram";
export type { KinshipLocale, NameQuery } from "./locale";
export type { Move, Person, Sex, TreeInput, TreeOptions } from "./types";

/*
 * The original API, until the tests are ported to the new one. Its types that share a name with
 * the new ones are exported with a `Legacy` prefix; its `Sex` is the same as the new one.
 */
export { relationReport } from "./legacy/kinship";
export type {
  ConnectionDiagram as LegacyConnectionDiagram,
  OtherTie as LegacyOtherTie,
  RelationReport,
  Relationship as LegacyRelationship,
} from "./legacy/kinship";
export type { Locale } from "./legacy/locale";
export { indexTree, SEXES } from "./legacy/tree";
export type { FuzzyDate, Tree as LegacyTree, TreeIndex, TreePerson, TreeUnion } from "./legacy/tree";
