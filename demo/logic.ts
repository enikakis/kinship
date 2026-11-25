// The demo's pure logic: no DOM, so Vitest can test it directly. Imports from the library are
// types only.
import type { Person, RelationEntry, RelationToEveryone } from "@enikakis/kinship";

/** The languages on offer, in the order of the switch. */
export const LANGUAGES = [
  { code: "el", label: "Ελληνικά", experimental: false },
  { code: "en", label: "English", experimental: false },
  { code: "fr", label: "Français", experimental: true },
  { code: "de", label: "Deutsch", experimental: true },
  { code: "es", label: "Español", experimental: true },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

const isLanguage = (code: string): code is LanguageCode => LANGUAGES.some((language) => language.code === code);

/** What the URL hash keeps: the two people and the language. Anything missing or unknown is null. */
export type ViewState = { from: string | null; to: string | null; lang: LanguageCode | null };

/** Reads `#from=I29&to=I14&lang=el` (the leading `#` is optional). */
export function parseHash(hash: string): ViewState {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const text = (key: string) => {
    const value = params.get(key)?.trim();
    return value ? value : null;
  };
  const lang = text("lang");
  return { from: text("from"), to: text("to"), lang: lang !== null && isLanguage(lang) ? lang : null };
}

/** Writes the state as a hash, leaving out what is null: `#from=I29&to=I14&lang=el`. */
export function serialiseHash(state: ViewState): string {
  const params = new URLSearchParams();
  if (state.from !== null) params.set("from", state.from);
  if (state.to !== null) params.set("to", state.to);
  if (state.lang !== null) params.set("lang", state.lang);
  const query = params.toString();
  return query ? `#${query}` : "";
}

/** The first of the visitor's languages (`navigator.languages`) that the demo offers; else English. */
export function preferredLanguage(languages: readonly string[]): LanguageCode {
  for (const tag of languages) {
    const code = tag.toLowerCase().split("-")[0] ?? "";
    if (isLanguage(code)) return code;
  }
  return "en";
}

/** The library's names are in-sentence forms («θεία», "first cousin"); this is the display form. */
export function capitalise(text: string, lang: string): string {
  const [first, ...rest] = text;
  return first === undefined ? text : first.toLocaleUpperCase(lang) + rest.join("");
}

/** A person as the pickers list them. */
export type Listed = { id: string; name: string; born?: number | undefined };

/**
 * A label for each person in the pickers, by id: the name with the birth year when known, made
 * unique with the id when two people would otherwise read the same.
 */
export function pickerLabels(people: readonly Listed[]): Map<string, string> {
  const plain = (person: Listed) => (person.born === undefined ? person.name : `${person.name} (${person.born})`);
  const counts = new Map<string, number>();
  for (const person of people) counts.set(plain(person), (counts.get(plain(person)) ?? 0) + 1);
  return new Map(
    people.map((person) => {
      const label = plain(person);
      return [person.id, counts.get(label)! > 1 ? `${label} [${person.id}]` : label];
    }),
  );
}

/**
 * The person a picker's text means: an exact label, else the one label or name that matches it
 * ignoring case and extra spaces. Null when nothing or more than one person matches.
 */
export function resolvePerson(text: string, labels: ReadonlyMap<string, string>, names: ReadonlyMap<string, string>) {
  for (const [id, label] of labels) if (label === text) return id;
  const wanted = normalise(text);
  if (!wanted) return null;
  const matches = new Set<string>();
  for (const [id, label] of labels) if (normalise(label) === wanted) matches.add(id);
  for (const [id, name] of names) if (normalise(name) === wanted) matches.add(id);
  return matches.size === 1 ? [...matches][0]! : null;
}

const normalise = (text: string) => text.trim().replace(/\s+/g, " ").toLocaleLowerCase();

/** The groups of "Everyone, as seen from…", in display order. */
export const GROUPS = [
  { key: "ancestors", title: "Ancestors" },
  { key: "descendants", title: "Descendants" },
  { key: "blood", title: "Other blood relatives" },
  { key: "marriage", title: "By marriage" },
  { key: "unnamed", title: "Through marriage, no everyday name" },
] as const;

export type GroupKey = (typeof GROUPS)[number]["key"];

export type Group<P extends Person> = {
  key: GroupKey;
  title: string;
  entries: { id: string; entry: RelationEntry<P> }[];
};

/** Which group an entry of `relateAll` belongs to, by the kind of its main relationship. */
export function groupOf<P extends Person>(entry: RelationEntry<P>): GroupKey {
  switch (entry.main.kind) {
    case "ancestor":
      return "ancestors";
    case "descendant":
      return "descendants";
    case "sibling":
    case "halfSibling":
    case "uncle":
    case "nephew":
    case "cousin":
      return "blood";
    case "unnamed":
      return "unnamed";
    default:
      return "marriage";
  }
}

/**
 * `relateAll`'s results in groups (ancestors, descendants, other blood relatives, by marriage, and
 * through marriage with no everyday name), each closest first: by the number of steps in the chain, then
 * in the order of the tree's people. Empty groups are left out.
 */
export function groupEveryone<P extends Person>(everyone: RelationToEveryone<P>): Group<P>[] {
  const byKey = new Map<GroupKey, Group<P>["entries"]>(GROUPS.map(({ key }) => [key, []]));
  for (const [id, entry] of everyone) byKey.get(groupOf(entry))!.push({ id, entry });
  return GROUPS.flatMap(({ key, title }) => {
    const entries = byKey.get(key)!;
    // Array.prototype.sort is stable, so equal lengths keep the order of the tree's people.
    entries.sort((a, b) => a.entry.main.moves.length - b.entry.main.moves.length);
    return entries.length === 0 ? [] : [{ key, title, entries }];
  });
}

/** A function that remembers its recent answers, and can say whether it remembers one. */
export type Remembering<A extends readonly unknown[], R> = ((...args: A) => R) & {
  /** Whether the answer for these arguments is remembered, so a call would cost nothing. */
  has(...args: A): boolean;
};

/**
 * `compute`, remembering its last `count` answers: called again with the same arguments (by
 * identity), it returns that answer without computing; a new answer pushes out the one used least
 * recently. The demo keeps `relateAll` for the last two first people this way, so switching the
 * language or the second person, or swapping the two and back, does not search the tree again.
 */
export function rememberLast<A extends readonly unknown[], R>(
  compute: (...args: A) => R,
  count = 1,
): Remembering<A, R> {
  /** Most recently used first. */
  let recent: { args: A; result: R }[] = [];
  const find = (args: A) =>
    recent.find((entry) => entry.args.length === args.length && args.every((arg, i) => Object.is(arg, entry.args[i])));
  const remembering = (...args: A) => {
    const entry = find(args) ?? { args, result: compute(...args) };
    recent = [entry, ...recent.filter((other) => other !== entry)].slice(0, count);
    return entry.result;
  };
  return Object.assign(remembering, { has: (...args: A) => find(args) !== undefined });
}
