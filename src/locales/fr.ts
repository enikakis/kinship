import type { LegalDegree } from "../degree";
import type { KinshipLocale } from "../locale";
import type { Sex } from "../types";
import { bloodName, bloodPart, list, neutral, STEP_TERMS, w, type BloodParts, type Word } from "./shared";

/*
 * French. Experimental: the terms come from the sources in docs/locales/fr.md and await a native
 * speaker's review. Names need the sex of the person named and, inside longer names, «de» with the
 * article: «épouse d'un cousin germain du père». With an unknown sex both forms are given,
 * «oncle/tante», except for the neutral words parent, enfant and conjoint.
 */

const words = {
  parent: neutral("père", "mère", "parent"),
  /** A parent inside a longer name, where «parent» would read "relative": «père/mère du conjoint». */
  parentInName: w("père", "mère"),
  grandparent: w("grand-père", "grand-mère"),
  greatGrandparent: w("arrière-grand-père", "arrière-grand-mère"),
  greatGreatGrandparent: w("arrière-arrière-grand-père", "arrière-arrière-grand-mère"),
  ascendant: w("ascendant", "ascendante"),
  child: neutral("fils", "fille", "enfant"),
  grandchild: w("petit-fils", "petite-fille"),
  greatGrandchild: w("arrière-petit-fils", "arrière-petite-fille"),
  greatGreatGrandchild: w("arrière-arrière-petit-fils", "arrière-arrière-petite-fille"),
  descendant: w("descendant", "descendante"),
  sibling: w("frère", "sœur"),
  halfSibling: w("demi-frère", "demi-sœur"),
  uncle: w("oncle", "tante"),
  greatUncle: w("grand-oncle", "grand-tante"),
  greatGreatUncle: w("arrière-grand-oncle", "arrière-grand-tante"),
  nephew: w("neveu", "nièce"),
  greatNephew: w("petit-neveu", "petite-nièce"),
  greatGreatNephew: w("arrière-petit-neveu", "arrière-petite-nièce"),
  firstCousin: w("cousin germain", "cousine germaine"),
  secondCousin: w("cousin issu de germain", "cousine issue de germain"),
  /** Further cousins, with their degree after the word: «cousine au troisième degré». */
  cousin: w("cousin", "cousine"),
  spouse: neutral("époux", "épouse", "conjoint"),
  parentInLaw: w("beau-père", "belle-mère"),
  childInLaw: w("gendre", "belle-fille"),
  siblingInLaw: w("beau-frère", "belle-sœur"),
  coSiblingInLaw: w("époux de la belle-sœur", "épouse du beau-frère"),
  uncleByMarriage: w("oncle par alliance", "tante par alliance", "oncle/tante par alliance"),
  nephewByMarriage: w("neveu par alliance", "nièce par alliance", "neveu/nièce par alliance"),
  stepParent: w("beau-père", "belle-mère"),
  stepChild: w("beau-fils", "belle-fille"),
};

/** The degree of cousins from the third to the tenth; beyond, in figures: «au 11e degré». */
const ORDINALS = ["troisième", "quatrième", "cinquième", "sixième", "septième", "huitième", "neuvième", "dixième"];

const ANCESTORS = [words.parent, words.grandparent, words.greatGrandparent, words.greatGreatGrandparent];
const DESCENDANTS = [words.child, words.grandchild, words.greatGrandchild, words.greatGreatGrandchild];
const UNCLES = [words.uncle, words.greatUncle, words.greatGreatUncle];
const NEPHEWS = [words.nephew, words.greatNephew, words.greatGreatNephew];

/** French puts a no-break space before «:» and «;». */
const NBSP = "\u00a0";

/** Spelled out here rather than taken from the value, so renaming the value cannot change the sentence. */
const LINES = { direct: "directe", collateral: "collatérale" } as const satisfies Record<LegalDegree["line"], string>;

/** 1er, 2e, 3e… */
const ordinal = (n: number) => (n === 1 ? "1er" : `${n}e`);

export const fr: KinshipLocale = {
  code: "fr",

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
        return bloodName(BLOOD, bloodPart(query), sex, sexes, "bare");
      // No word of its own: named through one's child and the child's spouse.
      case "coParentInLaw":
        return `${words.parentInName[sex]} ${say(words.spouse, sexes[2], "of")} ${say(words.child, sexes[1], "of")}`;
      // The relatives by marriage the law counts (alliance) that have no word of their own are
      // named through the blood relative: the spouse of one's relative, or a relative of one's spouse.
      case "spouseOfRelative": {
        const relative = bloodName(BLOOD, bloodPart(query), sexes[sexes.length - 2], sexes.slice(0, -1), "a");
        return `${words.spouse[sex]} ${relative}`;
      }
      case "relativeOfSpouse":
        return `${bloodName(BLOOD, bloodPart(query), sex, sexes.slice(1), "bare")} ${say(words.spouse, sexes[1], "of")}`;
      case "unnamed":
        return null;
      default:
        return words[kind][sex];
    }
  },

  step: (move, sex) => words[STEP_TERMS[move]][sex],

  labelled: (label, name) => `${label}${NBSP}: ${name}`,

  degree: ({ kind, line, degree }) =>
    `Parenté ${kind === "affinity" ? "par alliance" : "par le sang"} en ligne ${LINES[line]}, au ${ordinal(degree)} degré`,

  throughMarriages: (couples) =>
    `Liés par ${couples.length > 1 ? "les mariages" : "le mariage"} de ${couples.map((couple) => couple.join(" et ")).join(`${NBSP}; `)}.`,

  commonAncestors: (names) =>
    `${names.length > 1 ? "Ancêtres communs" : "Ancêtre commun"}${NBSP}: ${list(names, "et")}`,
};

/** How a name is said: on its own; after «de», «du père», «de l'oncle»; or after «d'un», «d'une sœur». */
type Form = "bare" | "of" | "a";

/** Elided before a vowel: «de l'arrière-grand-mère», «de l'époux». No word here starts with an h. */
const VOWEL = /^[aeiouàâéèêîôœ]/;

function withArticle(form: Form, sex: "male" | "female", word: string): string {
  if (form === "bare") return word;
  if (form === "a") return `${sex === "male" ? "d'un" : "d'une"} ${word}`;
  return VOWEL.test(word) ? `de l'${word}` : `${sex === "male" ? "du" : "de la"} ${word}`;
}

/**
 * A word in the form for the sex, with its article, then `after` (which does not change with the
 * sex): «du cousin germain», «de l'ascendante au 5e degré». With an unknown sex, the neutral word
 * (masculine: «de l'enfant», «du conjoint») or both forms, each with its article: «du cousin
 * germain/de la cousine germaine».
 */
function say(word: Word, sex: Sex, form: Form = "bare", after = ""): string {
  if (form === "bare") return word[sex] + after;
  const one = (s: "male" | "female") => withArticle(form, s, word[s]);
  if (sex !== "unknown") return one(sex) + after;
  return (word.neutral ? withArticle(form, "male", word.unknown) : `${one("male")}/${one("female")}`) + after;
}

/*
 * Blood relatives by their standard names: siblings; oncle, grand-oncle, arrière-grand-oncle and
 * neveu, petit-neveu, arrière-petit-neveu; cousins by degree (cousin germain, cousin issu de
 * germain, cousin au troisième degré). Relatives of different generations beyond these have no
 * word, so they are named through the person of the same generation as the other one: «cousin
 * germain du père», «frère de l'arrière-arrière-grand-père», «fils de la cousine germaine». The
 * form is the article of the head word; the rest is always after «de».
 */
const BLOOD: BloodParts<Form> = {
  of: "of",
  ancestor,
  descendant,
  kin,
  uncle: (up, sex, form) => (up <= 4 ? say(UNCLES[up - 2], sex, form) : null),
  nephew: (down, sex, form) => (down <= 4 ? say(NEPHEWS[down - 2], sex, form) : null),
};

/** Someone of one's own generation `rung` generations below the common ancestor: a sibling (1), a cousin germain (2)… */
function kin(rung: number, sex: Sex, form: Form = "bare"): string {
  if (rung <= 3) return say([words.sibling, words.firstCousin, words.secondCousin][rung - 1], sex, form);
  return say(words.cousin, sex, form, ` au ${ORDINALS[rung - 4] ?? ordinal(rung - 1)} degré`);
}

/** père, grand-père, arrière-grand-père, arrière-arrière-grand-père, then «ascendant au 5e degré». */
function ancestor(generations: number, sex: Sex, form: Form = "bare"): string {
  if (generations > 4) return say(words.ascendant, sex, form, ` au ${ordinal(generations)} degré`);
  // «parent» only on its own: «du parent» would read "of the relative", so «du père/de la mère».
  if (generations === 1 && form !== "bare") return say(words.parentInName, sex, form);
  return say(ANCESTORS[generations - 1], sex, form);
}

/** fils, petit-fils, arrière-petit-fils, arrière-arrière-petit-fils, then «descendant au 5e degré». */
function descendant(generations: number, sex: Sex, form: Form = "bare"): string {
  if (generations > 4) return say(words.descendant, sex, form, ` au ${ordinal(generations)} degré`);
  return say(DESCENDANTS[generations - 1], sex, form);
}
