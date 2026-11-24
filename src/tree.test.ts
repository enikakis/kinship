import { describe, expect, it } from "vitest";
import { createTree } from "./tree";
import type { Sex } from "./types";

const p = (id: string, sex: Sex, extra = {}) => ({ id, sex, ...extra });

describe("createTree", () => {
  it("orders relatives by birth, then as given", () => {
    const tree = createTree(
      {
        people: [p("mom", "female"), p("c", "male"), p("a", "female", { year: 1950 }), p("b", "male", { year: 1940 })],
        parents: [["mom", "c"], ["mom", "a"], ["mom", "b"]],
        unions: [],
      },
      { born: (x) => (x as { year?: number }).year },
    );
    expect(tree.children("mom").map((x) => x.id)).toEqual(["b", "a", "c"]);
  });

  it("keeps the given order without birth years", () => {
    const tree = createTree({
      people: [p("mom", "female"), p("c", "male"), p("a", "female"), p("b", "male")],
      parents: [["mom", "c"], ["mom", "a"], ["mom", "b"]],
      unions: [],
    });
    expect(tree.children("mom").map((x) => x.id)).toEqual(["c", "a", "b"]);
  });

  it("names people by their name, or by id", () => {
    const people = [p("a", "male", { name: "Νίκος" }), p("b", "female")];
    const tree = createTree({ people, parents: [], unions: [] });
    expect(tree.name(people[0]!)).toBe("Νίκος");
    expect(tree.name(people[1]!)).toBe("b");
    const custom = createTree({ people, parents: [], unions: [] }, { name: (x) => `#${x.id}` });
    expect(custom.name(people[0]!)).toBe("#a");
  });

  it("gives back the caller's own objects", () => {
    const a = p("a", "male", { note: "kept" });
    const tree = createTree({ people: [a], parents: [], unions: [] });
    expect(tree.byId.get("a")).toBe(a);
    expect(tree.byId.get("a")).toHaveProperty("note", "kept");
  });

  it("skips links to people it does not know", () => {
    const tree = createTree({
      people: [p("a", "male"), p("b", "female")],
      parents: [["ghost", "a"], ["b", "ghost"]],
      unions: [{ a: "a", b: "ghost" }],
    });
    expect(tree.parents("a")).toEqual([]);
    expect(tree.children("b")).toEqual([]);
    expect(tree.spouses("a")).toEqual([]);
  });

  it("counts a repeated link once", () => {
    const tree = createTree({
      people: [p("dad", "male"), p("mom", "female"), p("kid", "male"), p("sis", "female"), p("a", "male"), p("b", "female")],
      parents: [["dad", "kid"], ["dad", "kid"], ["mom", "kid"], ["dad", "sis"], ["mom", "sis"], ["mom", "sis"]],
      unions: [{ a: "a", b: "b" }, { a: "b", b: "a" }],
    });
    expect(tree.parents("kid").map((x) => x.id)).toEqual(["dad", "mom"]);
    expect(tree.spouses("a").map((x) => x.id)).toEqual(["b"]);
    expect(tree.spouses("b").map((x) => x.id)).toEqual(["a"]);
    expect(tree.areHalfSiblings("kid", "sis")).toBe(false);
  });
});
