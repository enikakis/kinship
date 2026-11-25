import type { LegalDegree } from "../degree";
import type { KinshipLocale } from "../locale";
import type { Sex } from "../types";
import { bloodName, bloodPart, list, STEP_TERMS, w, type BloodParts } from "./shared";

/*
 * German. Experimental: the terms come from the sources in docs/locales/de.md and await a native
 * speaker's review. Names need the sex of the person named and, inside longer names, the genitive
 * after the head noun: «Ehefrau eines Cousins des Vaters». With an unknown sex both forms are
 * given, «Onkel/Tante», except for the neutral words such as Elternteil, Kind and Ehepartner.
 */

/** A noun in the nominative and the genitive; its gender picks the article: «des Vaters», «der Mutter». */
type Noun = { nom: string; gen: string; gender: "m" | "f" | "n" };

/** A noun by the sex of the person it names; for an unknown sex, a neutral noun if there is one. */
type Term = { male: Noun; female: Noun; unknown?: Noun };

const masculine = (nom: string, gen = `${nom}s`): Noun => ({ nom, gen, gender: "m" });
/** A weak masculine noun, with -n or -en in the genitive: «des Neffen», «des Vorfahren». */
const weak = (nom: string): Noun => masculine(nom, nom.endsWith("e") ? `${nom}n` : `${nom}en`);
const feminine = (nom: string): Noun => ({ nom, gen: nom, gender: "f" });
const neuter = (nom: string, gen = `${nom}es`): Noun => ({ nom, gen, gender: "n" });

const term = (male: Noun, female: Noun, unknown?: Noun): Term => ({ male, female, unknown });
/** A masculine and a feminine noun that differ by a suffix: «Enkel», «Enkelin». */
const pair = (male: string, female: string, unknown?: Noun): Term => term(masculine(male), feminine(female), unknown);

/** The nouns that also go in the genitive, inside longer names. */
const nouns = {
  parent: pair("Vater", "Mutter", masculine("Elternteil")),
  grandparent: pair("Großvater", "Großmutter"),
  greatGrandparent: pair("Urgroßvater", "Urgroßmutter"),
  greatGreatGrandparent: pair("Ururgroßvater", "Ururgroßmutter"),
  greatGreatGreatGrandparent: pair("Urururgroßvater", "Urururgroßmutter"),
  ancestor: term(weak("Vorfahr"), feminine("Vorfahrin")),
  child: term(masculine("Sohn", "Sohnes"), feminine("Tochter"), neuter("Kind")),
  grandchild: pair("Enkel", "Enkelin", neuter("Enkelkind")),
  greatGrandchild: pair("Urenkel", "Urenkelin", neuter("Urenkelkind")),
  greatGreatGrandchild: pair("Ururenkel", "Ururenkelin"),
  greatGreatGreatGrandchild: pair("Urururenkel", "Urururenkelin"),
  descendant: term(weak("Nachkomme"), feminine("Nachkommin")),
  sibling: pair("Bruder", "Schwester"),
  halfSibling: pair("Halbbruder", "Halbschwester"),
  uncle: pair("Onkel", "Tante"),
  greatUncle: pair("Großonkel", "Großtante"),
  greatGreatUncle: pair("Urgroßonkel", "Urgroßtante"),
  nephew: term(weak("Neffe"), feminine("Nichte")),
  greatNephew: term(weak("Großneffe"), feminine("Großnichte")),
  greatGreatNephew: term(weak("Urgroßneffe"), feminine("Urgroßnichte")),
  /** Cousins of every degree, with the degree after the noun from the second: «Cousine 2. Grades». */
  cousin: pair("Cousin", "Cousine"),
  spouse: term(masculine("Ehemann", "Ehemannes"), feminine("Ehefrau"), masculine("Ehepartner")),
};

/** The named relations by marriage, never inside a longer name. */
const words = {
  parentInLaw: w("Schwiegervater", "Schwiegermutter"),
  childInLaw: w("Schwiegersohn", "Schwiegertochter", "Schwiegerkind"),
  siblingInLaw: w("Schwager", "Schwägerin"),
  coSiblingInLaw: w("Schwippschwager", "Schwippschwägerin"),
  uncleByMarriage: w("angeheirateter Onkel", "angeheiratete Tante"),
  nephewByMarriage: w("angeheirateter Neffe", "angeheiratete Nichte"),
  stepParent: w("Stiefvater", "Stiefmutter", "Stiefelternteil"),
  stepChild: w("Stiefsohn", "Stieftochter", "Stiefkind"),
};

const ANCESTORS = [
  nouns.parent,
  nouns.grandparent,
  nouns.greatGrandparent,
  nouns.greatGreatGrandparent,
  nouns.greatGreatGreatGrandparent,
];
const DESCENDANTS = [
  nouns.child,
  nouns.grandchild,
  nouns.greatGrandchild,
  nouns.greatGreatGrandchild,
  nouns.greatGreatGreatGrandchild,
];
const UNCLES = [nouns.uncle, nouns.greatUncle, nouns.greatGreatUncle];
const NEPHEWS = [nouns.nephew, nouns.greatNephew, nouns.greatGreatNephew];

/** Spelled out here rather than taken from the value, so renaming the value cannot change the sentence. */
const LINES = { direct: "in gerader Linie", collateral: "in der Seitenlinie" } as const satisfies Record<
  LegalDegree["line"],
  string
>;

export const de: KinshipLocale = {
  code: "de",

  name(query) {
    const { kind, sexes } = query;
    const sex = sexes[sexes.length - 1];
    switch (kind) {
      case "sibling":
      case "halfSibling":
      case "spouse":
        return say(nouns[kind], sex);
      case "ancestor":
      case "descendant":
      case "uncle":
      case "nephew":
      case "cousin":
        return bloodName(BLOOD, bloodPart(query), sex, sexes, "bare");
      // No word in general use (Gegenschwiegervater is regional): named through one's child.
      case "coParentInLaw":
        return `${words.parentInLaw[sex]} ${say(nouns.child, sexes[1], "of")}`;
      // The relatives by marriage the law counts (Schwägerschaft) that have no word of their own
      // are named through the blood relative: the spouse of one's relative, or a relative of one's spouse.
      case "spouseOfRelative": {
        const relative = bloodName(BLOOD, bloodPart(query), sexes[sexes.length - 2], sexes.slice(0, -1), "a");
        return `${say(nouns.spouse, sex)} ${relative}`;
      }
      case "relativeOfSpouse":
        return `${bloodName(BLOOD, bloodPart(query), sex, sexes.slice(1), "bare")} ${say(nouns.spouse, sexes[1], "of")}`;
      case "unnamed":
        return null;
      default:
        return words[kind][sex];
    }
  },

  step: (move, sex) => say(nouns[STEP_TERMS[move]], sex),

  labelled: (label, name) => `${label}: ${name}`,

  degree: ({ kind, line, degree }) =>
    `${kind === "affinity" ? "Verschwägert" : "Verwandt"} ${LINES[line]} im ${degree}. Grad`,

  throughMarriages: (couples) =>
    `Verbunden über die ${couples.length > 1 ? "Ehen" : "Ehe"} von ${couples.map((couple) => couple.join(" und ")).join("; ")}.`,

  commonAncestors: (names) =>
    `${names.length > 1 ? "Gemeinsame Vorfahren" : "Gemeinsamer Vorfahr"}: ${list(names, "und")}`,
};

/** How a name is said: on its own; in the genitive, «des Vaters»; or in the genitive with «ein», «einer Cousine». */
type Form = "bare" | "of" | "a";

const ARTICLES = {
  of: { m: "des", f: "der", n: "des" },
  a: { m: "eines", f: "einer", n: "eines" },
} as const;

/**
 * A noun in the form for the sex, with its article, then `after` (which does not change with the
 * sex or the case): «des Cousins 2. Grades». With an unknown sex, the neutral noun or both forms,
 * each with its article: «des Cousins/der Cousine», «Cousin/Cousine 2. Grades».
 */
function say(term: Term, sex: Sex, form: Form = "bare", after = ""): string {
  const one = (noun: Noun) => (form === "bare" ? noun.nom : `${ARTICLES[form][noun.gender]} ${noun.gen}`);
  if (sex !== "unknown") return one(term[sex]) + after;
  return (term.unknown ? one(term.unknown) : `${one(term.male)}/${one(term.female)}`) + after;
}

/*
 * Blood relatives by their standard names: siblings; Onkel, Großonkel, Urgroßonkel and Neffe,
 * Großneffe, Urgroßneffe; cousins by degree (Cousin, Cousin 2. Grades). Relatives of different
 * generations beyond these have no word, so they are named through the person of the same
 * generation as the other one: «Cousin des Vaters», «Bruder des Ururgroßvaters», «Sohn der
 * Cousine». The form is that of the head noun; the rest is always in the genitive.
 */
const BLOOD: BloodParts<Form> = {
  of: "of",
  ancestor,
  descendant,
  kin,
  uncle: (up, sex, form) => (up <= 4 ? say(UNCLES[up - 2], sex, form) : null),
  nephew: (down, sex, form) => (down <= 4 ? say(NEPHEWS[down - 2], sex, form) : null),
};

/** Someone of one's own generation `rung` generations below the common ancestor: a sibling (1), a cousin (2)… */
function kin(rung: number, sex: Sex, form: Form = "bare"): string {
  if (rung === 1) return say(nouns.sibling, sex, form);
  return say(nouns.cousin, sex, form, rung > 2 ? ` ${rung - 1}. Grades` : "");
}

/** Vater, Großvater, Urgroßvater, Ururgroßvater, Urururgroßvater, then «Vorfahr 6. Grades». */
function ancestor(generations: number, sex: Sex, form: Form = "bare"): string {
  if (generations > 5) return say(nouns.ancestor, sex, form, ` ${generations}. Grades`);
  // «des Elternteils» reads oddly, as there are two: «Cousin eines Elternteils».
  if (generations === 1 && sex === "unknown" && form === "of") return say(nouns.parent, sex, "a");
  return say(ANCESTORS[generations - 1], sex, form);
}

/** Sohn, Enkel, Urenkel, Ururenkel, Urururenkel, then «Nachkomme 6. Grades». */
function descendant(generations: number, sex: Sex, form: Form = "bare"): string {
  if (generations > 5) return say(nouns.descendant, sex, form, ` ${generations}. Grades`);
  return say(DESCENDANTS[generations - 1], sex, form);
}
