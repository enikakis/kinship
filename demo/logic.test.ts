import { describe, expect, it } from "vitest";
import { fromGedcom } from "../src/gedcom";
import { createTree, relateAll, validateTree } from "../src/index";
import family from "./family.ged?raw";
import {
  capitalise,
  groupEveryone,
  parseHash,
  pickerLabels,
  preferredLanguage,
  rememberLast,
  resolvePerson,
  serialiseHash,
} from "./logic";

describe("the URL hash", () => {
  it("reads the two people and the language", () => {
    expect(parseHash("#from=I29&to=I14&lang=el")).toEqual({ from: "I29", to: "I14", lang: "el" });
    expect(parseHash("from=I29&to=I14&lang=en")).toEqual({ from: "I29", to: "I14", lang: "en" });
  });

  it("gives null for what is missing, empty or not a language on offer", () => {
    expect(parseHash("")).toEqual({ from: null, to: null, lang: null });
    expect(parseHash("#from=&to=I14&lang=it")).toEqual({ from: null, to: "I14", lang: null });
  });

  it("writes what it reads, escaping ids", () => {
    const state = { from: "a b&c", to: "Ι2", lang: "de" } as const;
    expect(serialiseHash(state)).toBe("#from=a+b%26c&to=%CE%992&lang=de");
    expect(parseHash(serialiseHash(state))).toEqual(state);
  });

  it("leaves out what is null", () => {
    expect(serialiseHash({ from: "I1", to: null, lang: null })).toBe("#from=I1");
    expect(serialiseHash({ from: null, to: null, lang: null })).toBe("");
  });
});

describe("the default language", () => {
  it("is the first of the visitor's languages on offer, else English", () => {
    expect(preferredLanguage(["it-IT", "el-GR", "en"])).toBe("el");
    expect(preferredLanguage(["DE"])).toBe("de");
    expect(preferredLanguage(["it", "ja"])).toBe("en");
    expect(preferredLanguage([])).toBe("en");
  });
});

describe("display forms", () => {
  it("capitalises the first letter only", () => {
    expect(capitalise("θείος (από γάμο)", "el")).toBe("Θείος (από γάμο)");
    expect(capitalise("first cousin once removed", "en")).toBe("First cousin once removed");
    expect(capitalise("", "en")).toBe("");
  });
});

describe("the person pickers", () => {
  const people = [
    { id: "I1", name: "Anna Petrou", born: 1950 },
    { id: "I2", name: "Anna Petrou", born: 1950 },
    { id: "I3", name: "Anna Petrou", born: 1980 },
    { id: "I4", name: "Kostas Petrou" },
  ];
  const labels = pickerLabels(people);
  const names = new Map(people.map((person) => [person.id, person.name]));

  it("labels each person by name and birth year, adding the id only when needed", () => {
    expect([...labels.values()]).toEqual([
      "Anna Petrou (1950) [I1]",
      "Anna Petrou (1950) [I2]",
      "Anna Petrou (1980)",
      "Kostas Petrou",
    ]);
  });

  it("finds a person by label, or by a label or name typed loosely", () => {
    expect(resolvePerson("Anna Petrou (1950) [I2]", labels, names)).toBe("I2");
    expect(resolvePerson("  anna petrou (1980) ", labels, names)).toBe("I3");
    expect(resolvePerson("kostas  PETROU", labels, names)).toBe("I4");
  });

  it("finds no one for an unknown or ambiguous text", () => {
    expect(resolvePerson("Anna Petrou", labels, names)).toBeNull();
    expect(resolvePerson("Maria", labels, names)).toBeNull();
    expect(resolvePerson("  ", labels, names)).toBeNull();
  });
});

describe("everyone, as seen from one person", () => {
  const input = fromGedcom(family);
  const tree = createTree(input, { born: (person) => person.born });
  // Lydia Vlastou (I29), in the demo's invented family.
  const groups = groupEveryone(relateAll(tree, "I29"));
  const ids = (key: string) => groups.find((group) => group.key === key)?.entries.map(({ id }) => id);

  it("groups by kind, closest first, then in the order of the tree", () => {
    expect(groups.map((group) => group.key)).toEqual(["ancestors", "descendants", "blood", "marriage", "unnamed"]);
    expect(ids("ancestors")).toEqual(["I18", "I22", "I6", "I11", "I1", "I2"]);
    expect(ids("descendants")).toEqual(["I38"]);
    // Brother, aunt; great-uncles and first cousins (4 steps); first cousins once removed (5);
    // second cousins (6).
    expect(ids("blood")).toEqual([
      ...["I30", "I17"],
      ...["I5", "I7", "I26", "I27"],
      ...["I15", "I16", "I19", "I36", "I37"],
      ...["I28", "I31", "I32"],
    ]);
    // Husband; uncle by marriage (Dimos, also her father's first cousin); then spouses of relatives.
    expect(ids("marriage")).toEqual(["I35", "I14", "I10", "I12", "I34", "I21", "I23", "I24"]);
    // Joined through marriage with no everyday name: one marriage in the middle of the chain
    // (I8, her uncle by marriage's mother) or several.
    expect(ids("unnamed")).toEqual(["I8", "I3", "I4", "I9", "I13", "I20", "I25", "I33"]);
  });

  it("puts everyone connected in exactly one group", () => {
    const all = groups.flatMap((group) => group.entries.map(({ id }) => id));
    expect(all).toHaveLength(input.people.length - 1);
    expect(new Set(all).size).toBe(all.length);
  });

  it("leaves out empty groups", () => {
    const keys = groupEveryone(relateAll(tree, "I38")).map((group) => group.key);
    expect(keys).not.toContain("descendants");
  });
});

describe("the sample family", () => {
  const input = fromGedcom(family);

  it("is a valid tree of 38 invented people", () => {
    expect(validateTree(input)).toEqual({ ok: true, issues: [] });
    expect(input.people).toHaveLength(38);
  });
});

describe("remembering the last answer", () => {
  it("computes again only when an argument changes", () => {
    const calls: string[] = [];
    const tree = { name: "a tree" };
    const other = { name: "another tree" };
    const everyone = rememberLast((t: { name: string }, id: string) => {
      calls.push(`${t.name}/${id}`);
      return [t.name, id];
    });
    const first = everyone(tree, "I1");
    expect(everyone(tree, "I1")).toBe(first);
    everyone(tree, "I2");
    everyone(other, "I2");
    everyone(other, "I2");
    expect(everyone(tree, "I1")).not.toBe(first);
    expect(calls).toEqual(["a tree/I1", "a tree/I2", "another tree/I2", "a tree/I1"]);
  });

  it("keeps the last two answers, so a swap and a swap back compute nothing", () => {
    const calls: string[] = [];
    const everyone = rememberLast((id: string) => {
      calls.push(id);
      return [id];
    }, 2);
    const first = everyone("I1");
    everyone("I2");
    expect(everyone("I1")).toBe(first);
    everyone("I2");
    expect(calls).toEqual(["I1", "I2"]);
    // A third person pushes out the one used least recently.
    everyone("I3");
    expect(everyone.has("I2")).toBe(true);
    expect(everyone.has("I1")).toBe(false);
    everyone("I1");
    expect(calls).toEqual(["I1", "I2", "I3", "I1"]);
  });

  it("tells whether an answer is remembered, without computing it", () => {
    const calls: string[] = [];
    const everyone = rememberLast((id: string) => calls.push(id));
    expect(everyone.has("I1")).toBe(false);
    everyone("I1");
    expect(everyone.has("I1")).toBe(true);
    expect(everyone.has("I2")).toBe(false);
    expect(calls).toEqual(["I1"]);
  });
});
