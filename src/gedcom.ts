import type { Sex, TreeInput } from "./types";

/** A person as read from a GEDCOM file. `born` is the birth year, left out when unknown. */
export type GedcomPerson = { id: string; sex: Sex; name: string; born?: number };

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

const cleanName = (value: string) => value.replace(/@@/g, "@").replace(/\//g, " ").replace(/\s+/g, " ").trim();

/** A Hebrew or French Republican calendar, or a year before the common era: no usable year. */
const OTHER_CALENDAR = /HEBREW|FRENCH|\bB\.?C\.?(?:E\.?)?(?=\s|$)|\bBCE\b/i;

/** The first 3-4 digit number bounded by non-digits (no lookbehind: older Safari can't parse one). */
const YEAR = /(?:^|\D)(\d{3,4})(?!\d)/;

const birthYear = (value: string): number | undefined => {
  if (OTHER_CALENDAR.test(value)) return undefined;
  const digits = YEAR.exec(value)?.[1];
  return digits === undefined ? undefined : Number(digits);
};

const sexOf = (value: string): Sex => (value === "M" ? "male" : value === "F" ? "female" : "unknown");

/**
 * Reads the people and families of a GEDCOM file (5.5.1 or 7), already decoded to text, into the
 * input of `createTree`. It reads `INDI` records (the first usable `NAME`, with slashes removed and
 * `@@` read as `@`; `SEX`; the birth year from `BIRT`/`DATE`, left out for Hebrew, French
 * Republican and BC dates) and `FAM` records (`HUSB`, `WIFE`, `CHIL`); everything else is ignored,
 * and it never throws on malformed lines. A `CHIL` that points at a person who is not in the file
 * stays in `parents`; `createTree` skips it.
 *
 * `createTree` reads `name` by default but not `born`, so pass it on:
 *
 * ```ts
 * const tree = createTree(fromGedcom(text), { born: (p) => p.born });
 * ```
 */
export function fromGedcom(text: string): TreeInput<GedcomPerson> {
  const people: GedcomPerson[] = [];
  const parents: [string, string][] = [];
  const unions: { a: string; b: string }[] = [];

  let person: { id: string; sex: Sex; name?: string; born?: number } | undefined;
  let family: { husb?: string; wife?: string; children: string[] } | undefined;
  let section = "";

  const finish = () => {
    if (person) {
      const { id, sex, name, born } = person;
      people.push({ id, sex, name: name || id, ...(born === undefined ? {} : { born }) });
    }
    if (family) {
      const { husb, wife, children } = family;
      if (husb !== undefined && wife !== undefined) unions.push({ a: husb, b: wife });
      for (const child of children) {
        for (const parent of [husb, wife]) if (parent !== undefined) parents.push([parent, child]);
      }
    }
    person = undefined;
    family = undefined;
    section = "";
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
      if (person) {
        if (tag === "NAME" && !person.name) person.name = cleanName(value);
        else if (tag === "SEX") person.sex = sexOf(value);
      } else if (family) {
        const id = pointer(value);
        if (id === undefined) continue;
        if (tag === "HUSB") family.husb ??= id;
        else if (tag === "WIFE") family.wife ??= id;
        else if (tag === "CHIL") family.children.push(id);
      }
    } else if (level === 2 && person && section === "BIRT" && tag === "DATE" && person.born === undefined) {
      person.born = birthYear(value);
    }
  }
  finish();

  return { people, parents, unions };
}
