import type { Locale } from "@/shared/i18n";
import type { Sex, TreeIndex, TreePerson } from "./model";
import { fullName } from "./person-display";

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
      ...describeChain(index, tie.connection, locale),
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
  const degree = relationDegree(moves);
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
    diagram: connectionDiagram(connection, { from: roles?.self ?? null, to: roles?.other ?? null }),
  };
}

/** The couples along a chain, each as the names of the two spouses. */
function marriagesOf({ from, steps }: Connection): [string, string][] {
  return steps.flatMap((step, i) =>
    step.move === "spouse" ? [[fullName(i === 0 ? from : steps[i - 1].person), fullName(step.person)]] : [],
  );
}

/** The common ancestors of a blood tie, named; none on a direct line, where one is the other's ancestor. */
function commonAncestors(tie: BloodTie, locale: Locale) {
  const ends = [tie.connection.from.id, lastOf(tie.connection).id];
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
    degree: (degree: Degree) => string;
    commonAncestors: (names: string[]) => string;
  }
> = {
  el: {
    throughMarriages: (couples) =>
      `Συγγενεύουν μέσα από ${couples.length > 1 ? "τους γάμους" : "τον γάμο"}: ${couples.map((couple) => couple.join(" και ")).join("· ")}.`,
    degree: ({ byMarriage, direct, degree }) =>
      `Συγγένεια ${byMarriage ? "εξ αγχιστείας" : "εξ αίματος"} ${direct ? "σε ευθεία γραμμή" : "εκ πλαγίου"}, ${degree}ου βαθμού`,
    commonAncestors: (names) => `${names.length > 1 ? "Κοινοί πρόγονοι" : "Κοινός πρόγονος"}: ${names.join(" και ")}`,
  },
  en: {
    throughMarriages: (couples) =>
      `Related through the ${couples.length > 1 ? "marriages" : "marriage"} of ${couples.map((couple) => couple.join(" and ")).join("; ")}.`,
    degree: ({ byMarriage, direct, degree }) =>
      `Related ${byMarriage ? "by marriage (affinity)" : "by blood"} in the ${direct ? "direct" : "collateral"} line, ${englishNumber(degree)} degree`,
    commonAncestors: (names) => `Common ancestor${names.length > 1 ? "s" : ""}: ${names.join(" and ")}`,
  },
};

/* ---------- The chain ---------- */

/** A step along the chain: to a parent (up), a child (down) or a spouse. */
type Move = "up" | "down" | "spouse";

/** The chain from one person to another: each person after the first, with how they were reached. */
type Connection = { from: TreePerson; steps: { person: TreePerson; move: Move }[] };

const lastOf = (connection: Connection) => connection.steps.at(-1)!.person;

/**
 * The shortest chain between two people, preferring blood relations: with as many steps, the one
 * with fewer marriages wins. Null when they are not connected (or are the same person).
 */
function findConnection(index: TreeIndex, fromId: string, toId: string): Connection | null {
  const from = index.byId.get(fromId);
  if (!from || !index.byId.get(toId) || fromId === toId) return null;
  // Cost: 10 a step, and 1 more for a marriage, so blood relations win among equally short chains.
  const cost = new Map<string, number>([[fromId, 0]]);
  const previous = new Map<string, { id: string; move: Move }>();
  const queue: { id: string; cost: number }[] = [{ id: fromId, cost: 0 }];
  while (queue.length > 0) {
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift()!;
    if (current.id === toId) break;
    if (current.cost > (cost.get(current.id) ?? Infinity)) continue;
    const next: [TreePerson, Move][] = [
      ...index.parents(current.id).map((person): [TreePerson, Move] => [person, "up"]),
      ...index.children(current.id).map((person): [TreePerson, Move] => [person, "down"]),
      ...index.spouses(current.id).map(({ person }): [TreePerson, Move] => [person, "spouse"]),
    ];
    for (const [person, move] of next) {
      const total = current.cost + (move === "spouse" ? 11 : 10);
      if (total >= (cost.get(person.id) ?? Infinity)) continue;
      cost.set(person.id, total);
      previous.set(person.id, { id: current.id, move });
      queue.push({ id: person.id, cost: total });
    }
  }
  if (!previous.has(toId)) return null;
  const steps: Connection["steps"] = [];
  for (let id = toId; id !== fromId; id = previous.get(id)!.id) {
    steps.unshift({ person: index.byId.get(id)!, move: previous.get(id)!.move });
  }
  return { from, steps };
}

/* ---------- Related in more than one way ---------- */

/** A blood relationship through one common ancestor (or couple of ancestors), besides the main one. */
type BloodTie = { connection: Connection; ancestors: TreePerson[] };

/**
 * The other ways two people are related by blood, closest first: one for each common ancestor
 * (a couple counts once) other than the one the main chain goes through. Two brothers who married
 * two sisters have children related twice; a couple may have been cousins before they married.
 */
function otherBloodTies(index: TreeIndex, main: Connection): BloodTie[] {
  const a = main.from.id;
  const b = lastOf(main).id;
  const upA = ancestorPaths(index, a);
  const upB = ancestorPaths(index, b);
  const common = new Set([...upA.keys()].filter((id) => upB.has(id)));
  // The closest common ancestors: none of their children is a common ancestor too.
  const closest = [...common].filter((id) => !index.children(id).some((child) => common.has(child.id)));

  const groups: string[][] = [];
  for (const id of closest) {
    const spouses = new Set(index.spouses(id).map((spouse) => spouse.person.id));
    const group = groups.find((members) => members.some((member) => spouses.has(member)));
    if (group) group.push(id);
    else groups.push([id]);
  }

  const mainIsBlood = isBloodLine(main);
  const onMainChain = new Set([a, ...main.steps.map((step) => step.person.id)]);
  return groups
    .filter((group) => !(mainIsBlood && group.some((id) => onMainChain.has(id))))
    .map((group) => {
      const top = group[0];
      const up = upA.get(top)!;
      const down = [...upB.get(top)!].reverse();
      const steps: Connection["steps"] = [
        ...up.slice(1).map((id) => ({ person: index.byId.get(id)!, move: "up" as const })),
        ...down.slice(1).map((id) => ({ person: index.byId.get(id)!, move: "down" as const })),
      ];
      return { connection: { from: main.from, steps }, ancestors: group.map((id) => index.byId.get(id)!) };
    })
    .sort((x, y) => x.connection.steps.length - y.connection.steps.length);
}

/**
 * Everything that relates two people: the main relationship, and the other blood ties after it.
 * A blood tie usually comes before a chain through marriages (or through the child of a
 * marriage), even a shorter one. But a relation by marriage with an everyday name (a couple, an
 * uncle by marriage, in-laws) comes before a distant blood tie, one beyond first cousins: in a
 * village an aunt's husband is often a distant cousin too, and he is her husband first of all.
 */
function findRelationships(index: TreeIndex, fromId: string, toId: string) {
  const shortest = findConnection(index, fromId, toId);
  if (!shortest) return null;
  const ties = otherBloodTies(index, shortest);
  const couple = shortest.steps.length === 1 && shortest.steps[0].move === "spouse";
  const closest = ties[0]?.connection;
  const bloodFirst =
    closest !== undefined &&
    !isBloodLine(shortest) &&
    !couple &&
    !(hasName(shortest) && closest.steps.length > FIRST_COUSIN_STEPS);
  return bloodFirst ? { main: closest, others: ties.slice(1), couple } : { main: shortest, others: ties, couple };
}

/** Steps between first cousins (up twice, down twice): blood ties this close always come first. */
const FIRST_COUSIN_STEPS = 4;

/**
 * Whether a chain has a name of its own, such as «κουνιάδος», rather than only a number of steps.
 * Both languages name the same relationships, so the main one is the same in either.
 */
const hasName = (connection: Connection) =>
  isBloodLine(connection) ||
  marriageTerm(movesKey(connection.steps.map((step) => step.move)), lastOf(connection).sex, connection.from.sex) !==
    null;

/**
 * Whether a chain is a blood relationship: up to a common ancestor, then down. A chain that goes
 * down to a child and up to the child's other parent passes through a marriage, recorded or not.
 */
const isBloodLine = (connection: Connection) => BLOOD.test(movesKey(connection.steps.map((step) => step.move)));

/** A chain as letters, e.g. "UUD" for an aunt: U up, D down, S a spouse. */
const movesKey = (moves: Move[]) => moves.map((move) => (move === "up" ? "U" : move === "down" ? "D" : "S")).join("");

/** Up to the closest common ancestor, then down. */
const BLOOD = /^U*D*$/;

/** For a person and each of their ancestors (the person included), the shortest line between them, the person first. */
function ancestorPaths(index: TreeIndex, id: string) {
  const paths = new Map<string, string[]>([[id, [id]]]);
  let generation = [id];
  while (generation.length > 0) {
    const next: string[] = [];
    for (const current of generation) {
      for (const parent of index.parents(current)) {
        if (paths.has(parent.id)) continue;
        paths.set(parent.id, [...paths.get(current)!, parent.id]);
        next.push(parent.id);
      }
    }
    generation = next;
  }
  return paths;
}

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
  const term = marriageTerm(key, sex, otherSex);
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

/** Relations by marriage with a name of their own. */
const BY_MARRIAGE: Record<string, Term> = {
  S: "spouse",
  SU: "parentInLaw",
  DS: "childInLaw",
  SUD: "siblingInLaw",
  UDS: "siblingInLaw",
  DSU: "coParentInLaw",
  US: "stepParent",
  SD: "stepChild",
  // An aunt's husband, or a spouse's uncle; and the other way round.
  UUDS: "uncleByMarriage",
  SUUD: "uncleByMarriage",
  SUDD: "nephewByMarriage",
  UDDS: "nephewByMarriage",
};

/** The name of a relation by marriage, in any language; null when it has none. */
function marriageTerm(key: string, sex: Sex, otherSex: Sex): Term | null {
  // Two men married to sisters, or two women married to brothers; other pairs have no name.
  if (key === "SUDS") return sex !== "unknown" && sex === otherSex ? "coSiblingInLaw" : null;
  return BY_MARRIAGE[key] ?? null;
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

type Degree = { byMarriage: boolean; direct: boolean; degree: number };

/**
 * The degree of a relationship as the law counts it (Αστικός Κώδικας, άρθρα 1463–1464): one
 * degree for each generation between the two, through the common ancestor. By blood, or by
 * marriage (αγχιστεία) to the spouse's blood relatives, in the same degree. In the direct line
 * one descends from the other; otherwise the line is collateral. Null for a couple and for
 * relations through more than one marriage, which the law does not count.
 */
function relationDegree(moves: Move[]): Degree | null {
  const key = movesKey(moves);
  const blood = key.replace(/^S|S$/, "");
  if (blood === "" || !BLOOD.test(blood) || (key !== blood && key.length - blood.length !== 1)) return null;
  return {
    byMarriage: key !== blood,
    direct: !blood.includes("U") || !blood.includes("D"),
    degree: blood.length,
  };
}

/** The chain the other way round: from the last person back to the first. */
const reverseMoves = (moves: Move[]): Move[] =>
  [...moves].reverse().map((move) => (move === "up" ? "down" : move === "down" ? "up" : "spouse"));

/* ---------- The chain as a small tree ---------- */

/**
 * A person of the chain in the diagram: `row` is the generation (0 the oldest), `lane` the
 * column, which may be halfway between two (a common ancestor above both lines).
 */
type DiagramNode = { person: TreePerson; row: number; lane: number };

/**
 * The chain laid out as a tree: its people, how many lanes wide it is, the lines in chain order,
 * and the two people compared, with what each is to the other (null: no everyday name).
 */
export type ConnectionDiagram = {
  nodes: DiagramNode[];
  rows: number;
  lanes: number;
  links: { from: string; to: string; kind: "parent" | "spouse" }[];
  ends: { id: string; role: string | null }[];
};

/**
 * Lays a chain out as a family tree. Going up is the row above and going down the row below, in
 * the same lane, so each line of ancestors stands straight. Where the chain turns from going up
 * to going down, the common ancestor sits halfway between the two lines and the chain moves to a
 * new lane; a marriage or another turn also moves to a new lane, in the same row.
 */
function connectionDiagram(
  connection: Connection,
  roles: { from: string | null; to: string | null },
): ConnectionDiagram {
  const chain: { person: TreePerson; level: number; lane: number }[] = [{ person: connection.from, level: 0, lane: 0 }];
  let lane = 0;
  connection.steps.forEach(({ person, move }, i) => {
    const before = chain.at(-1)!;
    const previousMove = connection.steps[i - 1]?.move;
    if (move === "spouse") lane += 1;
    else if (move === "down" && previousMove === "up") {
      before.lane = lane + 0.5;
      lane += 1;
    } else if (move === "up" && previousMove === "down") lane += 1;
    const level = before.level + (move === "up" ? -1 : move === "down" ? 1 : 0);
    chain.push({ person, level, lane });
  });
  const top = Math.min(...chain.map((node) => node.level));
  const nodes = chain.map(({ person, level, lane }) => ({ person, row: level - top, lane }));
  const links = connection.steps.map(({ person, move }, i) => ({
    from: chain[i].person.id,
    to: person.id,
    kind: move === "spouse" ? ("spouse" as const) : ("parent" as const),
  }));
  return {
    nodes,
    rows: Math.max(...nodes.map((node) => node.row)) + 1,
    lanes: Math.ceil(Math.max(...nodes.map((node) => node.lane))) + 1,
    links,
    ends: [
      { id: connection.from.id, role: roles.from },
      { id: lastOf(connection).id, role: roles.to },
    ],
  };
}
