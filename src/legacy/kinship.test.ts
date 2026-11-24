import { describe, expect, it } from "vitest";
import { relationReport } from "./kinship";
import type { Locale } from "./locale";
import { indexTree, type Tree, type TreeIndex, type TreePerson } from "./tree";

const person = (id: string, sex: TreePerson["sex"]): TreePerson => ({
  id,
  given_name: id,
  surname: "Παπαδόπουλος",
  sex,
  living: false,
});

/*
 *        grandpa ═ grandma                     inlawDad ═ inlawMom
 *          │                                       │
 *   ┌──────┴───────┐                         ┌─────┴──────┐
 *  dad ═ mom     aunt ═ uncle              wife        wifeSister ═ wifeSisterHusband
 *   │              │                         ║
 *  me, sis       cousin ═ cousinWife         ╚═ me
 *                  │
 *               cousinKid
 *
 * dad also has `half` with `otherMom`, and `onlyDad`, whose mother is not recorded.
 */
const tree: Tree = {
  people: [
    person("grandpa", "male"),
    person("grandma", "female"),
    person("dad", "male"),
    person("mom", "female"),
    person("otherMom", "female"),
    person("aunt", "female"),
    person("uncle", "male"),
    person("me", "male"),
    person("sis", "female"),
    person("half", "female"),
    person("onlyDad", "female"),
    person("cousin", "male"),
    person("cousinWife", "female"),
    person("cousinKid", "female"),
    person("wife", "female"),
    person("inlawDad", "male"),
    person("inlawMom", "female"),
    person("wifeSister", "female"),
    person("wifeSisterHusband", "male"),
    person("stranger", "unknown"),
  ],
  parents: [
    ["grandpa", "dad"],
    ["grandma", "dad"],
    ["grandpa", "aunt"],
    ["grandma", "aunt"],
    ["dad", "me"],
    ["mom", "me"],
    ["dad", "sis"],
    ["mom", "sis"],
    ["dad", "half"],
    ["otherMom", "half"],
    ["dad", "onlyDad"],
    ["aunt", "cousin"],
    ["uncle", "cousin"],
    ["cousin", "cousinKid"],
    ["inlawDad", "wife"],
    ["inlawMom", "wife"],
    ["inlawDad", "wifeSister"],
    ["inlawMom", "wifeSister"],
  ],
  unions: [
    { id: "u1", a: "grandpa", b: "grandma" },
    { id: "u2", a: "dad", b: "mom" },
    { id: "u3", a: "aunt", b: "uncle" },
    { id: "u4", a: "me", b: "wife" },
    { id: "u5", a: "cousin", b: "cousinWife" },
    { id: "u6", a: "wifeSister", b: "wifeSisterHusband" },
  ],
};
const index = indexTree(tree);

const report = (from: string, to: string, locale: Locale = "el", within: TreeIndex = index) =>
  relationReport(within, from, to, locale)!;

/** What `to` is to `from`, and what `from` is to `to`. */
const roles = (from: string, to: string, locale: Locale = "el") => report(from, to, locale).main.roles;

/**
 * A line of people p0, p1… linked by `key`: U up to a parent, D down to a child, S to a spouse,
 * with their sexes in order. The report is what the last one is to the first.
 */
function line(key: string, sexes: TreePerson["sex"][] | TreePerson["sex"], locale: Locale = "el") {
  const all = typeof sexes === "string" ? [...Array(key.length).fill("unknown"), sexes] : sexes;
  const id = (i: number) => `p${i}`;
  const chain: Tree = { people: all.map((sex, i) => person(id(i), sex)), parents: [], unions: [] };
  [...key].forEach((move, i) => {
    if (move === "U") chain.parents.push([id(i + 1), id(i)]);
    if (move === "D") chain.parents.push([id(i), id(i + 1)]);
    if (move === "S") chain.unions.push({ id: `u${i}`, a: id(i), b: id(i + 1) });
  });
  return report(id(0), id(key.length), locale, indexTree(chain)).main;
}

describe("the chain between two people", () => {
  it("is the shortest one, through parents, children and marriages", () => {
    const { chain } = report("me", "cousin").main;
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
    expect(report("me", "sis").main.chain.map((step) => step.text)).toEqual([
      "me Παπαδόπουλος",
      expect.stringMatching(/^(πατέρας: dad|μητέρα: mom) Παπαδόπουλος$/),
      "κόρη: sis Παπαδόπουλος",
    ]);
  });

  it("names each step in English too", () => {
    expect(report("me", "wifeSister", "en").main.chain.map((step) => step.text)).toEqual([
      "me Παπαδόπουλος",
      "wife: wife Παπαδόπουλος",
      expect.stringMatching(/^(father: inlawDad|mother: inlawMom) Παπαδόπουλος$/),
      "daughter: wifeSister Παπαδόπουλος",
    ]);
  });

  it("is missing for people who are not connected, or for the same person", () => {
    expect(relationReport(index, "me", "stranger", "el")).toBeNull();
    expect(relationReport(index, "me", "me", "el")).toBeNull();
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
    expect(roles("half", "me", "en")).toEqual({ other: "half-brother", self: "half-sister" });
  });

  it("does not call siblings half-siblings when one's other parent is unknown", () => {
    expect(roles("me", "onlyDad")).toEqual({ other: "αδελφή", self: "αδελφός" });
    expect(roles("onlyDad", "me")).toEqual({ other: "αδελφός", self: "αδελφή" });
    expect(roles("onlyDad", "half", "en")).toEqual({ other: "sister", self: "sister" });
  });

  it("names the usual relations by marriage", () => {
    expect(roles("me", "wife")).toEqual({ other: "σύζυγος", self: "σύζυγος" });
    expect(roles("wife", "dad")).toEqual({ other: "πεθερός", self: "νύφη" });
    expect(roles("me", "wifeSister")).toEqual({ other: "κουνιάδα", self: "κουνιάδος" });
    expect(roles("me", "wifeSisterHusband")).toEqual({ other: "μπατζανάκης", self: "μπατζανάκης" });
    expect(roles("dad", "inlawMom")).toEqual({ other: "συμπεθέρα", self: "συμπέθερος" });
    expect(roles("me", "uncle")).toEqual({ other: "θείος (από γάμο)", self: "ανιψιός (από γάμο)" });
    expect(roles("wife", "dad", "en")).toEqual({ other: "father-in-law", self: "daughter-in-law" });
  });

  it("names other relatives by marriage through the blood relative, as the law counts them", () => {
    // me → cousin's wife: up, up, down, down, spouse.
    expect(roles("me", "cousinWife")).toEqual({
      other: "σύζυγος του πρώτου εξαδέλφου",
      self: "πρώτος εξάδελφος του συζύγου",
    });
    expect(roles("me", "cousinWife", "en")).toEqual({
      other: "wife of a first cousin",
      self: "husband's first cousin",
    });
    // The husband of a father's first cousin; the other way, the son of a wife's first cousin.
    const sexes: TreePerson["sex"][] = ["male", "male", "female", "female", "female", "female", "male"];
    expect(line("UUUDDS", sexes).roles).toEqual({
      other: "σύζυγος της πρώτης εξαδέλφης του πατέρα",
      self: "γιος του πρώτου εξαδέλφου της συζύγου",
    });
    expect(line("UUUDDS", sexes, "en").roles).toEqual({
      other: "husband of a first cousin once removed",
      self: "wife's first cousin once removed",
    });
    expect(line("UUS", ["female", "male", "male", "female"]).summary).toBe("σύζυγος του παππού");
    expect(line("SDD", ["male", "female", "male", "unknown"]).summary).toBe("εγγόνι της συζύγου");
  });

  it("has no name through a marriage in the middle, and says which marriages join them", () => {
    // Two women married to brothers have a name; a man and a woman do not.
    expect(line("SUDS", ["female", "male", "unknown", "male", "female"]).roles?.other).toBe("συννυφάδα");
    const apart = line("SUDS", ["male", "female", "unknown", "male", "female"]);
    expect(apart.roles).toBeNull();
    expect(apart.summary).toBe(
      "Συγγενεύουν μέσα από τους γάμους: p0 Παπαδόπουλος και p1 Παπαδόπουλος· p3 Παπαδόπουλος και p4 Παπαδόπουλος.",
    );
    // A sister's husband's brother.
    const sexes: TreePerson["sex"][] = ["male", "unknown", "female", "male", "unknown", "male"];
    expect(line("UDSUD", sexes).summary).toBe("Συγγενεύουν μέσα από τον γάμο: p2 Παπαδόπουλος και p3 Παπαδόπουλος.");
    expect(line("UDSUD", sexes, "en").summary).toBe("Related through the marriage of p2 Παπαδόπουλος and p3 Παπαδόπουλος.");
  });

  it("names far ancestors and descendants", () => {
    expect(line("UUUU", "female").summary).toBe("προ-προγιαγιά");
    expect(line("UUUUU", "male").summary).toBe("προ-προ-προπάππους");
    expect(line("UUUUUU", "male").summary).toBe("πρόγονος 6ης γενιάς");
    expect(line("DDDD", "female").summary).toBe("τρισέγγονη");
    expect(line("DDDDD", "male").summary).toBe("απόγονος 5ης γενιάς");
    expect(line("UUUU", "male", "en").summary).toBe("great-great-grandfather");
    expect(line("UUUUU", "female", "en").summary).toBe("3rd great-grandmother");
    expect(line("DDDDDD", "female", "en").summary).toBe("4th great-granddaughter");
  });

  it("names cousins by degree, and relatives of other generations through one of their own", () => {
    expect(line("UUUDDD", "female").summary).toBe("δεύτερη εξαδέλφη");
    // A parent's first cousin; a first cousin's child.
    expect(line("UUUDD", ["male", "female", "male", "male", "male", "male"]).summary).toBe(
      "πρώτος εξάδελφος της μητέρας",
    );
    expect(line("UUDDD", ["male", "male", "male", "female", "female", "female"]).summary).toBe(
      "κόρη της πρώτης εξαδέλφης",
    );
    // A grandparent's sister; a grandfather's second cousin.
    expect(line("UUUD", ["male", "female", "female", "male", "female"]).summary).toBe("αδελφή της γιαγιάς");
    expect(line("UUUUUDDD", ["male", "male", "male", "male", "male", "male", "male", "male", "male"]).summary).toBe(
      "δεύτερος εξάδελφος του παππού",
    );
    // A brother's grandson; a sister's great-granddaughter.
    expect(line("UDDD", ["male", "male", "male", "female", "male"]).summary).toBe("εγγονός του αδελφού");
    expect(line("UDDDD", ["male", "male", "female", "male", "male", "female"]).summary).toBe("δισέγγονη της αδελφής");
    // Without the sexes along the way, both words.
    expect(line("UUUD", "male").summary).toBe("αδελφός του παππού/της γιαγιάς");
    expect(line("UUUDD", "male").summary).toBe("πρώτος εξάδελφος του γονιού");
  });

  it("names both people of a chain, each from their side", () => {
    // A great-uncle and his grand-nephew.
    expect(line("UUUD", ["male", "male", "female", "male", "male"]).roles).toEqual({
      other: "αδελφός της γιαγιάς",
      self: "εγγονός της αδελφής",
    });
  });

  it("speaks the standard English terms", () => {
    expect(line("UUUDD", "male", "en").summary).toBe("first cousin once removed");
    expect(line("UUUUDD", "female", "en").summary).toBe("first cousin twice removed");
    expect(line("UUUDDD", "female", "en").summary).toBe("second cousin");
    expect(line("UUUD", "male", "en").summary).toBe("great-uncle");
    expect(line("UUUUD", "female", "en").summary).toBe("great-great-aunt");
    expect(line("UDDD", "female", "en").summary).toBe("great-niece");
    expect(line("DSU", "male", "en").summary).toBe("child's father-in-law");
  });

  it("names step-parents and step-children, and uncles by marriage on either side", () => {
    expect(line("US", "female").summary).toBe("μητριά");
    expect(line("US", "male").summary).toBe("πατριός");
    expect(line("SD", "female").summary).toBe("προγονή");
    expect(line("SD", "male", "en").summary).toBe("stepson");
    // A wife's uncle; a niece's husband.
    expect(line("SUUD", "male").summary).toBe("θείος (από γάμο)");
    expect(line("UDDS", "male").summary).toBe("ανιψιός (από γάμο)");
  });
});

describe("the degree of a relationship", () => {
  const degree = (key: string, locale: Locale = "el") => line(key, "unknown", locale).degree;

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

  it("is said in English too", () => {
    expect(degree("D", "en")).toBe("Related by blood in the direct line, 1st degree");
    expect(degree("UU", "en")).toBe("Related by blood in the direct line, 2nd degree");
    expect(degree("UUD", "en")).toBe("Related by blood in the collateral line, 3rd degree");
    expect(degree("UUDDS", "en")).toBe("Related by marriage (affinity) in the collateral line, 4th degree");
  });
});

describe("the chain as a small tree", () => {
  /** Each person of the chain with their row and lane, in chain order. */
  const layout = (from: string, to: string) =>
    report(from, to).main.diagram.nodes.map((node) => [
      node.person.id.replace(/^grand(pa|ma)$/, "grandparent").replace(/^inlaw(Dad|Mom)$/, "inlawParent"),
      node.row,
      node.lane,
    ]);

  it("stands each line of ancestors straight, with the common ancestor above both", () => {
    expect(layout("me", "cousinKid")).toEqual([
      ["me", 2, 0],
      ["dad", 1, 0],
      ["grandparent", 0, 0.5],
      ["aunt", 1, 1],
      ["cousin", 2, 1],
      ["cousinKid", 3, 1],
    ]);
  });

  it("keeps spouses side by side in one row", () => {
    const { diagram } = report("me", "wifeSisterHusband").main;
    expect(layout("me", "wifeSisterHusband")).toEqual([
      ["me", 1, 0],
      ["wife", 1, 1],
      ["inlawParent", 0, 1.5],
      ["wifeSister", 1, 2],
      ["wifeSisterHusband", 1, 3],
    ]);
    expect([diagram.rows, diagram.lanes]).toEqual([2, 4]);
    expect(diagram.links.map((link) => link.kind)).toEqual(["spouse", "parent", "parent", "spouse"]);
  });

  it("puts a straight line of descent in one lane", () => {
    expect(layout("grandpa", "me")).toEqual([
      ["grandparent", 0, 0],
      ["dad", 1, 0],
      ["me", 2, 0],
    ]);
  });

  it("marks the two people with what each is to the other", () => {
    expect(report("me", "aunt").main.diagram.ends).toEqual([
      { id: "me", role: "ανιψιός" },
      { id: "aunt", role: "θεία" },
    ]);
    expect(line("UDSUD", ["male", "unknown", "female", "male", "unknown", "male"]).diagram.ends).toEqual([
      { id: "p0", role: null },
      { id: "p5", role: null },
    ]);
  });
});

describe("related in more than one way", () => {
  /*
   * Two brothers (b1, b2, sons of pa and ma) married two sisters (s1, s2, daughters of qa and qb):
   * their children c1 and c2 are cousins twice over. c3, a son of b2 from another marriage, married
   * his first cousin c1.
   */
  const twice: Tree = {
    people: [
      person("pa", "male"),
      person("ma", "female"),
      person("qa", "male"),
      person("qb", "female"),
      person("b1", "male"),
      person("b2", "male"),
      person("s1", "female"),
      person("s2", "female"),
      person("c1", "female"),
      person("c2", "female"),
      person("c3", "male"),
    ],
    parents: [
      ["pa", "b1"],
      ["ma", "b1"],
      ["pa", "b2"],
      ["ma", "b2"],
      ["qa", "s1"],
      ["qb", "s1"],
      ["qa", "s2"],
      ["qb", "s2"],
      ["b1", "c1"],
      ["s1", "c1"],
      ["b2", "c2"],
      ["s2", "c2"],
      ["b2", "c3"],
    ],
    unions: [
      { id: "u1", a: "pa", b: "ma" },
      { id: "u2", a: "qa", b: "qb" },
      { id: "u3", a: "b1", b: "s1" },
      { id: "u4", a: "b2", b: "s2" },
      // First cousins who married.
      { id: "u5", a: "c1", b: "c3" },
    ],
  };
  const twiceIndex = indexTree(twice);
  const ties = (a: string, b: string, locale: Locale = "el") => {
    const { main, others, couple } = report(a, b, locale, twiceIndex);
    return {
      main: main.summary,
      couple,
      others: others.map((tie) => ({ name: tie.summary, ancestors: tie.commonAncestors })),
    };
  };

  it("finds the second way two double cousins are related, through the other grandparents", () => {
    // c2 is also c1's sister-in-law (her husband's sister), a shorter chain with a name; but a
    // first cousin is a closer tie, so blood comes first.
    const { main, others } = report("c1", "c2", "el", twiceIndex);
    expect(main.roles).toEqual({ other: "πρώτη εξαδέλφη", self: "πρώτη εξαδέλφη" });
    const throughPaternal = /: (pa|ma) Παπαδόπουλος$/.test(main.chain[2].text);
    expect(others.map((tie) => [tie.summary, tie.commonAncestors])).toEqual([
      [
        "πρώτη εξαδέλφη",
        throughPaternal ? "Κοινοί πρόγονοι: qa Παπαδόπουλος και qb Παπαδόπουλος" : "Κοινοί πρόγονοι: ma Παπαδόπουλος και pa Παπαδόπουλος",
      ],
    ]);
    expect(others[0].chain.map((step) => step.id)).toEqual(
      throughPaternal
        ? ["c1", "s1", expect.stringMatching(/^q/), "s2", "c2"]
        : ["c1", "b1", expect.any(String), "b2", "c2"],
    );
  });

  it("finds that a couple were related before they married", () => {
    expect(ties("c1", "c3")).toEqual({
      main: "σύζυγος",
      couple: true,
      others: [{ name: "πρώτος εξάδελφος", ancestors: "Κοινοί πρόγονοι: ma Παπαδόπουλος και pa Παπαδόπουλος" }],
    });
    expect(ties("c1", "c3", "en")).toEqual({
      main: "husband",
      couple: true,
      others: [{ name: "first cousin", ancestors: "Common ancestors: ma Παπαδόπουλος and pa Παπαδόπουλος" }],
    });
  });

  it("puts an old common ancestor before a closer chain through the children of a marriage", () => {
    /*
     * old has two lines. On one, gm's son u (my mother's brother) married a (your father's sister),
     * a daughter of gf on the other line. Their child k is a cousin to both of us. Going down to k and
     * up again is shorter than going up to old, but only a marriage links us there, not blood.
     * (Their marriage itself is not recorded, as in much of the imported data.)
     */
    const ids = ["old", "l1", "r1", "l2", "r2", "gm", "gf", "mom", "u", "a", "dad", "k", "me", "you"];
    const families: Tree = {
      people: ids.map((id) => person(id, "unknown")),
      parents: [
        ["old", "l1"],
        ["old", "r1"],
        ["l1", "l2"],
        ["r1", "r2"],
        ["l2", "gm"],
        ["r2", "gf"],
        ["gm", "mom"],
        ["gm", "u"],
        ["gf", "a"],
        ["gf", "dad"],
        ["u", "k"],
        ["a", "k"],
        ["mom", "me"],
        ["dad", "you"],
      ],
      // Their marriage is not recorded: only their child links them.
      unions: [],
    };
    const { main, others } = report("me", "you", "el", indexTree(families));
    expect(main.chain.map((step) => step.id)).toEqual([
      "me",
      "mom",
      "gm",
      "l2",
      "l1",
      "old",
      "r1",
      "r2",
      "gf",
      "dad",
      "you",
    ]);
    expect(main.summary).toBe("τέταρτος εξάδελφος/εξαδέλφη");
    expect(others).toEqual([]);
  });

  /*
   * My aunt married a man who, as often in a village, is also my distant cousin: old is an
   * ancestor of my grandfather (3 generations up) and of the husband (4 generations up). He is
   * first of all my uncle by marriage; the blood tie comes after it.
   */
  const village = indexTree({
    people: ["old", "l1", "l2", "r1", "r2", "r3", "grandpa", "dad", "aunt", "husband", "me"].map((id) =>
      person(id, id === "aunt" ? "female" : "male"),
    ),
    parents: [
      ["old", "l1"],
      ["l1", "l2"],
      ["l2", "grandpa"],
      ["old", "r1"],
      ["r1", "r2"],
      ["r2", "r3"],
      ["r3", "husband"],
      ["grandpa", "dad"],
      ["grandpa", "aunt"],
      ["dad", "me"],
    ],
    unions: [{ id: "u1", a: "aunt", b: "husband" }],
  });

  it("puts a relation by marriage with a name before a distant blood tie", () => {
    const { main, others, couple } = report("me", "husband", "el", village);
    expect(main.roles).toEqual({ other: "θείος (από γάμο)", self: "ανιψιός (από γάμο)" });
    expect(couple).toBe(false);
    expect(others.map((tie) => [tie.summary, tie.commonAncestors])).toEqual([
      ["τρίτος εξάδελφος του πατέρα", "Κοινός πρόγονος: old Παπαδόπουλος"],
    ]);
    expect(report("me", "husband", "en", village).others[0].commonAncestors).toBe("Common ancestor: old Παπαδόπουλος");
    // The other way round too: I am his nephew by marriage first.
    const back = report("husband", "me", "el", village);
    expect(back.main.summary).toBe("ανιψιός (από γάμο)");
    expect(back.others).toHaveLength(1);
  });

  it("names no common ancestor when one of the two descends from the other", () => {
    // My aunt's husband is also my ancestor, five generations up, as a mistake in the data (two
    // namesakes merged into one) can say. He is my uncle by marriage first.
    const tangled = indexTree({
      people: ["old", "l1", "l2", "grandpa", "dad", "aunt", "me"].map((id) =>
        person(id, id === "aunt" ? "female" : "male"),
      ),
      parents: [
        ["old", "l1"],
        ["l1", "l2"],
        ["l2", "grandpa"],
        ["grandpa", "dad"],
        ["grandpa", "aunt"],
        ["dad", "me"],
      ],
      unions: [{ id: "u1", a: "aunt", b: "old" }],
    });
    const { main, others } = report("me", "old", "el", tangled);
    expect(main.summary).toBe("θείος (από γάμο)");
    expect(others.map((tie) => [tie.summary, tie.commonAncestors])).toEqual([["προ-προ-προπάππους", null]]);
  });

  it("finds nothing more for people related in one way only", () => {
    expect(ties("c2", "c3").others).toEqual([]);
    expect(report("me", "cousin").others).toEqual([]);
    expect(report("me", "half").others).toEqual([]);
    expect(report("me", "wifeSister").others).toEqual([]);
  });
});
