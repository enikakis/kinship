import type { Locale } from "./locale";
import { BLOOD, lastOf, movesKey, reverseMoves, type Chain } from "../chain";
import { findRelationships } from "../choose";
import { marriageKind } from "../classify";
import { chainDiagram, type ConnectionDiagram as NewDiagram } from "../diagram";
import { legalDegree, type LegalDegree } from "../degree";
import type { BloodTie } from "../ties";
import type { Move } from "../types";
import { fullName, type Sex, type TreeIndex, type TreePerson } from "./tree";

/** The chain of this module's people. */
type Connection = Chain<TreePerson>;

/*
 * How two people of the tree are related: the shortest chain of parents, children and marriages
 * between them, the other ways they are related by blood, and all of it put into words, in Greek
 * or English. `relationReport` is the whole interface: the page only shows what it returns.
 */

/* ---------- The report ---------- */

/** One way two people are related, in words and drawn as a small tree. */
export type Relationship = {
  /**
   * What the second person is to the first (`other`) and the first to the second (`self`), e.g.
   * «θεία» and «ανιψιός». Null for chains with no everyday name (distant relations by marriage).
   */
  roles: { other: string; self: string } | null;
  /** The relationship in a line: what the second person is to the first or, with no name for it, how far apart they are. */
  summary: string;
  /** The degree as the law counts it, e.g. «Συγγένεια εξ αίματος εκ πλαγίου, 3ου βαθμού»; null when it counts none. */
  degree: string | null;
  /** The chain as text, in its order: the first person's name, then each step, e.g. «πατέρας: Αντώνης Παπαδόπουλος». */
  chain: { id: string; text: string }[];
  diagram: ConnectionDiagram;
};

/** A blood tie besides the main relationship, through its own common ancestors. */
export type OtherTie = Relationship & {
  /** e.g. «Κοινοί πρόγονοι: Στέλιος Παπαδόπουλος και Σοφία Παπαδοπούλου»; null when one of the two descends from the other. */
  commonAncestors: string | null;
};

export type RelationReport = {
  from: TreePerson;
  to: TreePerson;
  /** The relationship to name first (see `findRelationships`). */
  main: Relationship;
  /** The other blood ties, closest first. */
  others: OtherTie[];
  /** They are married to each other: their blood ties were there before they married. */
  couple: boolean;
};

/** How two people are related, in `locale`. Null when they are not connected (or are the same person). */
export function relationReport(index: TreeIndex, fromId: string, toId: string, locale: Locale): RelationReport | null {
  const found = findRelationships(index, fromId, toId);
  if (!found) return null;
  return {
    from: found.main.from,
    to: lastOf(found.main),
    main: describeChain(index, found.main, locale),
    others: found.others.map((tie) => ({
      ...describeChain(index, tie.chain, locale),
      commonAncestors: commonAncestors(tie, locale),
    })),
    couple: found.couple,
  };
}

/** A chain in words, both ways, and as a diagram with the two people marked. */
function describeChain(index: TreeIndex, connection: Connection, locale: Locale): Relationship {
  const { from, steps } = connection;
  const to = lastOf(connection);
  const moves = steps.map((step) => step.move);
  const halfSibling = movesKey(moves) === "UD" && index.areHalfSiblings(from.id, to.id);
  const chain = [from, ...steps.map((step) => step.person)].map((person) => person.sex);
  const other = relationName(moves, to.sex, locale, { halfSibling, otherSex: from.sex, chain });
  const self = relationName(reverseMoves(moves), from.sex, locale, {
    halfSibling,
    otherSex: to.sex,
    chain: [...chain].reverse(),
  });
  const roles = other !== null && self !== null ? { other, self } : null;
  const degree = legalDegree(moves);
  return {
    roles,
    // Every blood relationship has a name, so only chains through marriages go without one.
    summary: roles?.other ?? phrases[locale].throughMarriages(marriagesOf(connection)),
    degree: degree && phrases[locale].degree(degree),
    chain: [
      { id: from.id, text: fullName(from) },
      ...steps.map(({ person, move }) => ({
        id: person.id,
        text: `${words[locale][STEP_TERMS[move]][person.sex]}: ${fullName(person)}`,
      })),
    ],
    diagram: {
      ...chainDiagram(connection),
      ends: [
        { id: from.id, role: roles?.self ?? null },
        { id: to.id, role: roles?.other ?? null },
      ],
    },
  };
}

/** The couples along a chain, each as the names of the two spouses. */
function marriagesOf({ from, steps }: Connection): [string, string][] {
  return steps.flatMap((step, i) =>
    step.move === "spouse" ? [[fullName(i === 0 ? from : steps[i - 1].person), fullName(step.person)]] : [],
  );
}

/** The common ancestors of a blood tie, named; none on a direct line, where one is the other's ancestor. */
function commonAncestors(tie: BloodTie<TreePerson>, locale: Locale) {
  const ends = [tie.chain.from.id, lastOf(tie.chain).id];
  if (tie.ancestors.some((ancestor) => ends.includes(ancestor.id))) return null;
  return phrases[locale].commonAncestors(tie.ancestors.map(fullName));
}

/** The words of a single step of the chain: the next person is a parent, a child or a spouse. */
const STEP_TERMS = { up: "parent", down: "child", spouse: "spouse" } as const satisfies Record<Move, Term>;

/** The sentences around the names of relationships. */
const phrases: Record<
  Locale,
  {
    throughMarriages: (couples: [string, string][]) => string;
    degree: (degree: LegalDegree) => string;
    commonAncestors: (names: string[]) => string;
  }
> = {
  el: {
    throughMarriages: (couples) =>
      `Συγγενεύουν μέσα από ${couples.length > 1 ? "τους γάμους" : "τον γάμο"}: ${couples.map((couple) => couple.join(" και ")).join("· ")}.`,
    degree: ({ kind, line, degree }) =>
      `Συγγένεια ${kind === "affinity" ? "εξ αγχιστείας" : "εξ αίματος"} ${line === "direct" ? "σε ευθεία γραμμή" : "εκ πλαγίου"}, ${degree}ου βαθμού`,
    commonAncestors: (names) => `${names.length > 1 ? "Κοινοί πρόγονοι" : "Κοινός πρόγονος"}: ${names.join(" και ")}`,
  },
  en: {
    throughMarriages: (couples) =>
      `Related through the ${couples.length > 1 ? "marriages" : "marriage"} of ${couples.map((couple) => couple.join(" and ")).join("; ")}.`,
    degree: ({ kind, line, degree }) =>
      `Related ${kind === "affinity" ? "by marriage (affinity)" : "by blood"} in the ${line} line, ${englishNumber(degree)} degree`,
    commonAncestors: (names) => `Common ancestor${names.length > 1 ? "s" : ""}: ${names.join(" and ")}`,
  },
};

/* ---------- Names of relationships ---------- */

type Word = { male: string; female: string; unknown: string };
const w = (male: string, female: string, unknown = `${male}/${female}`): Word => ({ male, female, unknown });

const words = {
  el: {
    parent: w("πατέρας", "μητέρα", "γονιός"),
    grandparent: w("παππούς", "γιαγιά"),
    greatGrandparent: w("προπάππους", "προγιαγιά"),
    ancestor: w("πρόγονος", "πρόγονος", "πρόγονος"),
    child: w("γιος", "κόρη", "παιδί"),
    grandchild: w("εγγονός", "εγγονή", "εγγόνι"),
    greatGrandchild: w("δισέγγονος", "δισέγγονη", "δισέγγονο"),
    descendant: w("απόγονος", "απόγονος", "απόγονος"),
    sibling: w("αδελφός", "αδελφή", "αδέλφι"),
    halfSibling: w("ετεροθαλής αδελφός", "ετεροθαλής αδελφή", "ετεροθαλές αδέλφι"),
    uncle: w("θείος", "θεία"),
    nephew: w("ανιψιός", "ανιψιά", "ανίψι"),
    cousin: w("εξάδελφος", "εξαδέλφη"),
    spouse: w("σύζυγος", "σύζυγος", "σύζυγος"),
    parentInLaw: w("πεθερός", "πεθερά"),
    childInLaw: w("γαμπρός", "νύφη"),
    siblingInLaw: w("κουνιάδος", "κουνιάδα"),
    coParentInLaw: w("συμπέθερος", "συμπεθέρα"),
    coSiblingInLaw: w("μπατζανάκης", "συννυφάδα"),
    uncleByMarriage: w("θείος (από γάμο)", "θεία (από γάμο)"),
    nephewByMarriage: w("ανιψιός (από γάμο)", "ανιψιά (από γάμο)"),
    stepParent: w("πατριός", "μητριά"),
    stepChild: w("προγονός", "προγονή"),
  },
  en: {
    parent: w("father", "mother", "parent"),
    grandparent: w("grandfather", "grandmother", "grandparent"),
    greatGrandparent: w("great-grandfather", "great-grandmother", "great-grandparent"),
    ancestor: w("ancestor", "ancestor", "ancestor"),
    child: w("son", "daughter", "child"),
    grandchild: w("grandson", "granddaughter", "grandchild"),
    greatGrandchild: w("great-grandson", "great-granddaughter", "great-grandchild"),
    descendant: w("descendant", "descendant", "descendant"),
    sibling: w("brother", "sister", "sibling"),
    halfSibling: w("half-brother", "half-sister", "half-sibling"),
    uncle: w("uncle", "aunt", "uncle/aunt"),
    nephew: w("nephew", "niece", "nephew/niece"),
    cousin: w("cousin", "cousin", "cousin"),
    spouse: w("husband", "wife", "spouse"),
    parentInLaw: w("father-in-law", "mother-in-law", "parent-in-law"),
    childInLaw: w("son-in-law", "daughter-in-law", "child-in-law"),
    siblingInLaw: w("brother-in-law", "sister-in-law", "sibling-in-law"),
    coParentInLaw: w("child's father-in-law", "child's mother-in-law", "child's parent-in-law"),
    coSiblingInLaw: w("brother-in-law", "sister-in-law", "sibling-in-law"),
    uncleByMarriage: w("uncle by marriage", "aunt by marriage", "uncle/aunt by marriage"),
    nephewByMarriage: w("nephew by marriage", "niece by marriage", "nephew/niece by marriage"),
    stepParent: w("stepfather", "stepmother", "step-parent"),
    stepChild: w("stepson", "stepdaughter", "stepchild"),
  },
} satisfies Record<Locale, Record<string, Word>>;

type Term = keyof (typeof words)["el"];

const ORDINALS = {
  male: ["πρώτος", "δεύτερος", "τρίτος", "τέταρτος", "πέμπτος", "έκτος"],
  female: ["πρώτη", "δεύτερη", "τρίτη", "τέταρτη", "πέμπτη", "έκτη"],
};
const ORDINALS_OF = {
  male: ["πρώτου", "δεύτερου", "τρίτου", "τέταρτου", "πέμπτου", "έκτου"],
  female: ["πρώτης", "δεύτερης", "τρίτης", "τέταρτης", "πέμπτης", "έκτης"],
};
const ENGLISH_ORDINALS = ["first", "second", "third", "fourth", "fifth", "sixth"];
/** 1st, 2nd, 3rd, 4th… */
const englishNumber = (n: number) =>
  `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th")}`;

/** The masculine word, the feminine one, or both when the sex is not known. */
const bySex = (sex: Sex, male: string, female: string) =>
  sex === "male" ? male : sex === "female" ? female : `${male}/${female}`;

/**
 * What the last person of a chain is to the first, e.g. «θεία» or «πρώτος εξάδελφος του πατέρα».
 * Null for chains with no name (through a marriage in the middle, or more than one). `chain` is
 * the sex of each person along the chain, the first included, for names such as «αδελφός της
 * γιαγιάς»; `otherSex` the first person's.
 */
function relationName(
  moves: Move[],
  sex: Sex,
  locale: Locale,
  { halfSibling, otherSex, chain }: { halfSibling: boolean; otherSex: Sex; chain: Sex[] },
) {
  const key = movesKey(moves);
  if (BLOOD.test(key)) {
    if (key === "UD") return words[locale][halfSibling ? "halfSibling" : "sibling"][sex];
    return bloodName(key, sex, locale, chain);
  }
  const term = marriageKind(key, sex, otherSex);
  if (term) return words[locale][term][sex];
  // The relatives by marriage the law counts (αγχιστεία) that have no word of their own are named
  // through the blood relative: the spouse of one's relative, or a relative of one's spouse.
  if (BLOOD.test(key.slice(0, -1)) && key.endsWith("S")) {
    const relative = bloodName(key.slice(0, -1), chain[chain.length - 2], locale, chain.slice(0, -1), true);
    const spouse = words[locale].spouse[sex];
    return locale === "el"
      ? `${spouse} ${relative}`
      : `${spouse} of ${/^[aeiou]/.test(relative) ? "an" : "a"} ${relative}`;
  }
  if (key.startsWith("S") && BLOOD.test(key.slice(1))) {
    const relative = bloodName(key.slice(1), sex, locale, chain.slice(1));
    const spouseSex = chain[1];
    return locale === "el"
      ? `${relative} ${bySex(spouseSex, "του συζύγου", "της συζύγου")}`
      : `${words.en.spouse[spouseSex]}'s ${relative}`;
  }
  return null;
}

/**
 * A blood relative by name, from a chain up to the closest common ancestor and then down (not
 * a sibling, which may be a half-sibling). In Greek, `of` gives the genitive: «της πρώτης
 * εξαδέλφης του πατέρα».
 */
function bloodName(key: string, sex: Sex, locale: Locale, chain: Sex[], of = false) {
  const up = key.indexOf("D") < 0 ? key.length : key.indexOf("D");
  const down = key.length - up;
  return locale === "el" ? greekBloodName(up, down, sex, chain, of) : englishBloodName(up, down, sex);
}

/*
 * Greek blood relatives by their standard names: siblings, θείος and ανιψιός, and cousins by
 * degree (πρώτος, δεύτερος εξάδελφος). Relatives of different generations beyond θείος and
 * ανιψιός have no single word, so they are named through the person of the same generation as
 * the other one: «πρώτος εξάδελφος του πατέρα», «αδελφός της γιαγιάς», «γιος της πρώτης
 * εξαδέλφης», «εγγονός του αδελφού».
 */
function greekBloodName(up: number, down: number, sex: Sex, chain: Sex[], of = false): string {
  if (down === 0) return greekAncestor(up, sex, of);
  if (up === 0) return greekDescendant(down, sex, of);
  if (up === down) return greekKin(up, sex, of);
  if (up === 2 && down === 1) return of ? bySex(sex, "του θείου", "της θείας") : words.el.uncle[sex];
  if (up === 1 && down === 2) return of ? bySex(sex, "του ανιψιού", "της ανιψιάς") : words.el.nephew[sex];
  // The first person's ancestor `apart` generations up, or the last person's.
  const apart = Math.abs(up - down);
  if (up > down) return `${greekKin(down, sex, of)} ${greekAncestor(apart, chain[apart] ?? "unknown", true)}`;
  return `${greekDescendant(apart, sex, of)} ${greekKin(up, chain[chain.length - 1 - apart] ?? "unknown", true)}`;
}

/**
 * Someone of one's own generation `rung` generations below the common ancestor: a sibling (1),
 * a first cousin (2)… With `of`, «του αδελφού», «της πρώτης εξαδέλφης».
 */
function greekKin(rung: number, sex: Sex, of = false): string {
  if (!of) return rung === 1 ? words.el.sibling[sex] : `${greekOrdinal(rung - 1, sex)} ${words.el.cousin[sex]}`;
  const one = (s: "male" | "female") => {
    const article = s === "male" ? "του" : "της";
    if (rung === 1) return `${article} ${s === "male" ? "αδελφού" : "αδελφής"}`;
    return `${article} ${greekOrdinal(rung - 1, s, true)} ${s === "male" ? "εξαδέλφου" : "εξαδέλφης"}`;
  };
  return bySex(sex, one("male"), one("female"));
}

/** «πρώτος», «δεύτερη»…, or «δεύτερου», «τρίτης»… with `of`. */
function greekOrdinal(n: number, sex: Sex, of = false) {
  const list = (of ? ORDINALS_OF : ORDINALS)[sex === "female" ? "female" : "male"];
  return list[n - 1] ?? `${n}.`;
}

/** πατέρας, παππούς, προπάππους, προ-προπάππους…; with `of`, «του πατέρα», «της γιαγιάς». */
function greekAncestor(generations: number, sex: Sex, of = false): string {
  const article = (s: "male" | "female") => (of ? (s === "male" ? "του " : "της ") : "");
  if (generations > 5) return `${of ? "του προγόνου" : words.el.ancestor[sex]} ${generations}ης γενιάς`;
  if (generations === 1 && sex === "unknown") return of ? "του γονιού" : words.el.parent.unknown;
  const pre = "προ-".repeat(Math.max(0, generations - 3));
  const names = {
    1: { male: ["πατέρας", "πατέρα"], female: ["μητέρα", "μητέρας"] },
    2: { male: ["παππούς", "παππού"], female: ["γιαγιά", "γιαγιάς"] },
  }[generations as 1 | 2] ?? {
    male: [`${pre}προπάππους`, `${pre}προπάππου`],
    female: [`${pre}προγιαγιά`, `${pre}προγιαγιάς`],
  };
  const one = (s: "male" | "female") => article(s) + names[s][of ? 1 : 0];
  return bySex(sex, one("male"), one("female"));
}

/** παιδί, εγγονός, δισέγγονος, τρισέγγονος, then «απόγονος 5ης γενιάς»; with `of`, «του γιου», «της εγγονής». */
function greekDescendant(generations: number, sex: Sex, of = false): string {
  if (of) {
    if (generations > 4) return `του απογόνου ${generations}ης γενιάς`;
    const [male, female, unknown] = [
      ["γιου", "κόρης", "παιδιού"],
      ["εγγονού", "εγγονής", "εγγονιού"],
      ["δισέγγονου", "δισέγγονης", "δισέγγονου"],
      ["τρισέγγονου", "τρισέγγονης", "τρισέγγονου"],
    ][generations - 1];
    return sex === "unknown" ? `του ${unknown}` : bySex(sex, `του ${male}`, `της ${female}`);
  }
  const terms = ["child", "grandchild", "greatGrandchild"] as const;
  if (generations <= 3) return words.el[terms[generations - 1]][sex];
  if (generations === 4) return { male: "τρισέγγονος", female: "τρισέγγονη", unknown: "τρισέγγονο" }[sex];
  return `${words.el.descendant[sex]} ${generations}ης γενιάς`;
}

/** «great-», «great-great-», then «3rd great-», «4th great-»… */
const greats = (n: number) => (n <= 2 ? "great-".repeat(n) : `${englishNumber(n)} great-`);

/**
 * English blood relatives by the standard genealogical terms: great-great-grandfather, then
 * 3rd great-grandfather; great-uncle and great-nephew; first cousin once removed.
 */
function englishBloodName(up: number, down: number, sex: Sex): string {
  const word = (term: Term) => words.en[term][sex];
  if (down === 0)
    return up <= 2 ? word((["parent", "grandparent"] as const)[up - 1]) : greats(up - 2) + word("grandparent");
  if (up === 0)
    return down <= 2 ? word((["child", "grandchild"] as const)[down - 1]) : greats(down - 2) + word("grandchild");
  if (down === 1) return greats(up - 2) + word("uncle");
  if (up === 1) return greats(down - 2) + word("nephew");
  const cousin = `${ENGLISH_ORDINALS[Math.min(up, down) - 2] ?? englishNumber(Math.min(up, down) - 1)} ${word("cousin")}`;
  const removed = Math.abs(up - down);
  if (removed === 0) return cousin;
  return `${cousin} ${removed === 1 ? "once" : removed === 2 ? "twice" : `${removed} times`} removed`;
}

/* ---------- The chain as a small tree ---------- */

/**
 * The chain laid out as a tree (see `chainDiagram`), with the two people compared and what each
 * is to the other (null: no everyday name).
 */
export type ConnectionDiagram = NewDiagram<TreePerson> & {
  ends: { id: string; role: string | null }[];
};
