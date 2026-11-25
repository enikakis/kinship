import { describe, expect, it } from "vitest";
import { all, describing, males } from "../testing/describing";
import { halfSiblings, tangled, twice, twoLines, village } from "../testing/fixtures";
import type { Sex } from "../types";
import { de } from "./de";

/*
 * Relations in German words, as in the term table docs/locales/de.md. The test trees are drawn in
 * ../testing/fixtures.ts. Longer names put the genitive after the head noun: «Cousin des Vaters».
 */

const { text, roles, along, ties } = describing(de);

describe("the direct line", () => {
  it("names ancestors by their words up to the great-great-great-grandparents, then by the degree", () => {
    expect(["U", "UU", "UUU", "UUUU", "UUUUU", "UUUUUU", "UUUUUUU"].map((key) => along(key, "male").summary)).toEqual([
      "Vater",
      "Großvater",
      "Urgroßvater",
      "Ururgroßvater",
      "Urururgroßvater",
      "Vorfahr 6. Grades",
      "Vorfahr 7. Grades",
    ]);
    expect(["U", "UU", "UUU", "UUUU", "UUUUU", "UUUUUU"].map((key) => along(key, "female").summary)).toEqual([
      "Mutter",
      "Großmutter",
      "Urgroßmutter",
      "Ururgroßmutter",
      "Urururgroßmutter",
      "Vorfahrin 6. Grades",
    ]);
    expect(["U", "UU", "UUUUUU"].map((key) => along(key, "unknown").summary)).toEqual([
      "Elternteil",
      "Großvater/Großmutter",
      "Vorfahr/Vorfahrin 6. Grades",
    ]);
  });

  it("names descendants by their words up to the great-great-great-grandchildren, then by the degree", () => {
    expect(["D", "DD", "DDD", "DDDD", "DDDDD", "DDDDDD"].map((key) => along(key, "male").summary)).toEqual([
      "Sohn",
      "Enkel",
      "Urenkel",
      "Ururenkel",
      "Urururenkel",
      "Nachkomme 6. Grades",
    ]);
    expect(["D", "DD", "DDD", "DDDD", "DDDDD", "DDDDDD"].map((key) => along(key, "female").summary)).toEqual([
      "Tochter",
      "Enkelin",
      "Urenkelin",
      "Ururenkelin",
      "Urururenkelin",
      "Nachkommin 6. Grades",
    ]);
    expect(["D", "DD", "DDD", "DDDD", "DDDDDD"].map((key) => along(key, "unknown").summary)).toEqual([
      "Kind",
      "Enkelkind",
      "Urenkelkind",
      "Ururenkel/Ururenkelin",
      "Nachkomme/Nachkommin 6. Grades",
    ]);
  });

  it("names both people", () => {
    expect(roles("me", "dad")).toEqual({ other: "Vater", self: "Sohn" });
    expect(roles("me", "grandma")).toEqual({ other: "Großmutter", self: "Enkel" });
  });
});

describe("siblings", () => {
  it("names brothers and sisters", () => {
    expect(roles("me", "sis")).toEqual({ other: "Schwester", self: "Bruder" });
    expect(along("UD", "unknown").summary).toBe("Bruder/Schwester");
  });

  it("tells half-siblings apart, when both have two parents and share one", () => {
    expect(roles("me", "half")).toEqual({ other: "Halbschwester", self: "Halbbruder" });
    expect(roles("half", "me")).toEqual({ other: "Halbbruder", self: "Halbschwester" });
  });

  it("does not call siblings half-siblings when one's other parent is unknown", () => {
    expect(roles("me", "onlyDad")).toEqual({ other: "Schwester", self: "Bruder" });
  });

  it("gives both forms for half-siblings of unknown sex", () => {
    const both = "Halbbruder/Halbschwester";
    expect(text("x", "y", halfSiblings).main.roles).toEqual({ other: both, self: both });
  });
});

describe("uncles, aunts, nephews and nieces", () => {
  it("names uncles and aunts, then great- and great-great-uncles", () => {
    expect(roles("me", "aunt")).toEqual({ other: "Tante", self: "Neffe" });
    expect(along("UUD", "male").summary).toBe("Onkel");
    expect(along("UUD", "unknown").summary).toBe("Onkel/Tante");
    expect(along("UUUD", "male").summary).toBe("Großonkel");
    expect(along("UUUD", "female").summary).toBe("Großtante");
    expect(along("UUUD", "unknown").summary).toBe("Großonkel/Großtante");
    expect(along("UUUUD", "male").summary).toBe("Urgroßonkel");
    expect(along("UUUUD", "female").summary).toBe("Urgroßtante");
  });

  it("names nephews and nieces, then great- and great-great-nephews", () => {
    expect(along("UDD", "female").summary).toBe("Nichte");
    expect(along("UDD", "unknown").summary).toBe("Neffe/Nichte");
    expect(along("UDDD", "male").summary).toBe("Großneffe");
    expect(along("UDDD", "female").summary).toBe("Großnichte");
    expect(along("UDDDD", "male").summary).toBe("Urgroßneffe");
    expect(along("UDDDD", "female").summary).toBe("Urgroßnichte");
    // A great-uncle and his great-nephew, each from their side.
    expect(along("UUUD", males("UUUD", { 2: "female" })).roles).toEqual({ other: "Großonkel", self: "Großneffe" });
  });

  it("names those beyond through the person of the other's generation", () => {
    expect(along("UUUUUD", "male").summary).toBe("Bruder des Ururgroßvaters/der Ururgroßmutter");
    expect(along("UUUUUD", males("UUUUUD", { 4: "female", 6: "female" })).summary).toBe(
      "Schwester der Ururgroßmutter",
    );
    expect(along("UDDDDD", all("UDDDDD", "male")).summary).toBe("Ururenkel des Bruders");
    expect(along("UDDDDD", males("UDDDDD", { 2: "female", 6: "female" })).summary).toBe("Ururenkelin der Schwester");
  });
});

describe("cousins", () => {
  it("names first and second cousins", () => {
    expect(roles("me", "cousin")).toEqual({ other: "Cousin", self: "Cousin" });
    expect(along("UUDD", "female").summary).toBe("Cousine");
    expect(along("UUDD", "unknown").summary).toBe("Cousin/Cousine");
    expect(along("UUUDDD", "male").summary).toBe("Cousin 2. Grades");
    expect(along("UUUDDD", "female").summary).toBe("Cousine 2. Grades");
    expect(along("UUUDDD", "unknown").summary).toBe("Cousin/Cousine 2. Grades");
  });

  it("names further cousins by degree, in figures", () => {
    const cousin = (degree: number, sex: Sex) => along("U".repeat(degree + 1) + "D".repeat(degree + 1), sex).summary;
    expect(cousin(3, "male")).toBe("Cousin 3. Grades");
    expect(cousin(4, "female")).toBe("Cousine 4. Grades");
    expect(cousin(4, "unknown")).toBe("Cousin/Cousine 4. Grades");
    expect(cousin(8, "male")).toBe("Cousin 8. Grades");
    expect(cousin(11, "female")).toBe("Cousine 11. Grades");
    expect(text("me", "you", twoLines).main.summary).toBe("Cousin/Cousine 4. Grades");
  });

  it("names a parent's first cousin through the parent", () => {
    expect(along("UUUDD", all("UUUDD", "male")).summary).toBe("Cousin des Vaters");
    expect(along("UUUDD", males("UUUDD", { 1: "female", 5: "female" })).summary).toBe("Cousine der Mutter");
    expect(along("UUUDD", males("UUUDD", { 5: "unknown" })).summary).toBe("Cousin/Cousine des Vaters");
    // «des Elternteils» reads oddly, as there are two.
    expect(along("UUUDD", "male").summary).toBe("Cousin eines Elternteils");
  });

  it("names a first cousin's child through the cousin", () => {
    expect(along("UUDDD", all("UUDDD", "male")).summary).toBe("Sohn des Cousins");
    expect(along("UUDDD", males("UUDDD", { 4: "female" })).summary).toBe("Sohn der Cousine");
    expect(along("UUDDD", males("UUDDD", { 5: "female" })).summary).toBe("Tochter des Cousins");
    expect(along("UUDDD", males("UUDDD", { 5: "unknown" })).summary).toBe("Kind des Cousins");
    expect(along("UUDDD", "unknown").summary).toBe("Kind des Cousins/der Cousine");
    expect(roles("me", "cousinKid")).toEqual({ other: "Tochter des Cousins", self: "Cousin des Vaters" });
  });

  it("names a grandparent's second cousin through the grandparent", () => {
    const key = "UUUUUDDD";
    expect(along(key, all(key, "male")).summary).toBe("Cousin 2. Grades des Großvaters");
    expect(along(key, males(key, { 2: "female", 8: "female" })).summary).toBe("Cousine 2. Grades der Großmutter");
    expect(along(key, males(key, { 2: "female", 8: "unknown" })).summary).toBe(
      "Cousin/Cousine 2. Grades der Großmutter",
    );
  });

  it("names other removed cousins the same way", () => {
    expect(along("UUUUDD", all("UUUUDD", "male")).summary).toBe("Cousin des Großvaters");
    expect(along("UUUUDD", "male").summary).toBe("Cousin des Großvaters/der Großmutter");
    expect(along("UUDDDD", males("UUDDDD", { 4: "female" })).summary).toBe("Enkel der Cousine");
    expect(along("UUUUUUDDD", males("UUUUUUDDD", { 3: "female" })).summary).toBe(
      "Cousin 2. Grades der Urgroßmutter",
    );
    expect(along("UUUDDDDDD", males("UUUDDDDDD", { 9: "female" })).summary).toBe("Urenkelin des Cousins 2. Grades");
    expect(along("UUUUUDD", all("UUUUUDD", "male")).summary).toBe("Cousin des Urgroßvaters");
  });

  it("puts weak nouns in the genitive with -n", () => {
    const key = "UUUUUUUUDD";
    expect(along(key, all(key, "male")).summary).toBe("Cousin des Vorfahren 6. Grades");
    expect(along(key, males(key, { 6: "female" })).summary).toBe("Cousin der Vorfahrin 6. Grades");
    expect(along(key, "male").summary).toBe("Cousin des Vorfahren/der Vorfahrin 6. Grades");
    expect(along("DDDDDDS", males("DDDDDDS", { 7: "female" })).summary).toBe("Ehefrau eines Nachkommen 6. Grades");
    expect(along("UDDDS", males("UDDDS", { 5: "female" })).summary).toBe("Ehefrau eines Großneffen");
  });
});

describe("relations by marriage with a name", () => {
  it("names spouses", () => {
    expect(roles("me", "wife")).toEqual({ other: "Ehefrau", self: "Ehemann" });
    expect(along("S", "unknown").roles).toEqual({ other: "Ehepartner", self: "Ehepartner" });
  });

  it("names parents-in-law and children-in-law", () => {
    expect(roles("wife", "dad")).toEqual({ other: "Schwiegervater", self: "Schwiegertochter" });
    expect(roles("me", "inlawMom")).toEqual({ other: "Schwiegermutter", self: "Schwiegersohn" });
    expect(along("SU", "unknown").roles).toEqual({ other: "Schwiegervater/Schwiegermutter", self: "Schwiegerkind" });
  });

  it("names brothers- and sisters-in-law", () => {
    expect(roles("me", "wifeSister")).toEqual({ other: "Schwägerin", self: "Schwager" });
    expect(along("SUD", "unknown").roles).toEqual({ other: "Schwager/Schwägerin", self: "Schwager/Schwägerin" });
  });

  it("names a child's parents-in-law through the child", () => {
    expect(roles("dad", "inlawMom")).toEqual({
      other: "Schwiegermutter des Sohnes",
      self: "Schwiegervater der Tochter",
    });
    expect(along("DSU", "unknown").roles).toEqual({
      other: "Schwiegervater/Schwiegermutter des Kindes",
      self: "Schwiegervater/Schwiegermutter des Kindes",
    });
    expect(along("DSU", ["male", "male", "female", "unknown"]).summary).toBe(
      "Schwiegervater/Schwiegermutter des Sohnes",
    );
  });

  it("names men married to sisters and women married to brothers, and no other pair", () => {
    expect(roles("me", "wifeSisterHusband")).toEqual({ other: "Schwippschwager", self: "Schwippschwager" });
    expect(along("SUDS", ["female", "male", "unknown", "male", "female"]).roles).toEqual({
      other: "Schwippschwägerin",
      self: "Schwippschwägerin",
    });
    expect(along("SUDS", ["male", "female", "unknown", "male", "unknown"]).roles).toBeNull();
  });

  it("names uncles and nephews by marriage on either side", () => {
    expect(roles("me", "uncle")).toEqual({ other: "angeheirateter Onkel", self: "angeheirateter Neffe" });
    // A wife's aunt; a niece's husband, the other way round.
    expect(along("SUUD", ["female", "male", "male", "male", "female"]).roles).toEqual({
      other: "angeheiratete Tante",
      self: "angeheiratete Nichte",
    });
    expect(along("UUDS", "unknown").roles).toEqual({
      other: "angeheirateter Onkel/angeheiratete Tante",
      self: "angeheirateter Neffe/angeheiratete Nichte",
    });
  });

  it("names step-parents and step-children", () => {
    expect(along("US", ["male", "male", "female"]).roles).toEqual({ other: "Stiefmutter", self: "Stiefsohn" });
    expect(along("US", ["female", "female", "male"]).roles).toEqual({ other: "Stiefvater", self: "Stieftochter" });
    expect(along("US", "unknown").roles).toEqual({ other: "Stiefelternteil", self: "Stiefkind" });
  });
});

describe("other relatives by marriage, named through the blood relative", () => {
  it("names the spouse of a relative and a relative of the spouse", () => {
    // me → cousin's wife: up, up, down, down, spouse.
    expect(roles("me", "cousinWife")).toEqual({ other: "Ehefrau eines Cousins", self: "Cousin des Ehemannes" });
    // The husband of a father's first cousin; the other way, the son of a wife's first cousin.
    const sexes: Sex[] = ["male", "male", "female", "female", "female", "female", "male"];
    expect(along("UUUDDS", sexes).roles).toEqual({
      other: "Ehemann einer Cousine des Vaters",
      self: "Sohn des Cousins der Ehefrau",
    });
    // A grandfather's wife; an ancestor's wife.
    expect(along("UUS", ["female", "male", "male", "female"]).summary).toBe("Ehefrau eines Großvaters");
    expect(along("UUUUUUS", males("UUUUUUS", { 7: "female" })).summary).toBe("Ehefrau eines Vorfahren 6. Grades");
  });

  it("gives both forms when the relative's sex is not known, and the neutral word for a spouse", () => {
    expect(along("UUDDS", males("UUDDS", { 1: "unknown", 2: "unknown", 3: "unknown", 4: "unknown" })).summary).toBe(
      "Ehemann eines Cousins/einer Cousine",
    );
    expect(along("SDD", ["male", "unknown", "male", "unknown"]).summary).toBe("Enkelkind des Ehepartners");
  });
});

describe("German spelling", () => {
  it("capitalises every noun, and neither articles, ordinals nor the adjective «angeheiratet»", () => {
    const names = [
      along("UUUUUDDD", males("UUUUUDDD", { 2: "female", 8: "unknown" })).summary,
      along("UUUDDS", ["male", "male", "female", "female", "female", "female", "male"]).roles?.self,
      along("UUDDDD", "unknown").summary,
      along("UUDS", "unknown").summary,
      along("DSU", "unknown").summary,
    ].join(" ");
    const words = names.split(/[ /]/);
    const small = /^(des|der|eines|einer|\d+\.|angeheiratete[r]?)$/;
    expect(words.filter((word) => !small.test(word) && !/^[A-ZÄÖÜ]/.test(word))).toEqual([]);
    expect(words.filter((word) => small.test(word)).length).toBeGreaterThan(0);
  });
});

describe("the chain between two people", () => {
  it("names each step in German, with no space before the colon", () => {
    // Both grandparents are common ancestors; with no birth years, grandpa comes first in `people`.
    expect(text("me", "cousin").main.chain.map((step) => step.text)).toEqual([
      "me Παπαδόπουλος",
      "Vater: dad Παπαδόπουλος",
      "Vater: grandpa Παπαδόπουλος",
      "Tochter: aunt Παπαδόπουλος",
      "Sohn: cousin Παπαδόπουλος",
    ]);
    expect(text("me", "wifeSister").main.chain.map((step) => step.text)).toEqual([
      "me Παπαδόπουλος",
      "Ehefrau: wife Παπαδόπουλος",
      "Vater: inlawDad Παπαδόπουλος",
      "Tochter: wifeSister Παπαδόπουλος",
    ]);
  });

  it("has a neutral word for each step when the sex is not known", () => {
    expect([de.step("up", "unknown"), de.step("down", "unknown"), de.step("spouse", "unknown")]).toEqual([
      "Elternteil",
      "Kind",
      "Ehepartner",
    ]);
    expect(de.step("spouse", "male")).toBe("Ehemann");
  });
});

describe("the degree of a relationship", () => {
  const degree = (key: string) => along(key, "unknown").degree;

  it("is said as the BGB counts it, by blood or by marriage", () => {
    expect(degree("D")).toBe("Verwandt in gerader Linie im 1. Grad");
    expect(degree("UUD")).toBe("Verwandt in der Seitenlinie im 3. Grad");
    expect(degree("SU")).toBe("Verschwägert in gerader Linie im 1. Grad");
    expect(degree("UUDDS")).toBe("Verschwägert in der Seitenlinie im 4. Grad");
    expect(degree("S")).toBeNull();
  });
});

describe("related only through marriages", () => {
  it("says which marriage joins them", () => {
    // A sister's husband's brother.
    const sexes: Sex[] = ["male", "unknown", "female", "male", "unknown", "male"];
    expect(along("UDSUD", sexes).summary).toBe("Verbunden über die Ehe von p2 Παπαδόπουλος und p3 Παπαδόπουλος.");
  });

  it("says which marriages join them", () => {
    const apart = along("SUDS", ["male", "female", "unknown", "male", "female"]);
    expect(apart.roles).toBeNull();
    expect(apart.summary).toBe(
      "Verbunden über die Ehen von p0 Παπαδόπουλος und p1 Παπαδόπουλος; p3 Παπαδόπουλος und p4 Παπαδόπουλος.",
    );
  });
});

describe("related in more than one way", () => {
  it("finds that a couple were related before they married, and names their common ancestors", () => {
    expect(ties("c1", "c3", twice)).toEqual({
      main: "Ehemann",
      couple: true,
      others: [
        {
          name: "Cousin",
          ancestors: expect.stringMatching(
            /^Gemeinsame Vorfahren: (ma Παπαδόπουλος und pa|pa Παπαδόπουλος und ma) Παπαδόπουλος$/,
          ),
        },
      ],
    });
  });

  it("puts a relation by marriage with a name before a distant blood tie, with one common ancestor", () => {
    const { main, others } = text("me", "husband", village);
    expect(main.roles).toEqual({ other: "angeheirateter Onkel", self: "angeheirateter Neffe" });
    expect(others.map((tie) => [tie.summary, tie.commonAncestors])).toEqual([
      ["Cousin 3. Grades des Vaters", "Gemeinsamer Vorfahr: old Παπαδόπουλος"],
    ]);
  });

  it("names no common ancestor when one of the two descends from the other", () => {
    const { main, others } = text("me", "old", tangled);
    expect(main.summary).toBe("angeheirateter Onkel");
    expect(others.map((tie) => [tie.summary, tie.commonAncestors])).toEqual([["Urururgroßvater", null]]);
  });

  it("lists three or more common ancestors with commas", () => {
    expect(de.commonAncestors(["A", "B", "C"])).toBe("Gemeinsame Vorfahren: A, B und C");
  });
});
