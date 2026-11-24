import { intlLocale, type Locale } from "@/shared/i18n";
import type { FuzzyDate, Tree, TreePerson } from "./model";

/*
 * How a person of the tree is shown, in Greek or English: the name, the nickname, the surname at
 * birth, the years and dates, the initials, and the name of someone locked to the reader. Every
 * page, card and search result asks here, so a person reads the same everywhere.
 */

const words: Record<
  Locale,
  { approx: string; born: string; died: string; nee: (name: string) => string; locked: string }
> = {
  el: { approx: "περ.", born: "γ.", died: "π.", nee: (name) => `το γένος ${name}`, locked: "Μέλος της οικογένειας" },
  en: { approx: "c.", born: "b.", died: "d.", nee: (name) => `née ${name}`, locked: "Family member" },
};

export const fullName = (person: Pick<TreePerson, "given_name" | "surname">) =>
  [person.given_name, person.surname].filter(Boolean).join(" ");

/** «Μπαρμπαστέλιος» in quotes, or null without one. */
export const nickname = (person: Pick<TreePerson, "nickname">) => (person.nickname ? `«${person.nickname}»` : null);

/** The surname at birth, when it differs from the one the person is known by (a married woman's). */
export const birthSurname = (person: Pick<TreePerson, "surname" | "birth_surname">) =>
  person.birth_surname && person.birth_surname !== person.surname ? person.birth_surname : null;

/** «το γένος Γεωργίου», when the surname at birth differs; null otherwise. */
export function nee(person: Pick<TreePerson, "surname" | "birth_surname">, locale: Locale) {
  const name = birthSurname(person);
  return name ? words[locale].nee(name) : null;
}

/** Up to two capital letters for an avatar without a photo, e.g. «ΣΠ» for Στέλιος Παπαδόπουλος. */
export const initials = (person: Pick<TreePerson, "given_name" | "surname">) =>
  [person.given_name, person.surname]
    .filter(Boolean)
    .map((name) => name[0])
    .join("")
    .toUpperCase();

/** «12 Μαρτίου 1920», «Μάρτιος 1920», «1920», with «περ.» in front when approximate. */
export function formatFuzzyDate(date: FuzzyDate | undefined, locale: Locale) {
  if (!date?.year) return "";
  const at = new Date(Date.UTC(date.year, (date.month ?? 1) - 1, date.day ?? 1));
  const options: Intl.DateTimeFormatOptions = date.day
    ? { day: "numeric", month: "long", year: "numeric" }
    : date.month
      ? { month: "long", year: "numeric" }
      : { year: "numeric" };
  const text = new Intl.DateTimeFormat(intlLocale[locale], { ...options, timeZone: "UTC" }).format(at);
  return date.approx ? `${words[locale].approx} ${text}` : text;
}

/** Keeps the parts of a lifespan on one line: a no-break space, and a word joiner around the dash. */
const NBSP = " ";
export const YEAR_DASH = "⁠–⁠";

/**
 * «1890–1962», «γ. 1952», «π. 1944». Empty when no year is known. It never breaks across lines
 * («1925–» / «2010» in a narrow column).
 */
export function lifespan(person: Pick<TreePerson, "birth" | "death" | "living">, locale: Locale) {
  const { approx, born: bornWord, died: diedWord } = words[locale];
  const year = (date: FuzzyDate | undefined) =>
    date?.year ? `${date.approx ? `${approx}${NBSP}` : ""}${date.year}` : "";
  const born = year(person.birth);
  const died = year(person.death);
  if (born && died) return `${born}${YEAR_DASH}${died}`;
  if (born) return person.living ? `${bornWord}${NBSP}${born}` : `${born}${YEAR_DASH}`;
  if (died) return `${diedWord}${NBSP}${died}`;
  return "";
}

/**
 * The tree with a name for the people locked to visitors («Μέλος της οικογένειας»), so every card,
 * chain and caption can show them like anyone else.
 */
export function nameLockedPeople(tree: Tree, locale: Locale): Tree {
  if (!tree.people.some((person) => person.locked)) return tree;
  const name = words[locale].locked;
  return {
    ...tree,
    people: tree.people.map((person) => (person.locked ? { ...person, given_name: name, surname: "" } : person)),
  };
}
