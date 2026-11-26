import { describe, expect, it } from "vitest";
import { fromGedcom } from "./gedcom";
import { describeRelation, relate, relateAll } from "./index";
import { el } from "./locales/el";
import { en } from "./locales/en";
import { toSvg } from "./svg";
import { readmeTree as tree } from "./testing/readme-family";

// Every output the README's "How it works", "Legal degree", `relateAll`, `toSvg` and `fromGedcom` sections show,
// so the README cannot drift from the code.
describe("the README's example family", () => {
  const annaLefteris = relate(tree, "anna", "lefteris")!;

  it("finds the uncle by marriage, and the longer blood chain as the other tie", () => {
    expect(annaLefteris.main.moves).toEqual(["up", "up", "down", "spouse"]);
    expect(annaLefteris.main.kind).toBe("uncleByMarriage");
    expect(annaLefteris.others[0]!.moves).toEqual(["up", "up", "up", "up", "down", "down", "down"]);

    const text = describeRelation(tree, annaLefteris, en);
    expect(text.main.summary).toBe("uncle by marriage");
    expect(text.others[0]!.summary).toBe("second cousin once removed");
    expect(text.others[0]!.commonAncestors).toBe("Common ancestors: Markos and Despina");
    expect(describeRelation(tree, annaLefteris, el).others[0]!.roles).toEqual({
      other: "δεύτερος εξάδελφος της μητέρας",
      self: "κόρη της δεύτερης εξαδέλφης",
    });
  });

  it("makes Katerina and Lefteris a couple who are also second cousins", () => {
    const couple = relate(tree, "katerina", "lefteris")!;
    expect(couple.couple).toBe(true);
    const text = describeRelation(tree, couple, en);
    expect(text.main.summary).toBe("husband");
    expect(text.others.map((tie) => [tie.summary, tie.commonAncestors])).toEqual([
      ["second cousin", "Common ancestors: Markos and Despina"],
    ]);
  });

  it("gives the same answer from the other end", () => {
    const text = describeRelation(tree, relate(tree, "lefteris", "anna")!, en);
    expect(text.main.roles).toEqual({ other: "niece by marriage", self: "uncle by marriage" });
    expect(text.others[0]!.summary).toBe("second cousin once removed");
  });

  it("counts the legal degree", () => {
    expect(describeRelation(tree, annaLefteris, en).main.degree).toBe(
      "Related by marriage (affinity) in the collateral line, 3rd degree",
    );
    expect(describeRelation(tree, annaLefteris, el).main.degree).toBe("Συγγένεια εξ αγχιστείας εκ πλαγίου, 3ου βαθμού");
  });

  it("names everyone as seen from Anna", () => {
    const rows = [...relateAll(tree, "anna")].map(([id, entry]) => [
      id,
      describeRelation(tree, { ...entry, others: [] }, en).main.summary,
      describeRelation(tree, { ...entry, others: [] }, el).main.summary,
    ]);
    expect(rows).toEqual([
      ["markos", "great-great-grandfather", "προ-προπάππους"],
      ["despina", "great-great-grandmother", "προ-προγιαγιά"],
      ["rena", "great-grandmother", "προγιαγιά"],
      ["ioannis", "great-great-uncle", "αδελφός της προγιαγιάς"],
      ["stelios", "grandfather", "παππούς"],
      ["sofia", "grandmother", "γιαγιά"],
      ["petros", "first cousin twice removed", "πρώτος εξάδελφος της γιαγιάς"],
      ["dafni", "mother", "μητέρα"],
      ["katerina", "aunt", "θεία"],
      ["lefteris", "uncle by marriage", "θείος (από γάμο)"],
    ]);
  });

  it("draws the chain as an SVG", () => {
    const text = describeRelation(tree, annaLefteris, en);
    const svg = toSvg(annaLefteris.main.diagram, { roles: text.main.roles, title: text.main.summary });
    expect(svg).toContain(">uncle by marriage</title>");
    expect(svg).toContain(
      ">Anna (niece by marriage) → Dafni → Stelios → Katerina → Lefteris (uncle by marriage)</desc>",
    );
  });
});

describe("the README's GEDCOM example", () => {
  it("gives what the README shows", () => {
    const text = [
      "0 HEAD",
      "1 GEDC",
      "2 VERS 5.5.1",
      "0 @I1@ INDI",
      "1 NAME Sofia /Andreou/",
      "1 SEX F",
      "1 BIRT",
      "2 DATE ABT 1890",
      "2 PLAC Chania",
      "1 DEAT",
      "2 DATE 1961",
      "0 @I2@ INDI",
      "1 NAME Dafni /Andreou/",
      "1 SEX F",
      "1 BIRT",
      "2 DATE 3 MAY 1921",
      "0 @I3@ INDI",
      "1 NAME Pavlos /Andreou/",
      "1 SEX M",
      "0 @F1@ FAM",
      "1 HUSB @I3@",
      "1 WIFE @I1@",
      "1 MARR",
      "2 DATE 1919",
      "2 PLAC Chania",
      "1 CHIL @I2@",
      "0 TRLR",
    ].join("\n");
    expect(fromGedcom(text)).toEqual({
      people: [
        {
          id: "I1",
          sex: "female",
          name: "Sofia Andreou",
          given: "Sofia",
          surname: "Andreou",
          born: 1890,
          died: 1961,
          birthPlace: "Chania",
        },
        { id: "I2", sex: "female", name: "Dafni Andreou", given: "Dafni", surname: "Andreou", born: 1921 },
        { id: "I3", sex: "male", name: "Pavlos Andreou", given: "Pavlos", surname: "Andreou" },
      ],
      parents: [
        ["I3", "I2"],
        ["I1", "I2"],
      ],
      unions: [{ a: "I3", b: "I1", married: 1919, place: "Chania" }],
    });
  });
});
