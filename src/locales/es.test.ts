import { describe, expect, it } from "vitest";
import { all, describing, males } from "../testing/describing";
import { halfSiblings, tangled, twice, twoLines, village } from "../testing/fixtures";
import type { Sex } from "../types";
import { es } from "./es";

/*
 * Relations in Spanish words, as in the term table docs/locales/es.md. The test trees are drawn in
 * ../testing/fixtures.ts.
 */

const { text, roles, along, ties } = describing(es);

describe("the direct line", () => {
  it("names ancestors by their words up to the great-great-grandparents, then by the degree", () => {
    expect(["U", "UU", "UUU", "UUUU", "UUUUU", "UUUUUU"].map((key) => along(key, "male").summary)).toEqual([
      "padre",
      "abuelo",
      "bisabuelo",
      "tatarabuelo",
      "ascendiente de quinto grado",
      "ascendiente de sexto grado",
    ]);
    expect(["U", "UU", "UUU", "UUUU", "UUUUU", "UUUUUU"].map((key) => along(key, "female").summary)).toEqual([
      "madre",
      "abuela",
      "bisabuela",
      "tatarabuela",
      "ascendiente de quinto grado",
      "ascendiente de sexto grado",
    ]);
    expect(["U", "UU", "UUUUU"].map((key) => along(key, "unknown").summary)).toEqual([
      "padre/madre",
      "abuelo/abuela",
      "ascendiente de quinto grado",
    ]);
  });

  it("names descendants by their words up to the great-great-grandchildren, then by the degree", () => {
    expect(["D", "DD", "DDD", "DDDD", "DDDDD", "DDDDDD"].map((key) => along(key, "male").summary)).toEqual([
      "hijo",
      "nieto",
      "bisnieto",
      "tataranieto",
      "descendiente de quinto grado",
      "descendiente de sexto grado",
    ]);
    expect(["D", "DD", "DDD", "DDDD", "DDDDD", "DDDDDD"].map((key) => along(key, "female").summary)).toEqual([
      "hija",
      "nieta",
      "bisnieta",
      "tataranieta",
      "descendiente de quinto grado",
      "descendiente de sexto grado",
    ]);
    expect(["D", "DD", "DDDDD"].map((key) => along(key, "unknown").summary)).toEqual([
      "hijo/hija",
      "nieto/nieta",
      "descendiente de quinto grado",
    ]);
  });

  it("shortens the ordinal before «grado»", () => {
    expect(along("U".repeat(11), "male").summary).toBe("ascendiente de undécimo grado");
    expect(along("U".repeat(13), "male").summary).toBe("ascendiente de decimotercer grado");
    expect(along("D".repeat(21), "female").summary).toBe("descendiente de 21.er grado");
  });

  it("names both people", () => {
    expect(roles("me", "dad")).toEqual({ other: "padre", self: "hijo" });
    expect(roles("me", "grandma")).toEqual({ other: "abuela", self: "nieto" });
  });
});

describe("siblings", () => {
  it("names brothers and sisters", () => {
    expect(roles("me", "sis")).toEqual({ other: "hermana", self: "hermano" });
    expect(along("UD", "unknown").summary).toBe("hermano/hermana");
  });

  it("tells half-siblings apart, when both have two parents and share one", () => {
    expect(roles("me", "half")).toEqual({ other: "media hermana", self: "medio hermano" });
    expect(roles("half", "me")).toEqual({ other: "medio hermano", self: "media hermana" });
  });

  it("does not call siblings half-siblings when one's other parent is unknown", () => {
    expect(roles("me", "onlyDad")).toEqual({ other: "hermana", self: "hermano" });
  });

  it("gives both forms for half-siblings of unknown sex", () => {
    const both = "medio hermano/media hermana";
    expect(text("x", "y", halfSiblings).main.roles).toEqual({ other: both, self: both });
  });
});

describe("uncles, aunts, nephews and nieces", () => {
  it("names uncles and aunts, then great- and great-great-uncles", () => {
    expect(roles("me", "aunt")).toEqual({ other: "tía", self: "sobrino" });
    expect(along("UUD", "male").summary).toBe("tío");
    expect(along("UUD", "unknown").summary).toBe("tío/tía");
    expect(along("UUUD", "male").summary).toBe("tío abuelo");
    expect(along("UUUD", "female").summary).toBe("tía abuela");
    expect(along("UUUD", "unknown").summary).toBe("tío abuelo/tía abuela");
    expect(along("UUUUD", "male").summary).toBe("tío bisabuelo");
    expect(along("UUUUD", "female").summary).toBe("tía bisabuela");
  });

  it("names nephews and nieces, then great- and great-great-nephews", () => {
    expect(along("UDD", "female").summary).toBe("sobrina");
    expect(along("UDD", "unknown").summary).toBe("sobrino/sobrina");
    expect(along("UDDD", "male").summary).toBe("sobrino nieto");
    expect(along("UDDD", "female").summary).toBe("sobrina nieta");
    expect(along("UDDDD", "male").summary).toBe("sobrino bisnieto");
    expect(along("UDDDD", "female").summary).toBe("sobrina bisnieta");
    // A great-uncle and his great-nephew, each from their side.
    expect(along("UUUD", males("UUUD", { 2: "female" })).roles).toEqual({
      other: "tío abuelo",
      self: "sobrino nieto",
    });
  });

  it("names those beyond through the person of the other's generation", () => {
    expect(along("UUUUUD", "male").summary).toBe("hermano del tatarabuelo/de la tatarabuela");
    expect(along("UUUUUD", males("UUUUUD", { 4: "female", 6: "female" })).summary).toBe("hermana de la tatarabuela");
    expect(along("UDDDDD", all("UDDDDD", "male")).summary).toBe("tataranieto del hermano");
    expect(along("UDDDDD", males("UDDDDD", { 2: "female", 6: "female" })).summary).toBe("tataranieta de la hermana");
  });
});

describe("cousins", () => {
  it("names first and second cousins", () => {
    expect(roles("me", "cousin")).toEqual({ other: "primo hermano", self: "primo hermano" });
    expect(along("UUDD", "female").summary).toBe("prima hermana");
    expect(along("UUDD", "unknown").summary).toBe("primo hermano/prima hermana");
    expect(along("UUUDDD", "male").summary).toBe("primo segundo");
    expect(along("UUUDDD", "female").summary).toBe("prima segunda");
    expect(along("UUUDDD", "unknown").summary).toBe("primo segundo/prima segunda");
  });

  it("names further cousins by an ordinal after the noun, in words up to the tenth, then in figures", () => {
    const cousin = (degree: number, sex: Sex) => along("U".repeat(degree + 1) + "D".repeat(degree + 1), sex).summary;
    expect(cousin(3, "male")).toBe("primo tercero");
    expect(cousin(3, "female")).toBe("prima tercera");
    expect(cousin(4, "unknown")).toBe("primo cuarto/prima cuarta");
    expect(cousin(7, "female")).toBe("prima séptima");
    expect(cousin(8, "male")).toBe("primo octavo");
    expect(cousin(10, "female")).toBe("prima décima");
    expect(cousin(11, "male")).toBe("primo 11.º");
    expect(cousin(11, "female")).toBe("prima 11.ª");
    expect(text("me", "you", twoLines).main.summary).toBe("primo cuarto/prima cuarta");
  });

  it("names a parent's first cousin through the parent, with «del» for «de el»", () => {
    expect(along("UUUDD", all("UUUDD", "male")).summary).toBe("primo hermano del padre");
    expect(along("UUUDD", males("UUUDD", { 1: "female", 5: "female" })).summary).toBe("prima hermana de la madre");
    expect(along("UUUDD", males("UUUDD", { 5: "female" })).summary).toBe("prima hermana del padre");
    expect(along("UUUDD", males("UUUDD", { 5: "unknown" })).summary).toBe("primo hermano/prima hermana del padre");
    expect(along("UUUDD", "male").summary).toBe("primo hermano del padre/de la madre");
  });

  it("names a first cousin's child through the cousin", () => {
    expect(along("UUDDD", all("UUDDD", "male")).summary).toBe("hijo del primo hermano");
    expect(along("UUDDD", males("UUDDD", { 4: "female" })).summary).toBe("hijo de la prima hermana");
    expect(along("UUDDD", males("UUDDD", { 5: "female" })).summary).toBe("hija del primo hermano");
    expect(along("UUDDD", males("UUDDD", { 5: "unknown" })).summary).toBe("hijo/hija del primo hermano");
    expect(along("UUDDD", "unknown").summary).toBe("hijo/hija del primo hermano/de la prima hermana");
    expect(roles("me", "cousinKid")).toEqual({ other: "hija del primo hermano", self: "primo hermano del padre" });
  });

  it("names a grandparent's second cousin through the grandparent", () => {
    const key = "UUUUUDDD";
    expect(along(key, all(key, "male")).summary).toBe("primo segundo del abuelo");
    expect(along(key, males(key, { 2: "female", 8: "female" })).summary).toBe("prima segunda de la abuela");
    expect(along(key, males(key, { 2: "female", 8: "unknown" })).summary).toBe(
      "primo segundo/prima segunda de la abuela",
    );
  });

  it("names other removed cousins the same way", () => {
    expect(along("UUUUDD", all("UUUUDD", "male")).summary).toBe("primo hermano del abuelo");
    expect(along("UUDDDD", males("UUDDDD", { 4: "female" })).summary).toBe("nieto de la prima hermana");
    expect(along("UUUUUUDDD", males("UUUUUUDDD", { 3: "female" })).summary).toBe("primo segundo de la bisabuela");
    expect(along("UUUDDDDDD", males("UUUDDDDDD", { 9: "female" })).summary).toBe("bisnieta del primo segundo");
    expect(along("UUUUUDD", all("UUUUUDD", "male")).summary).toBe("primo hermano del bisabuelo");
    expect(along("UUUUUUUDD", "male").summary).toBe("primo hermano del ascendiente de quinto grado");
    expect(along("UUUUUUUDD", males("UUUUUUUDD", { 5: "female" })).summary).toBe(
      "primo hermano de la ascendiente de quinto grado",
    );
  });
});

describe("relations by marriage with a name", () => {
  it("names spouses, with «cónyuge» when the sex is not known", () => {
    expect(roles("me", "wife")).toEqual({ other: "esposa", self: "esposo" });
    expect(along("S", "unknown").roles).toEqual({ other: "cónyuge", self: "cónyuge" });
  });

  it("names parents-in-law and children-in-law", () => {
    expect(roles("wife", "dad")).toEqual({ other: "suegro", self: "nuera" });
    expect(roles("me", "inlawMom")).toEqual({ other: "suegra", self: "yerno" });
    expect(along("SU", "unknown").roles).toEqual({ other: "suegro/suegra", self: "yerno/nuera" });
  });

  it("names brothers- and sisters-in-law", () => {
    expect(roles("me", "wifeSister")).toEqual({ other: "cuñada", self: "cuñado" });
    expect(along("SUD", "unknown").roles).toEqual({ other: "cuñado/cuñada", self: "cuñado/cuñada" });
  });

  it("names a child's parents-in-law consuegros", () => {
    expect(roles("dad", "inlawMom")).toEqual({ other: "consuegra", self: "consuegro" });
    expect(along("DSU", "unknown").roles).toEqual({ other: "consuegro/consuegra", self: "consuegro/consuegra" });
  });

  it("names men married to sisters and women married to brothers concuñados, and no other pair", () => {
    expect(roles("me", "wifeSisterHusband")).toEqual({ other: "concuñado", self: "concuñado" });
    expect(along("SUDS", ["female", "male", "unknown", "male", "female"]).roles).toEqual({
      other: "concuñada",
      self: "concuñada",
    });
    expect(along("SUDS", ["male", "female", "unknown", "male", "unknown"]).roles).toBeNull();
  });

  it("names uncles and nephews by marriage on either side", () => {
    expect(roles("me", "uncle")).toEqual({ other: "tío político", self: "sobrino político" });
    // A wife's aunt; a niece's husband, the other way round.
    expect(along("SUUD", ["female", "male", "male", "male", "female"]).roles).toEqual({
      other: "tía política",
      self: "sobrina política",
    });
    expect(along("UUDS", "unknown").roles).toEqual({
      other: "tío político/tía política",
      self: "sobrino político/sobrina política",
    });
  });

  it("names step-parents and step-children", () => {
    expect(along("US", ["male", "male", "female"]).roles).toEqual({ other: "madrastra", self: "hijastro" });
    expect(along("US", ["female", "female", "male"]).roles).toEqual({ other: "padrastro", self: "hijastra" });
    expect(along("US", "unknown").roles).toEqual({ other: "padrastro/madrastra", self: "hijastro/hijastra" });
  });
});

describe("other relatives by marriage, named through the blood relative", () => {
  it("names the spouse of a relative and a relative of the spouse", () => {
    // me → cousin's wife: up, up, down, down, spouse.
    expect(roles("me", "cousinWife")).toEqual({
      other: "esposa de un primo hermano",
      self: "primo hermano del esposo",
    });
    // The husband of a father's first cousin; the other way, the son of a wife's first cousin.
    const sexes: Sex[] = ["male", "male", "female", "female", "female", "female", "male"];
    expect(along("UUUDDS", sexes).roles).toEqual({
      other: "esposo de una prima hermana del padre",
      self: "hijo del primo hermano de la esposa",
    });
    // A grandfather's wife.
    expect(along("UUS", ["female", "male", "male", "female"]).summary).toBe("esposa de un abuelo");
  });

  it("gives both forms when the relative's sex is not known, and «cónyuge» for a spouse's", () => {
    expect(along("UUDDS", males("UUDDS", { 1: "unknown", 2: "unknown", 3: "unknown", 4: "unknown" })).summary).toBe(
      "esposo de un primo hermano/una prima hermana",
    );
    expect(along("UUDDS", males("UUDDS", { 5: "unknown" })).summary).toBe("cónyuge de un primo hermano");
    expect(along("UUUDDS", males("UUUDDS", { 5: "unknown" })).summary).toBe(
      "esposo de un primo hermano/una prima hermana del padre",
    );
    expect(along("SDD", ["male", "unknown", "male", "unknown"]).summary).toBe("nieto/nieta del cónyuge");
  });
});

describe("the chain between two people", () => {
  it("names each step in Spanish", () => {
    // Both grandparents are common ancestors; with no birth years, grandpa comes first in `people`.
    expect(text("me", "cousin").main.chain.map((step) => step.text)).toEqual([
      "me Παπαδόπουλος",
      "padre: dad Παπαδόπουλος",
      "padre: grandpa Παπαδόπουλος",
      "hija: aunt Παπαδόπουλος",
      "hijo: cousin Παπαδόπουλος",
    ]);
    expect(text("me", "wifeSister").main.chain.map((step) => step.text)).toEqual([
      "me Παπαδόπουλος",
      "esposa: wife Παπαδόπουλος",
      "padre: inlawDad Παπαδόπουλος",
      "hija: wifeSister Παπαδόπουλος",
    ]);
  });

  it("gives both forms of each step when the sex is not known, but «cónyuge»", () => {
    expect([es.step("up", "unknown"), es.step("down", "unknown"), es.step("spouse", "unknown")]).toEqual([
      "padre/madre",
      "hijo/hija",
      "cónyuge",
    ]);
    expect(es.step("spouse", "male")).toBe("esposo");
  });
});

describe("the degree of a relationship", () => {
  const degree = (key: string) => along(key, "unknown").degree;

  it("is said as the Código Civil counts it, by blood or by marriage", () => {
    expect(degree("D")).toBe("Parentesco por consanguinidad en línea recta, de primer grado");
    expect(degree("UUD")).toBe("Parentesco por consanguinidad en línea colateral, de tercer grado");
    expect(degree("SU")).toBe("Parentesco por afinidad en línea recta, de primer grado");
    expect(degree("UUDDS")).toBe("Parentesco por afinidad en línea colateral, de cuarto grado");
    expect(degree("S")).toBeNull();
  });

  it("says the degree in words up to the twentieth, then in figures", () => {
    const collateral = (n: number) => es.degree({ degree: n, line: "collateral", kind: "blood" });
    expect(collateral(13)).toBe("Parentesco por consanguinidad en línea colateral, de decimotercer grado");
    expect(collateral(20)).toBe("Parentesco por consanguinidad en línea colateral, de vigésimo grado");
    expect([21, 22, 23].map(collateral)).toEqual([
      "Parentesco por consanguinidad en línea colateral, de 21.er grado",
      "Parentesco por consanguinidad en línea colateral, de 22.º grado",
      "Parentesco por consanguinidad en línea colateral, de 23.er grado",
    ]);
  });
});

describe("related only through marriages", () => {
  it("says which marriage joins them", () => {
    // A sister's husband's brother.
    const sexes: Sex[] = ["male", "unknown", "female", "male", "unknown", "male"];
    expect(along("UDSUD", sexes).summary).toBe(
      "Parentesco a través del matrimonio de p2 Παπαδόπουλος y p3 Παπαδόπουλος.",
    );
  });

  it("says which marriages join them", () => {
    const apart = along("SUDS", ["male", "female", "unknown", "male", "female"]);
    expect(apart.roles).toBeNull();
    expect(apart.summary).toBe(
      "Parentesco a través de los matrimonios de p0 Παπαδόπουλος y p1 Παπαδόπουλος; p3 Παπαδόπουλος y p4 Παπαδόπουλος.",
    );
  });
});

describe("related in more than one way", () => {
  it("finds that a couple were related before they married, and names their common ancestors", () => {
    expect(ties("c1", "c3", twice)).toEqual({
      main: "esposo",
      couple: true,
      others: [
        {
          name: "primo hermano",
          ancestors: expect.stringMatching(
            /^Antepasados comunes: (ma Παπαδόπουλος y pa|pa Παπαδόπουλος y ma) Παπαδόπουλος$/,
          ),
        },
      ],
    });
  });

  it("puts a relation by marriage with a name before a distant blood tie, with one common ancestor", () => {
    const { main, others } = text("me", "husband", village);
    expect(main.roles).toEqual({ other: "tío político", self: "sobrino político" });
    expect(others.map((tie) => [tie.summary, tie.commonAncestors])).toEqual([
      ["primo tercero del padre", "Antepasado común: old Παπαδόπουλος"],
    ]);
  });

  it("names no common ancestor when one of the two descends from the other", () => {
    const { main, others } = text("me", "old", tangled);
    expect(main.summary).toBe("tío político");
    expect(others.map((tie) => [tie.summary, tie.commonAncestors])).toEqual([["ascendiente de quinto grado", null]]);
  });

  it("lists three or more common ancestors with commas", () => {
    expect(es.commonAncestors(["A", "B", "C"])).toBe("Antepasados comunes: A, B y C");
  });
});
