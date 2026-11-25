import { expect, it } from "vitest";
import { describeRelation } from "./describe";
import { el } from "./locales/el";
import { relate } from "./relate";
import { relateAll } from "./relate-all";
import { family } from "./testing/fixtures";

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
