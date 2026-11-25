import { createTree, type Tree } from "../tree";
import type { Move, Sex, TreeInput } from "../types";

/** The people in the test trees: fictional, with the surname «Παπαδόπουλος». */
export type TestPerson = { id: string; sex: Sex; name: string; born?: number };

export const person = (id: string, sex: Sex, born?: number): TestPerson => ({
  id,
  sex,
  name: `${id} Παπαδόπουλος`,
  ...(born === undefined ? {} : { born }),
});

const build = (input: TreeInput<TestPerson>): Tree<TestPerson> => createTree(input, { born: (p) => p.born });

/*
 *        grandpa ═ grandma                     inlawDad ═ inlawMom
 *          │                                       │
 *   ┌──────┴───────┐                         ┌─────┴──────┐
 *  dad ═ mom     aunt ═ uncle              wife        wifeSister ═ wifeSisterHusband
 *   │              │                         ║
 *  me, sis       cousin ═ cousinWife         ╚═ me
 *                  │
 *               cousinKid
 *
 * dad also has `half` with `otherMom`, and `onlyDad`, whose mother is not recorded.
 */
export const family: Tree<TestPerson> = build({
  people: [
    person("grandpa", "male"),
    person("grandma", "female"),
    person("dad", "male"),
    person("mom", "female"),
    person("otherMom", "female"),
    person("aunt", "female"),
    person("uncle", "male"),
    person("me", "male"),
    person("sis", "female"),
    person("half", "female"),
    person("onlyDad", "female"),
    person("cousin", "male"),
    person("cousinWife", "female"),
    person("cousinKid", "female"),
    person("wife", "female"),
    person("inlawDad", "male"),
    person("inlawMom", "female"),
    person("wifeSister", "female"),
    person("wifeSisterHusband", "male"),
    person("stranger", "unknown"),
  ],
  parents: [
    ["grandpa", "dad"],
    ["grandma", "dad"],
    ["grandpa", "aunt"],
    ["grandma", "aunt"],
    ["dad", "me"],
    ["mom", "me"],
    ["dad", "sis"],
    ["mom", "sis"],
    ["dad", "half"],
    ["otherMom", "half"],
    ["dad", "onlyDad"],
    ["aunt", "cousin"],
    ["uncle", "cousin"],
    ["cousin", "cousinKid"],
    ["inlawDad", "wife"],
    ["inlawMom", "wife"],
    ["inlawDad", "wifeSister"],
    ["inlawMom", "wifeSister"],
  ],
  unions: [
    { a: "grandpa", b: "grandma" },
    { a: "dad", b: "mom" },
    { a: "aunt", b: "uncle" },
    { a: "me", b: "wife" },
    { a: "cousin", b: "cousinWife" },
    { a: "wifeSister", b: "wifeSisterHusband" },
  ],
});

/*
 * Two brothers (b1, b2, sons of pa and ma) married two sisters (s1, s2, daughters of qa and qb):
 * their children c1 and c2 are cousins twice over. c3, a son of b2 from another marriage, married
 * his first cousin c1.
 */
export const twice: Tree<TestPerson> = build({
  people: [
    person("pa", "male"),
    person("ma", "female"),
    person("qa", "male"),
    person("qb", "female"),
    person("b1", "male"),
    person("b2", "male"),
    person("s1", "female"),
    person("s2", "female"),
    person("c1", "female"),
    person("c2", "female"),
    person("c3", "male"),
  ],
  parents: [
    ["pa", "b1"],
    ["ma", "b1"],
    ["pa", "b2"],
    ["ma", "b2"],
    ["qa", "s1"],
    ["qb", "s1"],
    ["qa", "s2"],
    ["qb", "s2"],
    ["b1", "c1"],
    ["s1", "c1"],
    ["b2", "c2"],
    ["s2", "c2"],
    ["b2", "c3"],
  ],
  unions: [
    { a: "pa", b: "ma" },
    { a: "qa", b: "qb" },
    { a: "b1", b: "s1" },
    { a: "b2", b: "s2" },
    // First cousins who married.
    { a: "c1", b: "c3" },
  ],
});

/*
 *   mom     dad     otherMom
 *     └──┬──┘ └──┬──┘
 *        x       y
 *
 * x and y, both of unknown sex, have two recorded parents each and share one, dad: half-siblings.
 */
export const halfSiblings: Tree<TestPerson> = build({
  people: [
    person("dad", "male"),
    person("mom", "female"),
    person("otherMom", "female"),
    person("x", "unknown"),
    person("y", "unknown"),
  ],
  parents: [
    ["dad", "x"],
    ["mom", "x"],
    ["dad", "y"],
    ["otherMom", "y"],
  ],
  unions: [],
});

/*
 * old has two lines. On one, gm's son u (my mother's brother) married a (your father's sister),
 * a daughter of gf on the other line. Their child k is a cousin to both of us. Going down to k and
 * up again is shorter than going up to old, but only a marriage links us there, not blood.
 * (Their marriage itself is not recorded, as in much of the imported data.)
 */
export const twoLines: Tree<TestPerson> = build({
  people: ["old", "l1", "r1", "l2", "r2", "gm", "gf", "mom", "u", "a", "dad", "k", "me", "you"].map((id) =>
    person(id, "unknown"),
  ),
  parents: [
    ["old", "l1"],
    ["old", "r1"],
    ["l1", "l2"],
    ["r1", "r2"],
    ["l2", "gm"],
    ["r2", "gf"],
    ["gm", "mom"],
    ["gm", "u"],
    ["gf", "a"],
    ["gf", "dad"],
    ["u", "k"],
    ["a", "k"],
    ["mom", "me"],
    ["dad", "you"],
  ],
  // Their marriage is not recorded: only their child links them.
  unions: [],
});

/*
 * My aunt married a man who, as often in a village, is also my distant cousin: old is an
 * ancestor of my grandfather (3 generations up) and of the husband (4 generations up). He is
 * first of all my uncle by marriage; the blood tie comes after it.
 */
export const village: Tree<TestPerson> = build({
  people: ["old", "l1", "l2", "r1", "r2", "r3", "grandpa", "dad", "aunt", "husband", "me"].map((id) =>
    person(id, id === "aunt" ? "female" : "male"),
  ),
  parents: [
    ["old", "l1"],
    ["l1", "l2"],
    ["l2", "grandpa"],
    ["old", "r1"],
    ["r1", "r2"],
    ["r2", "r3"],
    ["r3", "husband"],
    ["grandpa", "dad"],
    ["grandpa", "aunt"],
    ["dad", "me"],
  ],
  unions: [{ a: "aunt", b: "husband" }],
});

/*
 * My aunt's husband is also my ancestor, five generations up, as a mistake in the data (two
 * namesakes merged into one) can say. He is my uncle by marriage first.
 */
export const tangled: Tree<TestPerson> = build({
  people: ["old", "l1", "l2", "grandpa", "dad", "aunt", "me"].map((id) =>
    person(id, id === "aunt" ? "female" : "male"),
  ),
  parents: [
    ["old", "l1"],
    ["l1", "l2"],
    ["l2", "grandpa"],
    ["grandpa", "dad"],
    ["grandpa", "aunt"],
    ["dad", "me"],
  ],
  unions: [{ a: "aunt", b: "old" }],
});

const MOVES: Record<string, Move> = { U: "up", D: "down", S: "spouse" };

/** "UUD" → ["up", "up", "down"]: U up to a parent, D down to a child, S to a spouse. */
export const fromKey = (key: string): Move[] =>
  [...key].map((letter) => {
    const move = MOVES[letter];
    if (!move) throw new Error(`Unknown move "${letter}" in "${key}"`);
    return move;
  });

/** The sexes along a chain with the given key: all unknown, except the last person. */
export const sexesFor = (key: string, last: Sex): Sex[] => [...Array<Sex>(key.length).fill("unknown"), last];

/**
 * A line of people p0, p1… linked by `key` (U up to a parent, D down to a child, S to a spouse),
 * with their sexes in order, or only the last one's. The question is what `to` (the last) is to
 * `from` (p0).
 */
export function line(key: string, sexes: readonly Sex[] | Sex): { tree: Tree<TestPerson>; from: string; to: string } {
  const all = typeof sexes === "string" ? sexesFor(key, sexes) : sexes;
  const id = (i: number) => `p${i}`;
  const parents: [string, string][] = [];
  const unions: { a: string; b: string }[] = [];
  [...key].forEach((move, i) => {
    if (move === "U") parents.push([id(i + 1), id(i)]);
    if (move === "D") parents.push([id(i), id(i + 1)]);
    if (move === "S") unions.push({ a: id(i), b: id(i + 1) });
  });
  const tree = build({ people: all.map((sex, i) => person(id(i), sex)), parents, unions });
  return { tree, from: id(0), to: id(key.length) };
}
