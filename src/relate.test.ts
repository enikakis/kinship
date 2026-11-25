import { expect, it } from "vitest";
import { describeRelation } from "./describe";
import { el } from "./locales/el";
import { en } from "./locales/en";
import { relate, type Relationship } from "./relate";
import { family, line, person, twice, twoLines, village } from "./testing/fixtures";
import { createTree } from "./tree";
import type { Person } from "./types";

it("relates two people with plain objects, in a few lines", () => {
  const tree = createTree({
    people: [
      { id: "gp", sex: "male" },
      { id: "dad", sex: "male" },
      { id: "maria", sex: "female", name: "Μαρία" },
      { id: "nikos", sex: "male", name: "Νίκος" },
    ],
    parents: [
      ["gp", "dad"],
      ["gp", "maria"],
      ["dad", "nikos"],
    ],
    unions: [],
  });
  const rel = relate(tree, "nikos", "maria")!;
  expect(rel.main).toMatchObject({
    kind: "uncle",
    blood: { up: 2, down: 1 },
    legalDegree: { degree: 3, line: "collateral", kind: "blood" },
  });
  // The caller's own object, not a copy.
  expect(rel.main.to).toBe(tree.byId.get("maria"));
  expect(describeRelation(tree, rel, el).main.roles).toEqual({ other: "θεία", self: "ανιψιός" });
  expect(describeRelation(tree, rel, en).main.roles).toEqual({ other: "aunt", self: "nephew" });
});

it("is null for people who are not connected, or for the same person", () => {
  expect(relate(family, "me", "stranger")).toBeNull();
  expect(relate(family, "me", "me")).toBeNull();
  expect(relate(family, "me", "ghost")).toBeNull();
});

it("gives the other blood ties with their common ancestors as people", () => {
  const { main, others, couple } = relate(twice, "c1", "c3")!;
  expect(couple).toBe(true);
  expect(main.kind).toBe("spouse");
  expect(others[0].kind).toBe("cousin");
  expect(others[0].commonAncestors.map((ancestor) => ancestor.id).sort()).toEqual(["ma", "pa"]);
});

it("puts an old common ancestor before a closer chain through the children of a marriage", () => {
  const { main, others } = relate(twoLines, "me", "you")!;
  expect([main.from.id, ...main.path.map((step) => step.person.id)]).toEqual([
    "me",
    "mom",
    "gm",
    "l2",
    "l1",
    "old",
    "r1",
    "r2",
    "gf",
    "dad",
    "you",
  ]);
  expect(main.cousin).toEqual({ degree: 4, removed: 0 });
  expect(others).toEqual([]);
});

it("puts a relation by marriage with a name before a distant blood tie", () => {
  const { main, others, couple } = relate(village, "me", "husband")!;
  expect(main.kind).toBe("uncleByMarriage");
  expect(couple).toBe(false);
  expect(others).toHaveLength(1);
  expect(others[0].cousin).toEqual({ degree: 3, removed: 1 });
  expect(others[0].commonAncestors.map((ancestor) => ancestor.id)).toEqual(["old"]);
  // The other way round too: I am his nephew by marriage first.
  const back = relate(village, "husband", "me")!;
  expect(back.main.kind).toBe("nephewByMarriage");
  expect(back.others).toHaveLength(1);
});

// gm → kate, aunt; kate → anna; hal → hank → bob; kate ═ hal (her later marriage); bob ═ aunt.
// anna and bob are joined by two equally short chains with one marriage each.
const tiedChains = {
  people: [
    person("gm", "female"),
    person("kate", "female"),
    person("aunt", "female"),
    person("anna", "female"),
    person("hal", "male"),
    person("hank", "male"),
    person("bob", "male"),
  ],
  parents: [
    ["gm", "kate"],
    ["gm", "aunt"],
    ["kate", "anna"],
    ["hal", "hank"],
    ["hank", "bob"],
  ] as [string, string][],
  unions: [
    { a: "kate", b: "hal" },
    { a: "bob", b: "aunt" },
  ],
};
const chainPeople = (r: Relationship<Person>) => [r.from, ...r.path.map((step) => step.person)].map((p) => p.id);

it("gives the same relationship from either end", () => {
  const tree = createTree(tiedChains);
  const degree = { degree: 3, line: "collateral", kind: "affinity" };
  expect(relate(tree, "anna", "bob")!.main).toMatchObject({ kind: "uncleByMarriage", legalDegree: degree });
  expect(relate(tree, "bob", "anna")!.main).toMatchObject({ kind: "nephewByMarriage", legalDegree: degree });
  const there = relate(tree, "anna", "bob")!.main;
  const back = relate(tree, "bob", "anna")!.main;
  expect(chainPeople(back)).toEqual(chainPeople(there).reverse());
  expect(back.diagram.nodes.map((node) => node.person.id)).toEqual(chainPeople(back));
});

it("gives the same relationship from either end on a tree not made by createTree, by id order", () => {
  // With the people reversed, createTree would search from bob; a copy knows no order, so it
  // searches from anna, whose id comes first, as the tree with anna first in `people` does.
  const reversed = createTree({ ...tiedChains, people: [...tiedChains.people].reverse() });
  const copy = { ...reversed };
  const there = relate(copy, "anna", "bob")!.main;
  const back = relate(copy, "bob", "anna")!.main;
  expect(chainPeople(back)).toEqual(chainPeople(there).reverse());
  expect(chainPeople(there)).toEqual(chainPeople(relate(createTree(tiedChains), "anna", "bob")!.main));
  expect(chainPeople(there)).not.toEqual(chainPeople(relate(reversed, "anna", "bob")!.main));
});

it("finds the child of two first cousins descending from the common grandparents", () => {
  // gp ═ gm → a, b;  a → x, b → y;  x ═ y → kid
  const tree = createTree({
    people: ["gp", "gm", "a", "b", "x", "y", "kid"].map((id) => ({ id, sex: "unknown" as const })),
    parents: [
      ["gp", "a"],
      ["gm", "a"],
      ["gp", "b"],
      ["gm", "b"],
      ["a", "x"],
      ["b", "y"],
      ["x", "kid"],
      ["y", "kid"],
    ],
    unions: [
      { a: "gp", b: "gm" },
      { a: "x", b: "y" },
    ],
  });
  const rel = relate(tree, "kid", "gp")!;
  expect(rel.main).toMatchObject({ kind: "ancestor", blood: { up: 3, down: 0 } });
  expect(rel.others).toEqual([]);

  const cousins = relate(tree, "x", "y")!;
  expect(cousins.couple).toBe(true);
  expect(cousins.others).toHaveLength(1);
  expect(cousins.others[0]).toMatchObject({ kind: "cousin", cousin: { degree: 1, removed: 0 } });
  expect(cousins.others[0].commonAncestors.map((ancestor) => ancestor.id).sort()).toEqual(["gm", "gp"]);
});

it("does not hang on a parent cycle in bad data", () => {
  const tree = createTree({
    people: ["a", "b", "c"].map((id) => ({ id, sex: "unknown" as const })),
    parents: [
      ["a", "b"],
      ["b", "a"],
      ["b", "c"],
    ],
    unions: [],
  });
  // c's parent b is a's child and a's parent, so the bad data gives two equally short chains,
  // c↑b↑a and c↑b↓a. The search still stops; it starts from a, which comes first in `people`.
  expect(relate(tree, "c", "a")!.main).toMatchObject({ kind: "sibling", blood: { up: 1, down: 1 } });
});

it("gives both forms when nobody's sex is known", () => {
  const { tree, from, to } = line("UUD", "unknown");
  const rel = relate(tree, from, to)!;
  expect(describeRelation(tree, rel, el).main.summary).toBe("θείος/θεία");
  expect(describeRelation(tree, rel, en).main.summary).toBe("uncle/aunt");
});
