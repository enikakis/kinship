import type { Blood } from "../classify";
import type { NameQuery } from "../locale";
import type { Move, Sex } from "../types";

/** A word in its three forms, by the sex of the person it names. */
export type Word = { male: string; female: string; unknown: string };

/** A word; with no form for an unknown sex, both forms: «θείος/θεία». */
export const w = (male: string, female: string, unknown = `${male}/${female}`): Word => ({ male, female, unknown });

/** The word for a single step of a chain: the next person is a parent, a child or a spouse. */
export const STEP_TERMS = { up: "parent", down: "child", spouse: "spouse" } as const satisfies Record<Move, string>;

/** The generations of a query's blood part, for the kinds named through a blood relative. */
export function bloodPart({ kind, blood }: NameQuery): Blood {
  if (!blood) throw new Error(`A "${kind}" name query needs the generations of its blood part`);
  return blood;
}

/**
 * How a language says the parts of a blood relative's name, each in a form `F`: on its own, or
 * inside a longer name (the Greek genitive; «du», «des», «del» in French, German and Spanish).
 */
export type BloodParts<F> = {
  /** The form of the person of the other's generation, after the head word: «του πατέρα», «du père». */
  of: F;
  /** An ancestor `generations` up: a parent (1), a grandparent (2)… */
  ancestor(generations: number, sex: Sex, form: F): string;
  /** A descendant `generations` down: a child (1), a grandchild (2)… */
  descendant(generations: number, sex: Sex, form: F): string;
  /** Someone of one's own generation `rung` generations below the common ancestor: a sibling (1), a cousin (2)… */
  kin(rung: number, sex: Sex, form: F): string;
  /** A sibling of an ancestor `up - 1` generations up: an uncle (2), a great-uncle (3)…; null past the words. */
  uncle(up: number, sex: Sex, form: F): string | null;
  /** A descendant of a sibling `down - 1` generations down: a nephew (2), a great-nephew (3)…; null past the words. */
  nephew(down: number, sex: Sex, form: F): string | null;
};

/**
 * A blood relative by the language's standard names: ancestors and descendants, siblings and
 * cousins, uncles and nephews. Relatives of different generations beyond these have no word, so
 * they are named through the person of the same generation as the other one: «πρώτος εξάδελφος
 * του πατέρα», «fils de la cousine germaine». `chain` is the sex of everyone on the chain, the
 * first person first; `form` is the form of the head word, the rest is in the form `parts.of`.
 */
export function bloodName<F>(parts: BloodParts<F>, blood: Blood, sex: Sex, chain: readonly Sex[], form: F): string {
  const { up, down } = blood;
  if (down === 0) return parts.ancestor(up, sex, form);
  if (up === 0) return parts.descendant(down, sex, form);
  if (up === down) return parts.kin(up, sex, form);
  const named = down === 1 ? parts.uncle(up, sex, form) : up === 1 ? parts.nephew(down, sex, form) : null;
  if (named !== null) return named;
  // The first person's ancestor `apart` generations up, or the last person's.
  const apart = Math.abs(up - down);
  if (up > down) return `${parts.kin(down, sex, form)} ${parts.ancestor(apart, chain[apart] ?? "unknown", parts.of)}`;
  return `${parts.descendant(apart, sex, form)} ${parts.kin(up, chain[chain.length - 1 - apart] ?? "unknown", parts.of)}`;
}
