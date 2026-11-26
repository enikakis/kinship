import type { Sex } from "./types";

/**
 * A person as read from a GEDCOM file. `name` is the whole name; `given` and `surname` are its
 * parts. `born` and `died` are years, `birthPlace` and `deathPlace` the places as written. Each
 * optional field is left out when unknown.
 */
export type GedcomPerson = {
  id: string;
  sex: Sex;
  name: string;
  given?: string;
  surname?: string;
  born?: number;
  died?: number;
  birthPlace?: string;
  deathPlace?: string;
};

/** Two partners of a family, with the year and place of the marriage when the file gives them. */
export type GedcomUnion = { a: string; b: string; married?: number; place?: string };

/** What `fromGedcom` returns: the input of `createTree`, with the unions' details. */
export type GedcomInput = {
  people: GedcomPerson[];
  parents: [parentId: string, childId: string][];
  unions: GedcomUnion[];
};

type Line = { level: number; xref?: string; tag: string; value: string };

const LINE = /^\s*(\d+)\s+(?:@([^@\s]+)@\s+)?(\S+)(?:\s+(.*))?$/;

/** Splits text into lines (any line end), skipping blank and malformed ones. A BOM counts as leading space. */
function tokenize(text: string): Line[] {
  const lines: Line[] = [];
  for (const raw of text.split(/\r\n|\n|\r/)) {
    const match = LINE.exec(raw);
    if (!match) continue;
    lines.push({ level: Number(match[1]), xref: match[2], tag: match[3]!, value: (match[4] ?? "").trim() });
  }
  return lines;
}

/** The id inside a pointer value such as "@I1@", or undefined. */
const pointer = (value: string): string | undefined => {
  const id = /^@([^@\s]+)@$/.exec(value)?.[1];
  return id === "VOID" ? undefined : id;
};

const cleanPart = (value: string) => value.replace(/@@/g, "@").replace(/\s+/g, " ").trim();

const cleanName = (value: string) => cleanPart(value.replace(/\//g, " "));

/** The part of a NAME value before the first slash, and the one between the first and second. */
const nameParts = (value: string): { given: string; surname: string } => {
  const [given = "", surname = ""] = value.split("/");
  return { given: cleanPart(given), surname: cleanPart(surname) };
};

/** A place without its empty parts: GEDCOM leaves blanks between commas for unknown levels. */
const cleanPlace = (value: string) => value.split(",").map(cleanPart).filter(Boolean).join(", ");

/** A Hebrew or French Republican calendar, or a year before the common era: no usable year. */
const OTHER_CALENDAR = /HEBREW|FRENCH|\bB\.?C\.?(?:E\.?)?(?=\s|$)|\bBCE\b/i;

/** The first 3-4 digit number bounded by non-digits (no lookbehind: older Safari can't parse one). */
const YEAR = /(?:^|\D)(\d{3,4})(?!\d)/;

const yearOf = (value: string): number | undefined => {
  if (OTHER_CALENDAR.test(value)) return undefined;
  const digits = YEAR.exec(value)?.[1];
  return digits === undefined ? undefined : Number(digits);
};

/** A copy of an object without its undefined values, so optional fields are omitted, not undefined. */
const compact = <T extends object>(value: T): T =>
  Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;

const sexOf = (value: string): Sex => (value === "M" ? "male" : value === "F" ? "female" : "unknown");

/**
 * Reads the people and families of a GEDCOM file (5.5.1 or 7), already decoded to text, into the
 * input of `createTree`. It reads `INDI` records (the first usable `NAME`, with slashes removed and
 * `@@` read as `@`; its `given` name is the part before the first slash and its `surname` the part
 * between the first and second, and only when one of those is empty, the `GIVN` values, or the
 * `SPFX` then `SURN` values, under that same `NAME`, repeats joined with a space; `SEX`; the birth
 * and death years from `BIRT`/`DEAT` `DATE`, left out for Hebrew, French Republican and BC dates;
 * the places from `BIRT`/`DEAT` `PLAC`, without the empty parts between commas) and `FAM` records
 * (`HUSB`, `WIFE`, `CHIL`; for a couple, the marriage year and place from `MARR` `DATE` and `PLAC`,
 * read like the birth ones). Each field takes the first usable value. Everything else is ignored,
 * and it never throws on malformed lines. A `CHIL` that points at a person who is not in the file
 * stays in `parents`; `createTree` skips it.
 *
 * `createTree` reads `name` by default but not `born`, so pass it on, as in the example.
 *
 * @param text The file's contents, already decoded to a string.
 * @returns People, `[parentId, childId]` links and unions (with `married` and `place` when known),
 * ready for `createTree`.
 *
 * @example
 * ```ts
 * import { createTree } from "@enikakis99/kinship";
 * import { fromGedcom } from "@enikakis99/kinship/gedcom";
 *
 * const text = [
 *   "0 @I1@ INDI",
 *   "1 NAME Anna /Rossi/",
 *   "1 SEX F",
 *   "1 BIRT",
 *   "2 DATE 12 MAR 1950",
 *   "0 @I2@ INDI",
 *   "1 NAME Basil /Rossi/",
 *   "0 @F1@ FAM",
 *   "1 HUSB @I2@",
 *   "1 WIFE @I1@",
 * ].join("\n");
 * fromGedcom(text);
 * // { people: [{ id: "I1", sex: "female", name: "Anna Rossi", given: "Anna", surname: "Rossi", born: 1950 },
 * //            { id: "I2", sex: "unknown", name: "Basil Rossi", given: "Basil", surname: "Rossi" }],
 * //   parents: [], unions: [{ a: "I2", b: "I1" }] }
 * const tree = createTree(fromGedcom(text), { born: (p) => p.born });
 * ```
 */
export function fromGedcom(text: string): GedcomInput {
  const people: GedcomPerson[] = [];
  const parents: [string, string][] = [];
  const unions: GedcomUnion[] = [];

  let person: (Omit<GedcomPerson, "name"> & { name?: string }) | undefined;
  let usedName = false; // the current level-1 line is the NAME that gave `name`
  let slashes = { given: false, surname: false }; // which parts the used NAME's slashes gave
  let tagged = { GIVN: [] as string[], SPFX: [] as string[], SURN: [] as string[] }; // under the used NAME
  let family: { husb?: string; wife?: string; children: string[]; married?: number; place?: string } | undefined;
  let section = "";

  const finish = () => {
    if (person) {
      const { id, sex, name, ...details } = person;
      people.push(compact<GedcomPerson>({ id, sex, name: name || id, ...details }));
    }
    if (family) {
      const { husb, wife, children, married, place } = family;
      if (husb !== undefined && wife !== undefined) {
        unions.push(compact<GedcomUnion>({ a: husb, b: wife, married, place }));
      }
      for (const child of children) {
        for (const parent of [husb, wife]) if (parent !== undefined) parents.push([parent, child]);
      }
    }
    person = undefined;
    family = undefined;
    section = "";
    usedName = false;
  };

  for (const { level, xref, tag, value } of tokenize(text)) {
    if (level === 0) {
      finish();
      if (tag === "INDI" && xref) {
        person = { id: xref, sex: "unknown" };
      } else if (tag === "FAM") {
        family = { children: [] };
      }
    } else if (level === 1) {
      section = tag;
      usedName = false;
      if (person) {
        if (tag === "NAME" && !person.name) {
          person.name = cleanName(value);
          if (person.name) {
            usedName = true;
            const { given, surname } = nameParts(value);
            slashes = { given: given !== "", surname: surname !== "" };
            tagged = { GIVN: [], SPFX: [], SURN: [] };
            if (given) person.given = given;
            if (surname) person.surname = surname;
          }
        } else if (tag === "SEX") person.sex = sexOf(value);
      } else if (family) {
        const id = pointer(value);
        if (id === undefined) continue;
        if (tag === "HUSB") family.husb ??= id;
        else if (tag === "WIFE") family.wife ??= id;
        else if (tag === "CHIL") family.children.push(id);
      }
    } else if (level === 2 && family) {
      if (section === "MARR") {
        if (tag === "DATE") family.married ??= yearOf(value);
        else if (tag === "PLAC") family.place ??= cleanPlace(value) || undefined;
      }
    } else if (level === 2 && person) {
      if (usedName && (tag === "GIVN" || tag === "SPFX" || tag === "SURN")) {
        const part = cleanPart(value);
        if (part) tagged[tag].push(part);
        if (!slashes.given && tagged.GIVN.length) person.given = tagged.GIVN.join(" ");
        if (!slashes.surname && tagged.SURN.length + tagged.SPFX.length) {
          person.surname = [...tagged.SPFX, ...tagged.SURN].join(" ");
        }
      } else if (section === "BIRT" || section === "DEAT") {
        const born = section === "BIRT";
        if (tag === "DATE") {
          const key = born ? "born" : "died";
          if (person[key] === undefined) person[key] = yearOf(value);
        } else if (tag === "PLAC") {
          const key = born ? "birthPlace" : "deathPlace";
          if (person[key] === undefined) person[key] = cleanPlace(value) || undefined;
        }
      }
    }
  }
  finish();

  return { people, parents, unions };
}
