import type { Move } from "../types";

/** A word in its three forms, by the sex of the person it names. */
export type Word = { male: string; female: string; unknown: string };

/** A word; with no form for an unknown sex, both forms: «θείος/θεία». */
export const w = (male: string, female: string, unknown = `${male}/${female}`): Word => ({ male, female, unknown });

/** The word for a single step of a chain: the next person is a parent, a child or a spouse. */
export const STEP_TERMS = { up: "parent", down: "child", spouse: "spouse" } as const satisfies Record<Move, string>;
