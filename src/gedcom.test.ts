import { describe, expect, it } from "vitest";
import { describeRelation } from "./describe";
import { fromGedcom } from "./gedcom";
import { en } from "./locales/en";
import { relate } from "./relate";
import { sampleGedcom } from "./testing/sample-gedcom";
import { createTree } from "./tree";

const one = (lines: string[]) => fromGedcom(["0 @I1@ INDI", ...lines].join("\n")).people[0]!;

it("reads the name without slashes, with spaces collapsed", () => {
  expect(one(["1 NAME Maria /Ioannou/"]).name).toBe("Maria Ioannou");
  expect(one(["1 NAME  Ioannis  Petros /Ioannou/ Jr"]).name).toBe("Ioannis Petros Ioannou Jr");
  expect(one(["1 NAME /Ioannou/"]).name).toBe("Ioannou");
});

it("uses the first usable NAME only, and the id when there is none", () => {
  expect(one(["1 NAME A /B/", "1 NAME C /D/"]).name).toBe("A B");
  expect(one(["1 NAME //", "1 NAME C /D/", "1 NAME E /F/"]).name).toBe("C D");
  expect(one(["1 SEX M"]).name).toBe("I1");
  expect(one(["1 NAME //"]).name).toBe("I1");
});

it("reads SEX as male, female or unknown", () => {
  expect(one(["1 SEX M"]).sex).toBe("male");
  expect(one(["1 SEX F"]).sex).toBe("female");
  expect(one(["1 SEX X"]).sex).toBe("unknown");
  expect(one(["1 SEX U"]).sex).toBe("unknown");
  expect(one([]).sex).toBe("unknown");
});

it("takes the birth year from the first 3-4 digit number in DATE", () => {
  const born = (date: string) => one(["1 BIRT", `2 DATE ${date}`]).born;
  expect(born("1850")).toBe(1850);
  expect(born("ABT 1850")).toBe(1850);
  expect(born("12 MAR 1850")).toBe(1850);
  expect(born("BET 1850 AND 1860")).toBe(1850);
  expect(born("1850/51")).toBe(1850);
  expect(born("ABT 950")).toBe(950);
});

it("takes a year only from a 3-4 digit number bounded by non-digits", () => {
  const born = (date: string) => one(["1 BIRT", `2 DATE ${date}`]).born;
  expect(born("12345")).toBeUndefined();
  expect(born("ABT 12345 OR 1850")).toBe(1850);
  expect(born("1850s")).toBe(1850);
});

describe("calendars", () => {
  const born = (date: string) => one(["1 BIRT", `2 DATE ${date}`]).born;

  it("leaves born out for a GEDCOM 5.5.1 Hebrew date", () => {
    expect(born("@#DHEBREW@ 5610")).toBeUndefined();
  });

  it("leaves born out for a GEDCOM 7 Hebrew date", () => {
    expect(born("HEBREW 5610")).toBeUndefined();
  });

  it("leaves born out for a French Republican date", () => {
    expect(born("@#DFRENCH R@ 11")).toBeUndefined();
    expect(born("FRENCH_R 1 VEND 0011")).toBeUndefined();
  });

  it("leaves born out for a year B.C.", () => {
    expect(born("500 B.C.")).toBeUndefined();
  });

  it("leaves born out for a year BCE", () => {
    expect(born("500 BCE")).toBeUndefined();
  });

  it("leaves born out for a year BC", () => {
    expect(born("500 BC")).toBeUndefined();
  });

  it("keeps Gregorian and Julian dates", () => {
    expect(born("@#DGREGORIAN@ 12 MAR 1850")).toBe(1850);
    expect(born("GREGORIAN 1850")).toBe(1850);
    expect(born("@#DJULIAN@ 1700")).toBe(1700);
    expect(born("JULIAN 1700")).toBe(1700);
    expect(born("ABT 1850")).toBe(1850);
    expect(born("BEF 1850")).toBe(1850);
  });
});

it("ignores a DATE inside a citation under BIRT", () => {
  expect(one(["1 BIRT", "2 SOUR @S1@", "3 DATA", "4 DATE 1700"])).not.toHaveProperty("born");
});

it("uses the first usable BIRT DATE", () => {
  expect(one(["1 BIRT", "2 DATE unknown", "1 BIRT", "2 DATE 1850", "1 BIRT", "2 DATE 1860"]).born).toBe(1850);
});

it("ignores a GEDCOM 7 @VOID@ pointer", () => {
  const text = "0 @I1@ INDI\n0 @I3@ INDI\n0 @F1@ FAM\n1 HUSB @VOID@\n1 WIFE @I1@\n1 CHIL @I3@\n1 CHIL @VOID@";
  const input = fromGedcom(text);
  expect(input.unions).toEqual([]);
  expect(input.parents).toEqual([["I1", "I3"]]);
});

it("reads @@ in a name as a single @", () => {
  expect(one(["1 NAME Ann /O@@Neil/"]).name).toBe("Ann O@Neil");
});

it("leaves born out when there is no usable date", () => {
  expect(one(["1 BIRT", "2 PLAC Somewhere"])).not.toHaveProperty("born");
  expect(one(["1 BIRT", "2 DATE unknown"])).not.toHaveProperty("born");
  expect(one([])).not.toHaveProperty("born");
});

it("ignores a DATE that is not under BIRT", () => {
  expect(one(["1 DEAT", "2 DATE 1990"])).not.toHaveProperty("born");
  expect(one(["1 BIRT", "1 DEAT", "2 DATE 1990"])).not.toHaveProperty("born");
});

it("reads a family with both partners as a union and parent links from each", () => {
  const text = "0 @I1@ INDI\n0 @I2@ INDI\n0 @I3@ INDI\n0 @F1@ FAM\n1 HUSB @I1@\n1 WIFE @I2@\n1 CHIL @I3@";
  const input = fromGedcom(text);
  expect(input.unions).toEqual([{ a: "I1", b: "I2" }]);
  expect(input.parents).toEqual([
    ["I1", "I3"],
    ["I2", "I3"],
  ]);
});

it("reads a family with one partner as parent links only", () => {
  const input = fromGedcom("0 @I1@ INDI\n0 @I3@ INDI\n0 @F1@ FAM\n1 WIFE @I1@\n1 CHIL @I3@");
  expect(input.unions).toEqual([]);
  expect(input.parents).toEqual([["I1", "I3"]]);
});

it("keeps a CHIL that points at a missing person; createTree skips it", () => {
  const input = fromGedcom("0 @I1@ INDI\n0 @F1@ FAM\n1 HUSB @I1@\n1 CHIL @I9@");
  expect(input.parents).toEqual([["I1", "I9"]]);
  expect(createTree(input).children("I1")).toEqual([]);
});

it("strips a BOM and accepts \\n, \\r\\n and \\r line ends, blank lines and leading spaces", () => {
  for (const eol of ["\n", "\r\n", "\r"]) {
    const text = `\uFEFF0 HEAD${eol}${eol}  0 @I1@ INDI${eol}   1 NAME A /B/${eol}${eol}0 TRLR${eol}`;
    expect(fromGedcom(text).people).toEqual([{ id: "I1", sex: "unknown", name: "A B" }]);
  }
});

it("ignores unknown tags, CONC and CONT", () => {
  const text = ["0 @I1@ INDI", "1 NAME A /B/", "2 CONC C", "1 NOTE x", "2 CONT y", "1 _CUSTOM z", "1 SEX F"].join("\n");
  expect(fromGedcom(text).people).toEqual([{ id: "I1", sex: "female", name: "A B" }]);
});

it("reads a GEDCOM 7 file", () => {
  const text = "0 HEAD\n1 GEDC\n2 VERS 7.0\n0 @I1@ INDI\n1 NAME Ann /Lee/\n1 SEX F\n0 TRLR";
  expect(fromGedcom(text).people).toEqual([{ id: "I1", sex: "female", name: "Ann Lee" }]);
});

it("never throws on malformed lines", () => {
  const text = "garbage\n\n0\nx y\n0 @I1@ INDI\n1\n1 NAME\n@@ @@\n0 @F1@ FAM\n1 CHIL\n1 HUSB bad\n9 TRLR";
  expect(() => fromGedcom(text)).not.toThrow();
  expect(fromGedcom(text).people.map((p) => p.id)).toEqual(["I1"]);
});

it("gives an empty input for an empty string", () => {
  expect(fromGedcom("")).toEqual({ people: [], parents: [], unions: [] });
});

it("keeps people in file order", () => {
  expect(fromGedcom("0 @B@ INDI\n0 @A@ INDI").people.map((p) => p.id)).toEqual(["B", "A"]);
});

const tree = createTree(fromGedcom(sampleGedcom), { born: (p) => p.born });
const role = (from: string, to: string) => describeRelation(tree, relate(tree, from, to)!, en).main.roles?.other;

it("reads the sample file", () => {
  expect(tree.byId.size).toBe(20);
  expect(tree.byId.get("I1")).toEqual({ id: "I1", sex: "male", name: "Nikolaos Ioannou", born: 1900 });
  expect(tree.byId.get("I20")).toEqual({ id: "I20", sex: "unknown", name: "I20" });
});

it("names a first cousin, an aunt by marriage and a step-parent from the sample", () => {
  expect(role("I9", "I7")).toBe("first cousin");
  expect(role("I9", "I5")).toBe("aunt by marriage");
  expect(role("I13", "I12")).toBe("stepmother");
});
