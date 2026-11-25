import { describe, expect, it } from "vitest";
import { all, describing, males } from "../testing/describing";
import { halfSiblings, tangled, twice, twoLines, village } from "../testing/fixtures";
import type { Sex } from "../types";
import { fr } from "./fr";

/*
 * Relations in French words, as in the term table docs/locales/fr.md. The test trees are drawn in
 * ../testing/fixtures.ts. French puts a no-break space (U+00A0) before «:» and «;».
 */

const { text, roles, along, ties } = describing(fr);

describe("the direct line", () => {
  it("names ancestors by their words up to the great-great-grandparents, then by the degree", () => {
    expect(["U", "UU", "UUU", "UUUU", "UUUUU", "UUUUUU"].map((key) => along(key, "male").summary)).toEqual([
      "père",
      "grand-père",
      "arrière-grand-père",
      "arrière-arrière-grand-père",
      "ascendant au 5e degré",
      "ascendant au 6e degré",
    ]);
    expect(["U", "UU", "UUU", "UUUU", "UUUUU", "UUUUUU"].map((key) => along(key, "female").summary)).toEqual([
      "mère",
      "grand-mère",
      "arrière-grand-mère",
      "arrière-arrière-grand-mère",
      "ascendante au 5e degré",
      "ascendante au 6e degré",
    ]);
    expect(["U", "UU", "UUUUU"].map((key) => along(key, "unknown").summary)).toEqual([
      "parent",
      "grand-père/grand-mère",
      "ascendant/ascendante au 5e degré",
    ]);
  });

  it("names descendants by their words up to the great-great-grandchildren, then by the degree", () => {
    expect(["D", "DD", "DDD", "DDDD", "DDDDD", "DDDDDD"].map((key) => along(key, "male").summary)).toEqual([
      "fils",
      "petit-fils",
      "arrière-petit-fils",
      "arrière-arrière-petit-fils",
      "descendant au 5e degré",
      "descendant au 6e degré",
    ]);
    expect(["D", "DD", "DDD", "DDDD", "DDDDD", "DDDDDD"].map((key) => along(key, "female").summary)).toEqual([
      "fille",
      "petite-fille",
      "arrière-petite-fille",
      "arrière-arrière-petite-fille",
      "descendante au 5e degré",
      "descendante au 6e degré",
    ]);
    expect(["D", "DD", "DDDDD"].map((key) => along(key, "unknown").summary)).toEqual([
      "enfant",
      "petit-fils/petite-fille",
      "descendant/descendante au 5e degré",
    ]);
  });

  it("names both people", () => {
    expect(roles("me", "dad")).toEqual({ other: "père", self: "fils" });
    expect(roles("me", "grandma")).toEqual({ other: "grand-mère", self: "petit-fils" });
  });
});

describe("siblings", () => {
  it("names brothers and sisters", () => {
    expect(roles("me", "sis")).toEqual({ other: "sœur", self: "frère" });
    expect(along("UD", "unknown").summary).toBe("frère/sœur");
  });

  it("tells half-siblings apart, when both have two parents and share one", () => {
    expect(roles("me", "half")).toEqual({ other: "demi-sœur", self: "demi-frère" });
    expect(roles("half", "me")).toEqual({ other: "demi-frère", self: "demi-sœur" });
  });

  it("does not call siblings half-siblings when one's other parent is unknown", () => {
    expect(roles("me", "onlyDad")).toEqual({ other: "sœur", self: "frère" });
  });

  it("gives both forms for half-siblings of unknown sex", () => {
    const both = "demi-frère/demi-sœur";
    expect(text("x", "y", halfSiblings).main.roles).toEqual({ other: both, self: both });
  });
});

describe("uncles, aunts, nephews and nieces", () => {
  it("names uncles and aunts, then great- and great-great-uncles", () => {
    expect(roles("me", "aunt")).toEqual({ other: "tante", self: "neveu" });
    expect(along("UUD", "male").summary).toBe("oncle");
    expect(along("UUD", "unknown").summary).toBe("oncle/tante");
    expect(along("UUUD", "male").summary).toBe("grand-oncle");
    expect(along("UUUD", "female").summary).toBe("grand-tante");
    expect(along("UUUD", "unknown").summary).toBe("grand-oncle/grand-tante");
    expect(along("UUUUD", "male").summary).toBe("arrière-grand-oncle");
    expect(along("UUUUD", "female").summary).toBe("arrière-grand-tante");
  });

  it("names nephews and nieces, then great- and great-great-nephews", () => {
    expect(along("UDD", "female").summary).toBe("nièce");
    expect(along("UDD", "unknown").summary).toBe("neveu/nièce");
    expect(along("UDDD", "male").summary).toBe("petit-neveu");
    expect(along("UDDD", "female").summary).toBe("petite-nièce");
    expect(along("UDDDD", "male").summary).toBe("arrière-petit-neveu");
    expect(along("UDDDD", "female").summary).toBe("arrière-petite-nièce");
    // A great-uncle and his great-nephew, each from their side.
    expect(along("UUUD", males("UUUD", { 2: "female" })).roles).toEqual({
      other: "grand-oncle",
      self: "petit-neveu",
    });
  });

  it("names those beyond through the person of the other's generation", () => {
    expect(along("UUUUUD", "male").summary).toBe(
      "frère de l'arrière-arrière-grand-père/de l'arrière-arrière-grand-mère",
    );
    expect(along("UUUUUD", males("UUUUUD", { 4: "female", 6: "female" })).summary).toBe(
      "sœur de l'arrière-arrière-grand-mère",
    );
    expect(along("UDDDDD", all("UDDDDD", "male")).summary).toBe("arrière-arrière-petit-fils du frère");
    expect(along("UDDDDD", males("UDDDDD", { 2: "female", 6: "female" })).summary).toBe(
      "arrière-arrière-petite-fille de la sœur",
    );
  });
});

describe("cousins", () => {
  it("names first and second cousins", () => {
    expect(roles("me", "cousin")).toEqual({ other: "cousin germain", self: "cousin germain" });
    expect(along("UUDD", "female").summary).toBe("cousine germaine");
    expect(along("UUDD", "unknown").summary).toBe("cousin germain/cousine germaine");
    expect(along("UUUDDD", "male").summary).toBe("cousin issu de germain");
    expect(along("UUUDDD", "female").summary).toBe("cousine issue de germain");
    expect(along("UUUDDD", "unknown").summary).toBe("cousin issu de germain/cousine issue de germain");
  });

  it("names further cousins by degree, in words up to the tenth, then in figures", () => {
    const cousin = (degree: number, sex: Sex) => along("U".repeat(degree + 1) + "D".repeat(degree + 1), sex).summary;
    expect(cousin(3, "male")).toBe("cousin au troisième degré");
    expect(cousin(4, "female")).toBe("cousine au quatrième degré");
    expect(cousin(4, "unknown")).toBe("cousin/cousine au quatrième degré");
    expect(cousin(8, "male")).toBe("cousin au huitième degré");
    expect(cousin(10, "female")).toBe("cousine au dixième degré");
    expect(cousin(11, "male")).toBe("cousin au 11e degré");
    expect(text("me", "you", twoLines).main.summary).toBe("cousin/cousine au quatrième degré");
  });

  it("names a parent's first cousin through the parent", () => {
    expect(along("UUUDD", all("UUUDD", "male")).summary).toBe("cousin germain du père");
    expect(along("UUUDD", males("UUUDD", { 1: "female", 5: "female" })).summary).toBe("cousine germaine de la mère");
    expect(along("UUUDD", males("UUUDD", { 5: "unknown" })).summary).toBe("cousin germain/cousine germaine du père");
    expect(along("UUUDD", "male").summary).toBe("cousin germain du père/de la mère");
  });

  it("names a first cousin's child through the cousin", () => {
    expect(along("UUDDD", all("UUDDD", "male")).summary).toBe("fils du cousin germain");
    expect(along("UUDDD", males("UUDDD", { 4: "female" })).summary).toBe("fils de la cousine germaine");
    expect(along("UUDDD", males("UUDDD", { 5: "female" })).summary).toBe("fille du cousin germain");
    expect(along("UUDDD", males("UUDDD", { 5: "unknown" })).summary).toBe("enfant du cousin germain");
    expect(along("UUDDD", "unknown").summary).toBe("enfant du cousin germain/de la cousine germaine");
    expect(roles("me", "cousinKid")).toEqual({ other: "fille du cousin germain", self: "cousin germain du père" });
  });

  it("names a grandparent's second cousin through the grandparent", () => {
    const key = "UUUUUDDD";
    expect(along(key, all(key, "male")).summary).toBe("cousin issu de germain du grand-père");
    expect(along(key, males(key, { 2: "female", 8: "female" })).summary).toBe(
      "cousine issue de germain de la grand-mère",
    );
    expect(along(key, males(key, { 2: "female", 8: "unknown" })).summary).toBe(
      "cousin issu de germain/cousine issue de germain de la grand-mère",
    );
  });

  it("names other removed cousins the same way", () => {
    expect(along("UUUUDD", all("UUUUDD", "male")).summary).toBe("cousin germain du grand-père");
    expect(along("UUDDDD", males("UUDDDD", { 4: "female" })).summary).toBe("petit-fils de la cousine germaine");
    expect(along("UUUUUUDDD", males("UUUUUUDDD", { 3: "female" })).summary).toBe(
      "cousin issu de germain de l'arrière-grand-mère",
    );
    expect(along("UUUDDDDDD", males("UUUDDDDDD", { 9: "female" })).summary).toBe(
      "arrière-petite-fille du cousin issu de germain",
    );
    expect(along("UUUUUDD", all("UUUUUDD", "male")).summary).toBe("cousin germain de l'arrière-grand-père");
    expect(along("UUUUUUUDD", "male").summary).toBe("cousin germain de l'ascendant/de l'ascendante au 5e degré");
  });
});

describe("relations by marriage with a name", () => {
  it("names spouses", () => {
    expect(roles("me", "wife")).toEqual({ other: "épouse", self: "époux" });
    expect(along("S", "unknown").roles).toEqual({ other: "conjoint", self: "conjoint" });
  });

  it("names parents-in-law and children-in-law", () => {
    expect(roles("wife", "dad")).toEqual({ other: "beau-père", self: "belle-fille" });
    expect(roles("me", "inlawMom")).toEqual({ other: "belle-mère", self: "gendre" });
    expect(along("SU", "unknown").roles).toEqual({ other: "beau-père/belle-mère", self: "gendre/belle-fille" });
  });

  it("names brothers- and sisters-in-law", () => {
    expect(roles("me", "wifeSister")).toEqual({ other: "belle-sœur", self: "beau-frère" });
    expect(along("SUD", "unknown").roles).toEqual({ other: "beau-frère/belle-sœur", self: "beau-frère/belle-sœur" });
  });

  it("names a child's parents-in-law by the child and the child's spouse", () => {
    expect(roles("dad", "inlawMom")).toEqual({
      other: "mère de l'épouse du fils",
      self: "père de l'époux de la fille",
    });
    // «parent» only on its own: as the head of a longer name it would read "relative of".
    expect(along("DSU", "unknown").roles).toEqual({
      other: "père/mère du conjoint de l'enfant",
      self: "père/mère du conjoint de l'enfant",
    });
    expect(along("DSU", ["male", "male", "female", "unknown"]).summary).toBe("père/mère de l'épouse du fils");
  });

  it("names men married to sisters and women married to brothers, and no other pair", () => {
    expect(roles("me", "wifeSisterHusband")).toEqual({
      other: "époux de la belle-sœur",
      self: "époux de la belle-sœur",
    });
    expect(along("SUDS", ["female", "male", "unknown", "male", "female"]).roles).toEqual({
      other: "épouse du beau-frère",
      self: "épouse du beau-frère",
    });
    expect(along("SUDS", ["male", "female", "unknown", "male", "unknown"]).roles).toBeNull();
  });

  it("names uncles and nephews by marriage on either side", () => {
    expect(roles("me", "uncle")).toEqual({ other: "oncle par alliance", self: "neveu par alliance" });
    // A wife's aunt; a niece's husband, the other way round.
    expect(along("SUUD", ["female", "male", "male", "male", "female"]).roles).toEqual({
      other: "tante par alliance",
      self: "nièce par alliance",
    });
    expect(along("UUDS", "unknown").roles).toEqual({
      other: "oncle/tante par alliance",
      self: "neveu/nièce par alliance",
    });
  });

  it("names step-parents and step-children with the in-law words", () => {
    expect(along("US", ["male", "male", "female"]).roles).toEqual({ other: "belle-mère", self: "beau-fils" });
    expect(along("US", ["female", "female", "male"]).roles).toEqual({ other: "beau-père", self: "belle-fille" });
    expect(along("US", "unknown").roles).toEqual({ other: "beau-père/belle-mère", self: "beau-fils/belle-fille" });
  });
});

describe("other relatives by marriage, named through the blood relative", () => {
  it("names the spouse of a relative and a relative of the spouse", () => {
    // me → cousin's wife: up, up, down, down, spouse.
    expect(roles("me", "cousinWife")).toEqual({
      other: "épouse d'un cousin germain",
      self: "cousin germain de l'époux",
    });
    // The husband of a father's first cousin; the other way, the son of a wife's first cousin.
    const sexes: Sex[] = ["male", "male", "female", "female", "female", "female", "male"];
    expect(along("UUUDDS", sexes).roles).toEqual({
      other: "époux d'une cousine germaine du père",
      self: "fils du cousin germain de l'épouse",
    });
    // A grandfather's wife.
    expect(along("UUS", ["female", "male", "male", "female"]).summary).toBe("épouse d'un grand-père");
  });

  it("gives both forms when the relative's or the spouse's sex is not known", () => {
    expect(along("UUDDS", males("UUDDS", { 1: "unknown", 2: "unknown", 3: "unknown", 4: "unknown" })).summary).toBe(
      "époux d'un cousin germain/d'une cousine germaine",
    );
    expect(along("SDD", ["male", "unknown", "male", "unknown"]).summary).toBe("petit-fils/petite-fille du conjoint");
  });
});

describe("the chain between two people", () => {
  it("names each step in French, with a no-break space before the colon", () => {
    // Both grandparents are common ancestors; with no birth years, grandpa comes first in `people`.
    expect(text("me", "cousin").main.chain.map((step) => step.text)).toEqual([
      "me Παπαδόπουλος",
      "père\u00A0: dad Παπαδόπουλος",
      "père\u00A0: grandpa Παπαδόπουλος",
      "fille\u00A0: aunt Παπαδόπουλος",
      "fils\u00A0: cousin Παπαδόπουλος",
    ]);
    expect(text("me", "wifeSister").main.chain.map((step) => step.text)).toEqual([
      "me Παπαδόπουλος",
      "épouse\u00A0: wife Παπαδόπουλος",
      "père\u00A0: inlawDad Παπαδόπουλος",
      "fille\u00A0: wifeSister Παπαδόπουλος",
    ]);
  });

  it("has a neutral word for each step when the sex is not known", () => {
    expect([fr.step("up", "unknown"), fr.step("down", "unknown"), fr.step("spouse", "unknown")]).toEqual([
      "parent",
      "enfant",
      "conjoint",
    ]);
    expect(fr.step("spouse", "male")).toBe("époux");
  });
});

describe("the degree of a relationship", () => {
  const degree = (key: string) => along(key, "unknown").degree;

  it("is said as the Code civil counts it, by blood or by marriage", () => {
    expect(degree("D")).toBe("Parenté par le sang en ligne directe, au 1er degré");
    expect(degree("UUD")).toBe("Parenté par le sang en ligne collatérale, au 3e degré");
    expect(degree("SU")).toBe("Parenté par alliance en ligne directe, au 1er degré");
    expect(degree("UUDDS")).toBe("Parenté par alliance en ligne collatérale, au 4e degré");
    expect(degree("S")).toBeNull();
  });
});

describe("related only through marriages", () => {
  it("says which marriage joins them", () => {
    // A sister's husband's brother.
    const sexes: Sex[] = ["male", "unknown", "female", "male", "unknown", "male"];
    expect(along("UDSUD", sexes).summary).toBe("Liés par le mariage de p2 Παπαδόπουλος et p3 Παπαδόπουλος.");
  });

  it("says which marriages join them, with a no-break space before the semicolon", () => {
    const apart = along("SUDS", ["male", "female", "unknown", "male", "female"]);
    expect(apart.roles).toBeNull();
    expect(apart.summary).toBe(
      "Liés par les mariages de p0 Παπαδόπουλος et p1 Παπαδόπουλος\u00a0; p3 Παπαδόπουλος et p4 Παπαδόπουλος.",
    );
  });
});

describe("related in more than one way", () => {
  it("finds that a couple were related before they married, and names their common ancestors", () => {
    expect(ties("c1", "c3", twice)).toEqual({
      main: "époux",
      couple: true,
      others: [
        {
          name: "cousin germain",
          ancestors: expect.stringMatching(
            /^Ancêtres communs\u00a0: (ma Παπαδόπουλος et pa|pa Παπαδόπουλος et ma) Παπαδόπουλος$/,
          ),
        },
      ],
    });
  });

  it("puts a relation by marriage with a name before a distant blood tie, with one common ancestor", () => {
    const { main, others } = text("me", "husband", village);
    expect(main.roles).toEqual({ other: "oncle par alliance", self: "neveu par alliance" });
    expect(others.map((tie) => [tie.summary, tie.commonAncestors])).toEqual([
      ["cousin au troisième degré du père", "Ancêtre commun\u00a0: old Παπαδόπουλος"],
    ]);
  });

  it("names no common ancestor when one of the two descends from the other", () => {
    const { main, others } = text("me", "old", tangled);
    expect(main.summary).toBe("oncle par alliance");
    expect(others.map((tie) => [tie.summary, tie.commonAncestors])).toEqual([["ascendant au 5e degré", null]]);
  });

  it("lists three or more common ancestors with commas", () => {
    expect(fr.commonAncestors(["A", "B", "C"])).toBe("Ancêtres communs\u00a0: A, B et C");
  });
});
