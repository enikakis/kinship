import type { Move, Person, Sex } from "./types";

/** The chain from one person to another: each person after the first, with how they were reached. */
export type Chain<P extends Person> = { from: P; steps: { person: P; move: Move }[] };

export const lastOf = <P extends Person>(chain: Chain<P>): P => chain.steps.at(-1)!.person;

export const movesOf = (chain: Chain<Person>): Move[] => chain.steps.map((step) => step.move);

/** The sex of everyone on a chain, the first person first. */
export const sexesOf = (chain: Chain<Person>): Sex[] =>
  [chain.from, ...chain.steps.map((step) => step.person)].map((person) => person.sex);

/** A chain as letters, e.g. "UUD" for an aunt: U up, D down, S a spouse. */
export const movesKey = (moves: readonly Move[]): string =>
  moves.map((move) => (move === "up" ? "U" : move === "down" ? "D" : "S")).join("");

/** Up to the closest common ancestor, then down. */
export const BLOOD = /^U*D*$/;

/**
 * Whether a chain is a blood relationship: up to a common ancestor, then down. A chain that goes
 * down to a child and up to the child's other parent passes through a marriage, recorded or not.
 */
export const isBloodLine = (chain: Chain<Person>): boolean => BLOOD.test(movesKey(movesOf(chain)));

/** The chain the other way round: from the last person back to the first. */
export const reverseMoves = (moves: readonly Move[]): Move[] =>
  [...moves].reverse().map((move) => (move === "up" ? "down" : move === "down" ? "up" : "spouse"));
