/*
 * Public entry point. For now it re-exports the code as it came from vrisies-history-hub; the
 * final API (createTree / relate / nameOf / validateTree) is designed in docs/PLAN.md.
 */
export { relationReport } from "./kinship";
export type { ConnectionDiagram, OtherTie, RelationReport, Relationship } from "./kinship";
export type { Locale } from "./locale";
export { indexTree, SEXES } from "./tree";
export type { FuzzyDate, Sex, Spouse, Tree, TreeIndex, TreePerson, TreeUnion } from "./tree";
