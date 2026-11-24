import { expect, it } from "vitest";
import { describeRelation } from "./describe";
import { el } from "./locales/el";
import { en } from "./locales/en";
import { relate } from "./relate";
import { family, twice, twoLines, village } from "./testing/fixtures";
import { createTree } from "./tree";

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
