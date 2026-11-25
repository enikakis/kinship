import type { LegalDegree } from "../degree";
import type { KinshipLocale } from "../locale";
import type { Sex } from "../types";
import { type BloodParts, bloodName, bloodPart, list, neutral, STEP_TERMS, type Word, w } from "./shared";

/*
 * Spanish. Experimental: the terms come from the sources in docs/locales/es.md and await a native
 * speaker's review. Names need the sex of the person named and, inside longer names, «de» with the
 * article, «de el» contracted to «del»: «esposa de un primo hermano del padre». Adjectives and
 * ordinals agree and come after the noun: «tía abuela», «prima tercera». With an unknown sex both
 * forms are given, «tío/tía», except for the neutral word cónyuge.
 */

/** A word the same for both sexes, with only the article telling them apart: «el/la cónyuge». */
const common = (word: string): Word => neutral(word, word, word);

const words = {
  parent: w("padre", "madre"),
  grandparent: w("abuelo", "abuela"),
  greatGrandparent: w("bisabuelo", "bisabuela"),
  greatGreatGrandparent: w("tatarabuelo", "tatarabuela"),
  child: w("hijo", "hija"),
  grandchild: w("nieto", "nieta"),
  greatGrandchild: w("bisnieto", "bisnieta"),
  greatGreatGrandchild: w("tataranieto", "tataranieta"),
  sibling: w("hermano", "hermana"),
  halfSibling: w("medio hermano", "media hermana"),
  uncle: w("tío", "tía"),
  greatUncle: w("tío abuelo", "tía abuela"),
  greatGreatUncle: w("tío bisabuelo", "tía bisabuela"),
  nephew: w("sobrino", "sobrina"),
  greatNephew: w("sobrino nieto", "sobrina nieta"),
  greatGreatNephew: w("sobrino bisnieto", "sobrina bisnieta"),
  firstCousin: w("primo hermano", "prima hermana"),
  spouse: neutral("esposo", "esposa", "cónyuge"),
  parentInLaw: w("suegro", "suegra"),
  childInLaw: w("yerno", "nuera"),
  siblingInLaw: w("cuñado", "cuñada"),
  coParentInLaw: w("consuegro", "consuegra"),
  coSiblingInLaw: w("concuñado", "concuñada"),
  uncleByMarriage: w("tío político", "tía política"),
  nephewByMarriage: w("sobrino político", "sobrina política"),
  stepParent: w("padrastro", "madrastra"),
  stepChild: w("hijastro", "hijastra"),
};

/** Ordinals from the first to the twentieth, masculine, in their full form. */
const ORDINALS = [
  "primero",
  "segundo",
  "tercero",
  "cuarto",
  "quinto",
  "sexto",
  "séptimo",
  "octavo",
  "noveno",
  "décimo",
  "undécimo",
  "duodécimo",
  "decimotercero",
  "decimocuarto",
  "decimoquinto",
  "decimosexto",
  "decimoséptimo",
  "decimoctavo",
  "decimonoveno",
  "vigésimo",
];

const ANCESTORS = [words.parent, words.grandparent, words.greatGrandparent, words.greatGreatGrandparent];
const DESCENDANTS = [words.child, words.grandchild, words.greatGrandchild, words.greatGreatGrandchild];
const UNCLES = [words.uncle, words.greatUncle, words.greatGreatUncle];
const NEPHEWS = [words.nephew, words.greatNephew, words.greatGreatNephew];

/** Spelled out here rather than taken from the value, so renaming the value cannot change the sentence. */
const LINES = { direct: "recta", collateral: "colateral" } as const satisfies Record<LegalDegree["line"], string>;

/**
 * The ordinal before «grado», shortened as before any masculine noun: «primer», «tercer»,
 * «decimotercer», «segundo»; from the 21st in figures: «21.er», «22.º».
 */
function gradeOrdinal(n: number): string {
  if (n <= ORDINALS.length) return ORDINALS[n - 1].replace(/(prim|terc)ero$/, "$1er");
  // The figures stand for words: 21 «vigésimo primer», 23 «vigésimo tercer», but 11 «undécimo».
  const shortened = (n % 10 === 1 && n % 100 !== 11) || n % 10 === 3;
  return `${n}${shortened ? ".er" : ".º"}`;
}

export const es: KinshipLocale = {
  code: "es",

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
      // The relatives by marriage the law counts (afinidad) that have no word of their own are
      // named through the blood relative: the spouse of one's relative, or a relative of one's spouse.
      case "spouseOfRelative": {
        const relative = bloodName(BLOOD, bloodPart(query), sexes[sexes.length - 2], sexes.slice(0, -1), "a");
        return `${words.spouse[sex]} de ${relative}`;
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

  labelled: (label, name) => `${label}: ${name}`,

  degree: ({ kind, line, degree }) =>
    `Parentesco por ${kind === "affinity" ? "afinidad" : "consanguinidad"} en línea ${LINES[line]}, de ${gradeOrdinal(degree)} grado`,

  throughMarriages: (couples) =>
    `Parentesco a través ${couples.length > 1 ? "de los matrimonios" : "del matrimonio"} de ${couples
      .map((couple) => couple.join(" y "))
      .join("; ")}.`,

  commonAncestors: (names) => `${names.length > 1 ? "Antepasados comunes" : "Antepasado común"}: ${list(names, "y")}`,
};

/** How a name is said: on its own; after «de», «del padre», «de la madre»; or after «de», «un primo», «una tía». */
type Form = "bare" | "of" | "a";

const ARTICLES = {
  of: { male: "del", female: "de la" },
  a: { male: "un", female: "una" },
} as const satisfies Record<Exclude<Form, "bare">, Record<"male" | "female", string>>;

/**
 * A word in the form for the sex, with its article: «del primo hermano», «una prima segunda». With
 * an unknown sex, a neutral word takes the generic masculine article («del cónyuge», «del
 * ascendiente de quinto grado»); otherwise both forms, each with its article: «del primo
 * hermano/de la prima hermana».
 */
function say(word: Word, sex: Sex, form: Form = "bare"): string {
  if (form === "bare") return word[sex];
  const one = (s: "male" | "female") => `${ARTICLES[form][s]} ${word[s]}`;
  if (sex !== "unknown") return one(sex);
  return word.neutral ? `${ARTICLES[form].male} ${word.unknown}` : `${one("male")}/${one("female")}`;
}

/*
 * Blood relatives by their standard names: siblings; tío, tío abuelo, tío bisabuelo and sobrino,
 * sobrino nieto, sobrino bisnieto; cousins by an ordinal after the noun (primo hermano, primo
 * segundo, primo tercero). Relatives of different generations beyond these have no word, so they
 * are named through the person of the same generation as the other one: «primo hermano del padre»,
 * «hermano del tatarabuelo», «hijo de la prima hermana». The form is the article of the head
 * word; the rest is always after «de».
 */
const BLOOD: BloodParts<Form> = {
  of: "of",
  ancestor: (generations, sex, form) => say(ancestor(generations), sex, form),
  descendant: (generations, sex, form) => say(descendant(generations), sex, form),
  kin: (rung, sex, form) => say(kin(rung), sex, form),
  uncle: (up, sex, form) => (up <= 4 ? say(UNCLES[up - 2], sex, form) : null),
  nephew: (down, sex, form) => (down <= 4 ? say(NEPHEWS[down - 2], sex, form) : null),
};

/**
 * Someone of one's own generation `rung` generations below the common ancestor: a sibling (1), a
 * primo hermano (2), then cousins by an ordinal that agrees, in words up to the tenth: «prima
 * tercera», «primo 11.º».
 */
function kin(rung: number): Word {
  if (rung === 1) return words.sibling;
  if (rung === 2) return words.firstCousin;
  const degree = rung - 1;
  if (degree > 10) return w(`primo ${degree}.º`, `prima ${degree}.ª`);
  const ordinal = ORDINALS[degree - 1];
  return w(`primo ${ordinal}`, `prima ${ordinal.slice(0, -1)}a`);
}

/** padre, abuelo, bisabuelo, tatarabuelo, then «ascendiente de quinto grado». */
function ancestor(generations: number): Word {
  return ANCESTORS[generations - 1] ?? common(`ascendiente de ${gradeOrdinal(generations)} grado`);
}

/** hijo, nieto, bisnieto, tataranieto, then «descendiente de quinto grado». */
function descendant(generations: number): Word {
  return DESCENDANTS[generations - 1] ?? common(`descendiente de ${gradeOrdinal(generations)} grado`);
}
