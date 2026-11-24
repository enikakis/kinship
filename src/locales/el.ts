import type { Blood } from "../classify";
import type { KinshipLocale } from "../locale";
import type { Sex } from "../types";
import { bloodPart, STEP_TERMS, w } from "./shared";

/*
 * Greek. Names need the sex of the person named and, inside longer names, the genitive case:
 * «σύζυγος της πρώτης εξαδέλφης του πατέρα». With an unknown sex both forms are given: «θείος/θεία».
 */

const words = {
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
};

const ORDINALS = {
  male: ["πρώτος", "δεύτερος", "τρίτος", "τέταρτος", "πέμπτος", "έκτος"],
  female: ["πρώτη", "δεύτερη", "τρίτη", "τέταρτη", "πέμπτη", "έκτη"],
};
const ORDINALS_OF = {
  male: ["πρώτου", "δεύτερου", "τρίτου", "τέταρτου", "πέμπτου", "έκτου"],
  female: ["πρώτης", "δεύτερης", "τρίτης", "τέταρτης", "πέμπτης", "έκτης"],
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
        return bloodName(bloodPart(query), sex, sexes);
      // The relatives by marriage the law counts (αγχιστεία) that have no word of their own are
      // named through the blood relative: the spouse of one's relative, or a relative of one's spouse.
      case "spouseOfRelative": {
        const relative = bloodName(bloodPart(query), sexes[sexes.length - 2], sexes.slice(0, -1), true);
        return `${words.spouse[sex]} ${relative}`;
      }
      case "relativeOfSpouse": {
        const relative = bloodName(bloodPart(query), sex, sexes.slice(1));
        return `${relative} ${bySex(sexes[1], "του συζύγου", "της συζύγου")}`;
      }
      case "unnamed":
        return null;
      default:
        return words[kind][sex];
    }
  },

  step: (move, sex) => words[STEP_TERMS[move]][sex],

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
 * του αδελφού». `chain` is the sex of everyone on the chain, the first person first; with `of`,
 * the name is in the genitive: «της πρώτης εξαδέλφης του πατέρα».
 */
function bloodName({ up, down }: Blood, sex: Sex, chain: readonly Sex[], of = false): string {
  if (down === 0) return ancestor(up, sex, of);
  if (up === 0) return descendant(down, sex, of);
  if (up === down) return kin(up, sex, of);
  if (up === 2 && down === 1) return of ? bySex(sex, "του θείου", "της θείας") : words.uncle[sex];
  if (up === 1 && down === 2) return of ? bySex(sex, "του ανιψιού", "της ανιψιάς") : words.nephew[sex];
  // The first person's ancestor `apart` generations up, or the last person's.
  const apart = Math.abs(up - down);
  if (up > down) return `${kin(down, sex, of)} ${ancestor(apart, chain[apart] ?? "unknown", true)}`;
  return `${descendant(apart, sex, of)} ${kin(up, chain[chain.length - 1 - apart] ?? "unknown", true)}`;
}

/**
 * Someone of one's own generation `rung` generations below the common ancestor: a sibling (1),
 * a first cousin (2)… With `of`, «του αδελφού», «της πρώτης εξαδέλφης».
 */
function kin(rung: number, sex: Sex, of = false): string {
  if (!of) return rung === 1 ? words.sibling[sex] : `${ordinal(rung - 1, sex)} ${words.cousin[sex]}`;
  const one = (s: "male" | "female") => {
    const article = s === "male" ? "του" : "της";
    if (rung === 1) return `${article} ${s === "male" ? "αδελφού" : "αδελφής"}`;
    return `${article} ${ordinal(rung - 1, s, true)} ${s === "male" ? "εξαδέλφου" : "εξαδέλφης"}`;
  };
  return bySex(sex, one("male"), one("female"));
}

/** «πρώτος», «δεύτερη»…, or «δεύτερου», «τρίτης»… with `of`. */
function ordinal(n: number, sex: Sex, of = false) {
  const list = (of ? ORDINALS_OF : ORDINALS)[sex === "female" ? "female" : "male"];
  return list[n - 1] ?? `${n}.`;
}

/** πατέρας, παππούς, προπάππους, προ-προπάππους…; with `of`, «του πατέρα», «της γιαγιάς». */
function ancestor(generations: number, sex: Sex, of = false): string {
  const article = (s: "male" | "female") => (of ? (s === "male" ? "του " : "της ") : "");
  if (generations > 5) return `${of ? "του προγόνου" : words.ancestor[sex]} ${generations}ης γενιάς`;
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

/** παιδί, εγγονός, δισέγγονος, τρισέγγονος, then «απόγονος 5ης γενιάς»; with `of`, «του γιου», «της εγγονής». */
function descendant(generations: number, sex: Sex, of = false): string {
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
  if (generations <= 3) return words[terms[generations - 1]][sex];
  if (generations === 4) return { male: "τρισέγγονος", female: "τρισέγγονη", unknown: "τρισέγγονο" }[sex];
  return `${words.descendant[sex]} ${generations}ης γενιάς`;
}
