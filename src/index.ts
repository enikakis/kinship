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
export type { OtherTieText, RelationshipText, RelationText } from "./describe";
export type { Blood, Kind } from "./classify";
export type { LegalDegree } from "./degree";
export type { ConnectionDiagram, DiagramNode } from "./diagram";
export type { KinshipLocale, NameQuery } from "./locale";
export type { Move, Person, Sex, TreeInput, TreeOptions } from "./types";

