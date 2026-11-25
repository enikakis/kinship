/*
 * Public entry point: `createTree`, then `relate` for how two people are related, as data, and
 * `describeRelation` to put it into words in a locale. Designed in docs/design.md.
 */

export type { Blood, Classification, Kind, MarriageKind } from "./classify";
export type { LegalDegree } from "./degree";
export type { OtherTieText, RelationshipText, RelationText } from "./describe";
export { describeRelation } from "./describe";
export type { ConnectionDiagram, DiagramNode } from "./diagram";
export type { KinshipLocale, NameQuery } from "./locale";
export type { OtherTie, Relation, Relationship } from "./relate";
export { relate } from "./relate";
export type { RelationEntry, RelationToEveryone } from "./relate-all";
export { relateAll } from "./relate-all";
export type { Tree } from "./tree";
export { createTree } from "./tree";
export type { Move, Person, Sex, TreeInput, TreeOptions } from "./types";
export type { TreeIssue, TreeValidation } from "./validate";
export { validateTree } from "./validate";
