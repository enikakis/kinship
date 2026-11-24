/*
 * Public entry point. For now it re-exports the code as it came from vrisies-history-hub; the
 * final API (createTree / relate / nameOf / validateTree) is designed in docs/PLAN.md.
 */
export { relationReport } from "./legacy/kinship";
export type { ConnectionDiagram, OtherTie, RelationReport, Relationship } from "./legacy/kinship";
export type { Locale } from "./legacy/locale";
export { indexTree, SEXES } from "./legacy/tree";
export type { FuzzyDate, Sex, Spouse, Tree, TreeIndex, TreePerson, TreeUnion } from "./legacy/tree";
