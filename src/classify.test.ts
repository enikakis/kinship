import { describe, expect, it } from "vitest";
import { classify, kindOf, nameQuery } from "./classify";
import { findChain } from "./path";
import { createTree } from "./tree";
import { family, fromKey, line, person, sexesFor } from "./testing/fixtures";
import type { Sex } from "./types";

const cousinOf = (key: string) => {
  const l = line(key, "male");
  return classify(l.tree, findChain(l.tree, l.from, l.to)!).cousin;
};

describe("classify", () => {
  it.each([
    ["U", "ancestor"], ["UUUU", "ancestor"], ["D", "descendant"], ["UD", "sibling"], ["UUD", "uncle"],
    ["UUUD", "uncle"], ["UDD", "nephew"], ["UUDD", "cousin"], ["UUUDD", "cousin"],
    ["S", "spouse"], ["SU", "parentInLaw"], ["DS", "childInLaw"], ["SUD", "siblingInLaw"], ["UDS", "siblingInLaw"],
    ["DSU", "coParentInLaw"], ["US", "stepParent"], ["SD", "stepChild"], ["UUDS", "uncleByMarriage"],
    ["SUUD", "uncleByMarriage"], ["SUDD", "nephewByMarriage"], ["UDDS", "nephewByMarriage"],
    ["UUDDS", "spouseOfRelative"], ["UUS", "spouseOfRelative"], ["SDD", "relativeOfSpouse"], ["UDSUD", "unnamed"],
  ])("calls %s a %s", (key, kind) => expect(kindOf(fromKey(key), sexesFor(key, "male"), false)).toBe(kind));

  it("gives a name query the generations of the blood part, if any", () => {
    const blood = (key: string) => nameQuery(fromKey(key), sexesFor(key, "male"), false).blood;
    expect(blood("UUD")).toEqual({ up: 2, down: 1 });
    // The spouse of a first cousin; a spouse's grandchild.
    expect(blood("UUDDS")).toEqual({ up: 2, down: 2 });
    expect(blood("SDD")).toEqual({ up: 0, down: 2 });
    // Relations by marriage with a word of their own, and chains with no name.
    expect(blood("SU")).toBeNull();
    expect(blood("UDSUD")).toBeNull();
    expect(nameQuery(fromKey("UD"), sexesFor("UD", "male"), true).kind).toBe("halfSibling");
  });

  it("calls SUDS co-siblings-in-law only between two people of the same sex", () => {
    const same: Sex[] = ["female", "male", "unknown", "male", "female"];
    const different: Sex[] = ["male", "male", "unknown", "male", "female"];
    expect(kindOf(fromKey("SUDS"), same, false)).toBe("coSiblingInLaw");
    expect(kindOf(fromKey("SUDS"), different, false)).toBe("unnamed");
  });

  it("tells half-siblings apart", () => {
    expect(kindOf(["up", "down"], ["unknown", "unknown", "unknown"], true)).toBe("halfSibling");
    expect(classify(family, findChain(family, "me", "half")!).kind).toBe("halfSibling");
    expect(classify(family, findChain(family, "me", "sis")!).kind).toBe("sibling");
  });

  it("counts cousins by degree and removal", () => {
    expect(cousinOf("UUDD")).toEqual({ degree: 1, removed: 0 });
    expect(cousinOf("UUUDD")).toEqual({ degree: 1, removed: 1 });
    expect(cousinOf("UUUDDD")).toEqual({ degree: 2, removed: 0 });
    expect(cousinOf("UUUUDD")).toEqual({ degree: 1, removed: 2 });
    expect(cousinOf("UUD")).toBeNull();
  });

  it("says which side of the family a relative is on", () => {
    const sideOf = (key: string, sexes: Sex[] | Sex) => {
      const l = line(key, sexes);
      return classify(l.tree, findChain(l.tree, l.from, l.to)!).side;
    };
    expect(sideOf("UU", ["male", "male", "female"])).toBe("paternal");
    expect(sideOf("UU", ["male", "female", "female"])).toBe("maternal");
    expect(sideOf("SU", "male")).toBeNull();
    expect(sideOf("D", "male")).toBeNull();
  });

  describe("elder branch", () => {
    const build = (withYears: boolean) => {
      const y = (year: number) => (withYears ? year : undefined);
      return createTree(
        {
          people: [
            person("grandpa", "male"),
            person("dad", "male", y(1950)),
            person("aunt", "female", y(1945)),
            person("me", "male", y(1980)),
            person("sis", "female", y(1982)),
            person("cousin", "male", y(1975)),
          ],
          parents: [
            ["grandpa", "dad"],
            ["grandpa", "aunt"],
            ["dad", "me"],
            ["dad", "sis"],
            ["aunt", "cousin"],
          ],
          unions: [],
        },
        { born: (p) => p.born },
      );
    };
    const elder = (tree: ReturnType<typeof build>, a: string, b: string) =>
      classify(tree, findChain(tree, a, b)!).elderBranch;

    it("says whose branch is the elder, when birth years allow", () => {
      const tree = build(true);
      expect(elder(tree, "me", "cousin")).toBe("to");
      expect(elder(tree, "cousin", "me")).toBe("from");
      expect(elder(tree, "me", "sis")).toBe("from");
    });

    it("is unknown without birth years, and for other chains", () => {
      expect(elder(build(false), "me", "cousin")).toBeNull();
      expect(elder(build(true), "me", "dad")).toBeNull();
    });
  });
});
