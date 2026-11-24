import type { Blood } from "../classify";
import type { LegalDegree } from "../degree";
import type { KinshipLocale } from "../locale";
import type { Sex } from "../types";
import { bloodPart, STEP_TERMS, w } from "./shared";

/* English, by the standard genealogical terms. */

const words = {
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
};

const ORDINALS = ["first", "second", "third", "fourth", "fifth", "sixth"];

/** 1st, 2nd, 3rd, 4th… */
const number = (n: number) =>
  `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th")}`;

/** Spelled out here rather than taken from the value, so renaming the value cannot change the sentence. */
const LINES = { direct: "direct", collateral: "collateral" } as const satisfies Record<LegalDegree["line"], string>;

export const en: KinshipLocale = {
  code: "en",

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
        return bloodName(bloodPart(query), sex);
      // The relatives by marriage the law counts that have no word of their own are named through
      // the blood relative: the spouse of one's relative, or a relative of one's spouse.
      case "spouseOfRelative": {
        const relative = bloodName(bloodPart(query), sexes[sexes.length - 2]);
        return `${words.spouse[sex]} of ${/^[aeiou]/.test(relative) ? "an" : "a"} ${relative}`;
      }
      case "relativeOfSpouse":
        return `${words.spouse[sexes[1]]}'s ${bloodName(bloodPart(query), sex)}`;
      case "unnamed":
        return null;
      default:
        return words[kind][sex];
    }
  },

  step: (move, sex) => words[STEP_TERMS[move]][sex],

  degree: ({ kind, line, degree }) =>
    `Related ${kind === "affinity" ? "by marriage (affinity)" : "by blood"} in the ${LINES[line]} line, ${number(degree)} degree`,

  throughMarriages: (couples) =>
    `Related through the ${couples.length > 1 ? "marriages" : "marriage"} of ${couples.map((couple) => couple.join(" and ")).join("; ")}.`,

  commonAncestors: (names) => `Common ancestor${names.length > 1 ? "s" : ""}: ${names.join(" and ")}`,
};

/** «great-», «great-great-», then «3rd great-», «4th great-»… */
const greats = (n: number) => (n <= 2 ? "great-".repeat(n) : `${number(n)} great-`);

/**
 * Blood relatives by the standard genealogical terms: great-great-grandfather, then 3rd
 * great-grandfather; great-uncle and great-nephew; first cousin once removed.
 */
function bloodName({ up, down }: Blood, sex: Sex): string {
  const word = (term: keyof typeof words) => words[term][sex];
  if (down === 0)
    return up <= 2 ? word((["parent", "grandparent"] as const)[up - 1]) : greats(up - 2) + word("grandparent");
  if (up === 0)
    return down <= 2 ? word((["child", "grandchild"] as const)[down - 1]) : greats(down - 2) + word("grandchild");
  if (down === 1) return greats(up - 2) + word("uncle");
  if (up === 1) return greats(down - 2) + word("nephew");
  const cousin = `${ORDINALS[Math.min(up, down) - 2] ?? number(Math.min(up, down) - 1)} ${word("cousin")}`;
  const removed = Math.abs(up - down);
  if (removed === 0) return cousin;
  return `${cousin} ${removed === 1 ? "once" : removed === 2 ? "twice" : `${removed} times`} removed`;
}
