import type { KinshipLocale } from "../locale";
import type { Sex } from "../types";
import { bloodName, bloodPart, STEP_TERMS, w, type BloodParts } from "./shared";

/*
 * Greek. Names need the sex of the person named and, inside longer names, the genitive case:
 * «σύζυγος της πρώτης εξαδέλφης του πατέρα». With an unknown sex both forms are given: «θείος/θεία».
 */

const words = {
  parent: w("πατέρας", "μητέρα", "γονιός"),
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
};

const ORDINALS = {
  male: ["πρώτος", "δεύτερος", "τρίτος", "τέταρτος", "πέμπτος", "έκτος", "έβδομος", "όγδοος", "ένατος", "δέκατος"],
  female: ["πρώτη", "δεύτερη", "τρίτη", "τέταρτη", "πέμπτη", "έκτη", "έβδομη", "όγδοη", "ένατη", "δέκατη"],
};
const ORDINALS_OF = {
  male: ["πρώτου", "δεύτερου", "τρίτου", "τέταρτου", "πέμπτου", "έκτου", "έβδομου", "όγδοου", "ένατου", "δέκατου"],
  female: ["πρώτης", "δεύτερης", "τρίτης", "τέταρτης", "πέμπτης", "έκτης", "έβδομης", "όγδοης", "ένατης", "δέκατης"],
};

/** The masculine word, the feminine one, or both when the sex is not known. */
const bySex = (sex: Sex, male: string, female: string) =>
  sex === "male" ? male : sex === "female" ? female : `${male}/${female}`;

export const el: KinshipLocale = {
  code: "el",

  name(query) {
    const { kind, sexes } = query;
    const sex = sexes[sexes.length - 1];
    switch (kind) {
      case "sibling":
      case "halfSibling":
        return words[kind][sex];
      case "ancestor":
      case "descendant":
      case "uncle":
      case "nephew":
      case "cousin":
        return bloodName(BLOOD, bloodPart(query), sex, sexes, false);
      // The relatives by marriage the law counts (αγχιστεία) that have no word of their own are
      // named through the blood relative: the spouse of one's relative, or a relative of one's spouse.
      case "spouseOfRelative": {
        const relative = bloodName(BLOOD, bloodPart(query), sexes[sexes.length - 2], sexes.slice(0, -1), true);
        return `${words.spouse[sex]} ${relative}`;
      }
      case "relativeOfSpouse": {
        const relative = bloodName(BLOOD, bloodPart(query), sex, sexes.slice(1), false);
        return `${relative} ${bySex(sexes[1], "του συζύγου", "της συζύγου")}`;
      }
      case "unnamed":
        return null;
      default:
        return words[kind][sex];
    }
  },

  step: (move, sex) => words[STEP_TERMS[move]][sex],

  labelled: (label, name) => `${label}: ${name}`,

  degree: ({ kind, line, degree }) =>
    `Συγγένεια ${kind === "affinity" ? "εξ αγχιστείας" : "εξ αίματος"} ${line === "direct" ? "σε ευθεία γραμμή" : "εκ πλαγίου"}, ${degree}ου βαθμού`,

  throughMarriages: (couples) =>
    `Συγγενεύουν μέσα από ${couples.length > 1 ? "τους γάμους" : "τον γάμο"}: ${couples.map((couple) => couple.join(" και ")).join("· ")}.`,

  commonAncestors: (names) => `${names.length > 1 ? "Κοινοί πρόγονοι" : "Κοινός πρόγονος"}: ${names.join(" και ")}`,
};

/*
 * Blood relatives by their standard names: siblings, θείος and ανιψιός, and cousins by degree
 * (πρώτος, δεύτερος εξάδελφος). Relatives of different generations beyond θείος and ανιψιός have
 * no single word, so they are named through the person of the same generation as the other one:
 * «πρώτος εξάδελφος του πατέρα», «αδελφός της γιαγιάς», «γιος της πρώτης εξαδέλφης», «εγγονός
 * του αδελφού». The form is whether the name is in the genitive: «της πρώτης εξαδέλφης του πατέρα».
 */
const BLOOD: BloodParts<boolean> = {
  of: true,
  ancestor,
  descendant,
  kin,
  uncle: (up, sex, of) => (up > 2 ? null : of ? bySex(sex, "του θείου", "της θείας") : words.uncle[sex]),
  nephew: (down, sex, of) => (down > 2 ? null : of ? bySex(sex, "του ανιψιού", "της ανιψιάς") : words.nephew[sex]),
};

/**
 * Someone of one's own generation `rung` generations below the common ancestor: a sibling (1),
 * a first cousin (2)… With `of`, «του αδελφού», «της πρώτης εξαδέλφης». Unknown sex gives both
 * full forms, each with its own ordinal: «τέταρτος εξάδελφος/τέταρτη εξαδέλφη».
 */
function kin(rung: number, sex: Sex, of = false): string {
  if (!of) {
    if (rung === 1) return words.sibling[sex];
    const cousin = (s: "male" | "female") => `${ordinal(rung - 1, s)} ${words.cousin[s]}`;
    return bySex(sex, cousin("male"), cousin("female"));
  }
  const one = (s: "male" | "female") => {
    const article = s === "male" ? "του" : "της";
    if (rung === 1) return `${article} ${s === "male" ? "αδελφού" : "αδελφής"}`;
    return `${article} ${ordinal(rung - 1, s, true)} ${s === "male" ? "εξαδέλφου" : "εξαδέλφης"}`;
  };
  return bySex(sex, one("male"), one("female"));
}

/** «πρώτος», «δεύτερη»…, or «δεύτερου», «τρίτης»… with `of`; beyond ten «11ος», «11η», «11ου», «11ης». */
function ordinal(n: number, sex: Sex, of = false) {
  const female = sex === "female";
  const list = (of ? ORDINALS_OF : ORDINALS)[female ? "female" : "male"];
  return list[n - 1] ?? `${n}${of ? (female ? "ης" : "ου") : female ? "η" : "ος"}`;
}

/**
 * πατέρας, παππούς, προπάππους, προ-προπάππους…, then «πρόγονος 7ης γενιάς»; with `of`, «του
 * πατέρα», «της γιαγιάς», «του/της προγόνου 7ης γενιάς».
 */
function ancestor(generations: number, sex: Sex, of = false): string {
  const article = (s: "male" | "female") => (of ? (s === "male" ? "του " : "της ") : "");
  if (generations > 5)
    return `${of ? bySex(sex, "του προγόνου", "της προγόνου") : words.ancestor[sex]} ${generations}ης γενιάς`;
  if (generations === 1 && sex === "unknown") return of ? "του γονιού" : words.parent.unknown;
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

/** παιδί, εγγονός, δισέγγονος, τρισέγγονος, then «απόγονος 5ης γενιάς»; with `of`, «του γιου», «της εγγονής», «της απογόνου 5ης γενιάς». */
function descendant(generations: number, sex: Sex, of = false): string {
  if (of) {
    if (generations > 4) return `${bySex(sex, "του απογόνου", "της απογόνου")} ${generations}ης γενιάς`;
    const [male, female, unknown] = [
      ["γιου", "κόρης", "παιδιού"],
      ["εγγονού", "εγγονής", "εγγονιού"],
      ["δισέγγονου", "δισέγγονης", "δισέγγονου"],
      ["τρισέγγονου", "τρισέγγονης", "τρισέγγονου"],
    ][generations - 1];
    return sex === "unknown" ? `του ${unknown}` : bySex(sex, `του ${male}`, `της ${female}`);
  }
  const terms = ["child", "grandchild", "greatGrandchild"] as const;
  if (generations <= 3) return words[terms[generations - 1]][sex];
  if (generations === 4) return { male: "τρισέγγονος", female: "τρισέγγονη", unknown: "τρισέγγονο" }[sex];
  return `${words.descendant[sex]} ${generations}ης γενιάς`;
}
