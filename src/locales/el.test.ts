import { describe, expect, it } from "vitest";
import { describeRelation } from "../describe";
import { relate } from "../relate";
import { family, line, tangled, twice, twoLines, village, type TestPerson } from "../testing/fixtures";
import type { Tree } from "../tree";
import type { Sex } from "../types";
import { el } from "./el";

/* Relations in Greek words. The test trees are drawn in ../testing/fixtures.ts. */

/** How `to` is related to `from` in `tree`, in Greek. */
const text = (from: string, to: string, tree: Tree<TestPerson> = family) =>
  describeRelation(tree, relate(tree, from, to)!, el);

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
  it("is the shortest one, through parents, children and marriages", () => {
    const { chain } = text("me", "cousin").main;
    // Through either grandparent: both are common ancestors.
    expect(chain.map((step) => step.text)).toEqual([
      "me Παπαδόπουλος",
      "πατέρας: dad Παπαδόπουλος",
      expect.stringMatching(/^(πατέρας: grandpa|μητέρα: grandma) Παπαδόπουλος$/),
      "κόρη: aunt Παπαδόπουλος",
      "γιος: cousin Παπαδόπουλος",
    ]);
  });

  it("goes through blood relations rather than marriages", () => {
    expect(text("me", "sis").main.chain.map((step) => step.text)).toEqual([
      "me Παπαδόπουλος",
      expect.stringMatching(/^(πατέρας: dad|μητέρα: mom) Παπαδόπουλος$/),
      "κόρη: sis Παπαδόπουλος",
    ]);
  });
});

describe("names of relationships", () => {
  it("names blood relations for both people", () => {
    expect(roles("me", "dad")).toEqual({ other: "πατέρας", self: "γιος" });
    expect(roles("me", "grandma")).toEqual({ other: "γιαγιά", self: "εγγονός" });
    expect(roles("me", "sis")).toEqual({ other: "αδελφή", self: "αδελφός" });
    expect(roles("me", "aunt")).toEqual({ other: "θεία", self: "ανιψιός" });
    expect(roles("me", "cousin")).toEqual({ other: "πρώτος εξάδελφος", self: "πρώτος εξάδελφος" });
    expect(roles("me", "cousinKid")).toEqual({
      other: "κόρη του πρώτου εξαδέλφου",
      self: "πρώτος εξάδελφος του πατέρα",
    });
  });

  it("tells half-siblings apart, when both have two parents and share one", () => {
    expect(roles("me", "half")).toEqual({ other: "ετεροθαλής αδελφή", self: "ετεροθαλής αδελφός" });
  });

  it("does not call siblings half-siblings when one's other parent is unknown", () => {
    expect(roles("me", "onlyDad")).toEqual({ other: "αδελφή", self: "αδελφός" });
    expect(roles("onlyDad", "me")).toEqual({ other: "αδελφός", self: "αδελφή" });
  });

  it("names the usual relations by marriage", () => {
    expect(roles("me", "wife")).toEqual({ other: "σύζυγος", self: "σύζυγος" });
    expect(roles("wife", "dad")).toEqual({ other: "πεθερός", self: "νύφη" });
    expect(roles("me", "wifeSister")).toEqual({ other: "κουνιάδα", self: "κουνιάδος" });
    expect(roles("me", "wifeSisterHusband")).toEqual({ other: "μπατζανάκης", self: "μπατζανάκης" });
    expect(roles("dad", "inlawMom")).toEqual({ other: "συμπεθέρα", self: "συμπέθερος" });
    expect(roles("me", "uncle")).toEqual({ other: "θείος (από γάμο)", self: "ανιψιός (από γάμο)" });
  });

  it("names other relatives by marriage through the blood relative, as the law counts them", () => {
    // me → cousin's wife: up, up, down, down, spouse.
    expect(roles("me", "cousinWife")).toEqual({
      other: "σύζυγος του πρώτου εξαδέλφου",
      self: "πρώτος εξάδελφος του συζύγου",
    });
    // The husband of a father's first cousin; the other way, the son of a wife's first cousin.
    const sexes: Sex[] = ["male", "male", "female", "female", "female", "female", "male"];
    expect(along("UUUDDS", sexes).roles).toEqual({
      other: "σύζυγος της πρώτης εξαδέλφης του πατέρα",
      self: "γιος του πρώτου εξαδέλφου της συζύγου",
    });
    expect(along("UUS", ["female", "male", "male", "female"]).summary).toBe("σύζυγος του παππού");
    expect(along("SDD", ["male", "female", "male", "unknown"]).summary).toBe("εγγόνι της συζύγου");
  });

  it("has no name through a marriage in the middle, and says which marriages join them", () => {
    // Two women married to brothers have a name; a man and a woman do not.
    expect(along("SUDS", ["female", "male", "unknown", "male", "female"]).roles?.other).toBe("συννυφάδα");
    const apart = along("SUDS", ["male", "female", "unknown", "male", "female"]);
    expect(apart.roles).toBeNull();
    expect(apart.summary).toBe(
      "Συγγενεύουν μέσα από τους γάμους: p0 Παπαδόπουλος και p1 Παπαδόπουλος· p3 Παπαδόπουλος και p4 Παπαδόπουλος.",
    );
    // A sister's husband's brother.
    const sexes: Sex[] = ["male", "unknown", "female", "male", "unknown", "male"];
    expect(along("UDSUD", sexes).summary).toBe("Συγγενεύουν μέσα από τον γάμο: p2 Παπαδόπουλος και p3 Παπαδόπουλος.");
  });

  it("names far ancestors and descendants", () => {
    expect(along("UUUU", "female").summary).toBe("προ-προγιαγιά");
    expect(along("UUUUU", "male").summary).toBe("προ-προ-προπάππους");
    expect(along("UUUUUU", "male").summary).toBe("πρόγονος 6ης γενιάς");
    expect(along("DDDD", "female").summary).toBe("τρισέγγονη");
    expect(along("DDDDD", "male").summary).toBe("απόγονος 5ης γενιάς");
  });

  it("names cousins by degree, and relatives of other generations through one of their own", () => {
    expect(along("UUUDDD", "female").summary).toBe("δεύτερη εξαδέλφη");
    // A parent's first cousin; a first cousin's child.
    expect(along("UUUDD", ["male", "female", "male", "male", "male", "male"]).summary).toBe(
      "πρώτος εξάδελφος της μητέρας",
    );
    expect(along("UUDDD", ["male", "male", "male", "female", "female", "female"]).summary).toBe(
      "κόρη της πρώτης εξαδέλφης",
    );
    // A grandparent's sister; a grandfather's second cousin.
    expect(along("UUUD", ["male", "female", "female", "male", "female"]).summary).toBe("αδελφή της γιαγιάς");
    expect(along("UUUUUDDD", ["male", "male", "male", "male", "male", "male", "male", "male", "male"]).summary).toBe(
      "δεύτερος εξάδελφος του παππού",
    );
    // A brother's grandson; a sister's great-granddaughter.
    expect(along("UDDD", ["male", "male", "male", "female", "male"]).summary).toBe("εγγονός του αδελφού");
    expect(along("UDDDD", ["male", "male", "female", "male", "male", "female"]).summary).toBe("δισέγγονη της αδελφής");
    // Without the sexes along the way, both words.
    expect(along("UUUD", "male").summary).toBe("αδελφός του παππού/της γιαγιάς");
    expect(along("UUUDD", "male").summary).toBe("πρώτος εξάδελφος του γονιού");
  });

  it("names both people of a chain, each from their side", () => {
    // A great-uncle and his grand-nephew.
    expect(along("UUUD", ["male", "male", "female", "male", "male"]).roles).toEqual({
      other: "αδελφός της γιαγιάς",
      self: "εγγονός της αδελφής",
    });
  });

  it("names step-parents and step-children, and uncles by marriage on either side", () => {
    expect(along("US", "female").summary).toBe("μητριά");
    expect(along("US", "male").summary).toBe("πατριός");
    expect(along("SD", "female").summary).toBe("προγονή");
    // A wife's uncle; a niece's husband.
    expect(along("SUUD", "male").summary).toBe("θείος (από γάμο)");
    expect(along("UDDS", "male").summary).toBe("ανιψιός (από γάμο)");
  });
});

describe("the degree of a relationship", () => {
  const degree = (key: string) => along(key, "unknown").degree;

  it("is counted as the law does, by blood or by marriage", () => {
    // A grandfather: direct line, 2nd degree; a first cousin: collateral, 4th; an uncle: 3rd.
    expect(degree("UU")).toBe("Συγγένεια εξ αίματος σε ευθεία γραμμή, 2ου βαθμού");
    expect(degree("UUDD")).toBe("Συγγένεια εξ αίματος εκ πλαγίου, 4ου βαθμού");
    expect(degree("UUD")).toBe("Συγγένεια εξ αίματος εκ πλαγίου, 3ου βαθμού");
    // A father-in-law: by marriage, direct, 1st; a brother-in-law either way: collateral, 2nd.
    expect(degree("SU")).toBe("Συγγένεια εξ αγχιστείας σε ευθεία γραμμή, 1ου βαθμού");
    expect(degree("SUD")).toBe("Συγγένεια εξ αγχιστείας εκ πλαγίου, 2ου βαθμού");
    expect(degree("UDS")).toBe("Συγγένεια εξ αγχιστείας εκ πλαγίου, 2ου βαθμού");
    expect(degree("UUDDS")).toBe("Συγγένεια εξ αγχιστείας εκ πλαγίου, 4ου βαθμού");
    // A couple, co-parents-in-law, men married to sisters: the law counts no degree.
    for (const key of ["S", "DSU", "SUDS"]) expect(degree(key), key).toBeNull();
  });
});

describe("related in more than one way", () => {
  it("finds the second way two double cousins are related, through the other grandparents", () => {
    // c2 is also c1's sister-in-law (her husband's sister), a shorter chain with a name; but a
    // first cousin is a closer tie, so blood comes first.
    const { main, others } = text("c1", "c2", twice);
    expect(main.roles).toEqual({ other: "πρώτη εξαδέλφη", self: "πρώτη εξαδέλφη" });
    const throughPaternal = /: (pa|ma) Παπαδόπουλος$/.test(main.chain[2].text);
    expect(others.map((tie) => [tie.summary, tie.commonAncestors])).toEqual([
      [
        "πρώτη εξαδέλφη",
        throughPaternal
          ? "Κοινοί πρόγονοι: qa Παπαδόπουλος και qb Παπαδόπουλος"
          : "Κοινοί πρόγονοι: ma Παπαδόπουλος και pa Παπαδόπουλος",
      ],
    ]);
  });

  it("finds that a couple were related before they married", () => {
    expect(ties("c1", "c3", twice)).toEqual({
      main: "σύζυγος",
      couple: true,
      others: [
        {
          name: "πρώτος εξάδελφος",
          ancestors: expect.stringMatching(
            /^Κοινοί πρόγονοι: (ma Παπαδόπουλος και pa|pa Παπαδόπουλος και ma) Παπαδόπουλος$/,
          ),
        },
      ],
    });
  });

  it("puts an old common ancestor before a closer chain through the children of a marriage", () => {
    expect(text("me", "you", twoLines).main.summary).toBe("τέταρτος εξάδελφος/εξαδέλφη");
  });

  it("puts a relation by marriage with a name before a distant blood tie", () => {
    const { main, others, couple } = text("me", "husband", village);
    expect(main.roles).toEqual({ other: "θείος (από γάμο)", self: "ανιψιός (από γάμο)" });
    expect(couple).toBe(false);
    expect(others.map((tie) => [tie.summary, tie.commonAncestors])).toEqual([
      ["τρίτος εξάδελφος του πατέρα", "Κοινός πρόγονος: old Παπαδόπουλος"],
    ]);
    // The other way round too: I am his nephew by marriage first.
    expect(text("husband", "me", village).main.summary).toBe("ανιψιός (από γάμο)");
  });

  it("names no common ancestor when one of the two descends from the other", () => {
    const { main, others } = text("me", "old", tangled);
    expect(main.summary).toBe("θείος (από γάμο)");
    expect(others.map((tie) => [tie.summary, tie.commonAncestors])).toEqual([["προ-προ-προπάππους", null]]);
  });
});
