import { describe, expect, it } from "vitest";
import { describeRelation } from "../describe";
import { relate } from "../relate";
import { family, line, tangled, twice, village, type TestPerson } from "../testing/fixtures";
import type { Tree } from "../tree";
import type { Sex } from "../types";
import { en } from "./en";

/* Relations in English words. The test trees are drawn in ../testing/fixtures.ts. */

/** How `to` is related to `from` in `tree`, in English. */
const text = (from: string, to: string, tree: Tree<TestPerson> = family) =>
  describeRelation(tree, relate(tree, from, to)!, en);

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

describe("the chain between two people", () => {
  it("names each step in English too", () => {
    expect(text("me", "wifeSister").main.chain.map((step) => step.text)).toEqual([
      "me Παπαδόπουλος",
      "wife: wife Παπαδόπουλος",
      expect.stringMatching(/^(father: inlawDad|mother: inlawMom) Παπαδόπουλος$/),
      "daughter: wifeSister Παπαδόπουλος",
    ]);
  });
});

describe("names of relationships", () => {
  it("tells half-siblings apart, when both have two parents and share one", () => {
    expect(roles("half", "me")).toEqual({ other: "half-brother", self: "half-sister" });
  });

  it("does not call siblings half-siblings when one's other parent is unknown", () => {
    expect(roles("onlyDad", "half")).toEqual({ other: "sister", self: "sister" });
  });

  it("names the usual relations by marriage", () => {
    expect(roles("wife", "dad")).toEqual({ other: "father-in-law", self: "daughter-in-law" });
  });

  it("names other relatives by marriage through the blood relative, as the law counts them", () => {
    // me → cousin's wife: up, up, down, down, spouse.
    expect(roles("me", "cousinWife")).toEqual({
      other: "wife of a first cousin",
      self: "husband's first cousin",
    });
    // The husband of a father's first cousin; the other way, the son of a wife's first cousin.
    const sexes: Sex[] = ["male", "male", "female", "female", "female", "female", "male"];
    expect(along("UUUDDS", sexes).roles).toEqual({
      other: "husband of a first cousin once removed",
      self: "wife's first cousin once removed",
    });
  });

  it("has no name through a marriage in the middle, and says which marriages join them", () => {
    // A sister's husband's brother.
    const sexes: Sex[] = ["male", "unknown", "female", "male", "unknown", "male"];
    expect(along("UDSUD", sexes).summary).toBe("Related through the marriage of p2 Παπαδόπουλος and p3 Παπαδόπουλος.");
  });

  it("names far ancestors and descendants", () => {
    expect(along("UUUU", "male").summary).toBe("great-great-grandfather");
    expect(along("UUUUU", "female").summary).toBe("3rd great-grandmother");
    expect(along("DDDDDD", "female").summary).toBe("4th great-granddaughter");
  });

  it("speaks the standard English terms", () => {
    expect(along("UUUDD", "male").summary).toBe("first cousin once removed");
    expect(along("UUUUDD", "female").summary).toBe("first cousin twice removed");
    expect(along("UUUDDD", "female").summary).toBe("second cousin");
    expect(along("UUUD", "male").summary).toBe("great-uncle");
    expect(along("UUUUD", "female").summary).toBe("great-great-aunt");
    expect(along("UDDD", "female").summary).toBe("great-niece");
    expect(along("DSU", "male").summary).toBe("child's father-in-law");
  });

  it("names step-parents and step-children, and uncles by marriage on either side", () => {
    expect(along("SD", "male").summary).toBe("stepson");
  });
});

describe("the degree of a relationship", () => {
  const degree = (key: string) => along(key, "unknown").degree;

  it("is said in English too", () => {
    expect(degree("D")).toBe("Related by blood in the direct line, 1st degree");
    expect(degree("UU")).toBe("Related by blood in the direct line, 2nd degree");
    expect(degree("UUD")).toBe("Related by blood in the collateral line, 3rd degree");
    expect(degree("UUDDS")).toBe("Related by marriage (affinity) in the collateral line, 4th degree");
  });
});

describe("related in more than one way", () => {
  it("finds that a couple were related before they married", () => {
    expect(ties("c1", "c3", twice)).toEqual({
      main: "husband",
      couple: true,
      others: [
        {
          name: "first cousin",
          ancestors: expect.stringMatching(/^Common ancestors: (ma Παπαδόπουλος and pa|pa Παπαδόπουλος and ma) Παπαδόπουλος$/),
        },
      ],
    });
  });

  it("puts a relation by marriage with a name before a distant blood tie", () => {
    expect(text("me", "husband", village).others[0].commonAncestors).toBe("Common ancestor: old Παπαδόπουλος");
  });

  it("names no common ancestor when one of the two descends from the other", () => {
    const { main, others } = text("me", "old", tangled);
    expect(main.summary).toBe("uncle by marriage");
    expect(others.map((tie) => [tie.summary, tie.commonAncestors])).toEqual([["3rd great-grandfather", null]]);
  });
});
