import { expect, it } from "vitest";
import { describeRelation } from "./describe";
import { el } from "./locales/el";
import { chainTo, searchFrom } from "./path";
import { relate } from "./relate";
import { relateAll } from "./relate-all";
import { createTree } from "./tree";
import { family, person, type TestPerson } from "./testing/fixtures";
import { largeTree } from "./testing/large-tree";

const everyone = relateAll(family, "me");

it("lists every connected person in people order, without me and without strangers", () => {
  expect(everyone.has("me")).toBe(false);
  expect(everyone.has("stranger")).toBe(false);
  const expected = [...family.byId.keys()].filter((id) => id !== "me" && relate(family, "me", id) !== null);
  expect([...everyone.keys()]).toEqual(expected);
  expect(expected.length).toBeGreaterThan(5);
});

it("gives the same main and couple as relate", () => {
  expect(everyone.get("aunt")).toEqual({ main: relate(family, "me", "aunt")!.main, couple: false });
  expect(everyone.get("wife")!.couple).toBe(true);
});

it("is empty for an unknown person", () => {
  expect(relateAll(family, "ghost").size).toBe(0);
});

it("an entry with others: [] added goes straight into describeRelation", () => {
  const relation = { ...everyone.get("aunt")!, others: [] };
  expect(describeRelation(family, relation, el).main.roles).toEqual({ other: "θεία", self: "ανιψιός" });
});

/*
 * Double first cousins: a sister and a brother from one family married a brother and a sister
 * from another, so `me` and `cousin` are related through both grandparents, by two chains as
 * short as each other.
 *
 *             grandA                    grandB
 *        ┌──────┴──────┐           ┌──────┴──────┐
 *      auntA         momA        uncleB         dadB
 *   auntA ═ uncleB → cousin          dadB ═ momA → me → myKid
 *
 * `cousin` comes before `me` in `people`, so relate(me, cousin) searches from `cousin` (whose
 * first parent is auntA) and goes through grandA; a search from `me` (first parent dadB) would go
 * through grandB.
 */
const doubleCousins = createTree(
  {
    people: ["grandA", "grandB", "auntA", "uncleB", "dadB", "momA", "cousin", "me", "myKid"].map((id) =>
      person(id, id.startsWith("aunt") || id.startsWith("mom") ? "female" : "male"),
    ),
    parents: [
      ["grandA", "auntA"],
      ["grandA", "momA"],
      ["grandB", "uncleB"],
      ["grandB", "dadB"],
      ["auntA", "cousin"],
      ["uncleB", "cousin"],
      ["dadB", "me"],
      ["momA", "me"],
      ["me", "myKid"],
    ],
    unions: [
      { a: "auntA", b: "uncleB" },
      { a: "dadB", b: "momA" },
    ],
  },
);

it("follows relate's direction rule for a tie with someone earlier in people", () => {
  const ids = (path: { person: { id: string } }[]) => path.map((step) => step.person.id);
  const fromMe = chainTo(searchFrom(doubleCousins, "me")!, "cousin")!;
  expect(ids(fromMe.steps)).toEqual(["dadB", "grandB", "uncleB", "cousin"]);

  const all = relateAll(doubleCousins, "me");
  const cousin = all.get("cousin")!;
  expect(ids(cousin.main.path)).toEqual(["momA", "grandA", "auntA", "cousin"]);
  expect(cousin).toEqual({ main: relate(doubleCousins, "me", "cousin")!.main, couple: false });
  for (const id of doubleCousins.byId.keys()) {
    if (id === "me") continue;
    const { main, couple } = relate(doubleCousins, "me", id)!;
    expect(all.get(id), id).toEqual({ main, couple });
  }
});

it("gives what relate gives for everyone, from the middle of a 1,000-person generated tree", () => {
  const input = largeTree(1000);
  const tree = createTree(input, { born: (p: TestPerson) => p.born });
  const from = input.people[500]!.id;
  const all = relateAll(tree, from);
  const connected = input.people.map((p) => p.id).filter((id) => id !== from && relate(tree, from, id) !== null);
  expect([...all.keys()]).toEqual(connected);
  expect(connected.length).toBeGreaterThan(900);
  for (const [id, entry] of all) {
    const { main, couple } = relate(tree, from, id)!;
    expect(entry, id).toEqual({ main, couple });
  }
}, 60_000);
