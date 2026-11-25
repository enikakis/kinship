import { describeRelation, type RelationText } from "../describe";
import type { KinshipLocale } from "../locale";
import { relate } from "../relate";
import type { Tree } from "../tree";
import type { Sex } from "../types";
import { family, line, type TestPerson } from "./fixtures";

/** The test helpers for one locale, so every locale's tests read the same way. */
export function describing(locale: KinshipLocale) {
  /** How `to` is related to `from` in `tree` (the `family` tree by default). */
  const text = (from: string, to: string, tree: Tree<TestPerson> = family): RelationText =>
    describeRelation(tree, relate(tree, from, to)!, locale);

  /** What `to` is to `from`, and what `from` is to `to`. */
  const roles = (from: string, to: string) => text(from, to).main.roles;

  /** The main relationship along a line of people p0, p1… linked by `key`: what the last is to p0. */
  const along = (key: string, sexes: readonly Sex[] | Sex) => {
    const { tree, from, to } = line(key, sexes);
    return text(from, to, tree).main;
  };

  /** The main relationship and the other blood ties, in a line each. */
  const ties = (from: string, to: string, tree: Tree<TestPerson>) => {
    const { main, others, couple } = text(from, to, tree);
    const tieTexts = others.map((tie) => ({ name: tie.summary, ancestors: tie.commonAncestors }));
    return { main: main.summary, couple, others: tieTexts };
  };

  return { text, roles, along, ties };
}
