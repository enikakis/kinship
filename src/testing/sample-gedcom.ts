/** Lines of an INDI record with a name, a sex, a birth date and a cited register page. */
const indi = (n: number, name: string, sex: string, date: string, page: number): string[] => [
  `0 @I${n}@ INDI`,
  `1 NAME ${name}`,
  `1 SEX ${sex}`,
  "1 BIRT",
  `2 DATE ${date}`,
  "2 SOUR @S1@",
  `3 PAGE ${page}`,
];

/** Lines of a FAM record: partners, children and an optional marriage year. */
const fam = (n: number, partners: string[], children: string[], married?: number): string[] => [
  `0 @F${n}@ FAM`,
  ...partners,
  ...children.map((child) => `1 CHIL @${child}@`),
  ...(married === undefined ? [] : ["1 MARR", `2 DATE ${married}`]),
];

/**
 * An invented family as a GEDCOM 5.5.1 file, for tests (I1 has a death and places of birth and
 * death): byte order mark, CRLF line ends, notes, a
 * source, CONC/CONT, a remarriage (I7, I12), a family with one partner (F6), a person with no name
 * (I20).
 *
 *     I1 Nikolaos ═ I2 Sofia
 *                 │
 *        ┌────────┴─────────┐
 *     I3 Petros          I4 Maria
 *      ═ I5 Katerina      ═ I6 Stavros
 *      │                  │
 *   I7, I8             I9, I10
 *
 *     I18 Sotiris ═ I12 Danae ═ I7 Andreas ═ I11 Ioanna   (I7 drawn twice)
 *                 │           │            │
 *            I19 Alexia      I15       I13, I14
 *
 *     I16 Thomas   (mother of I17 not recorded)
 *          │
 *       I17 Lena
 *
 *     ═ marriage, │ children
 *
 * Andreas (I7) is married first to Ioanna, then to Danae, who had Alexia with Sotiris before.
 */
export const sampleGedcom: string =
  "\uFEFF" +
  [
    "0 HEAD",
    "1 SOUR KINSHIP-SAMPLE",
    "1 GEDC",
    "2 VERS 5.5.1",
    "2 FORM LINEAGE-LINKED",
    "1 CHAR UTF-8",
    "0 @S1@ SOUR",
    "1 TITL Invented parish register",
    "0 @N1@ NOTE The people in this file are invented.",
    "0 @I1@ INDI",
    "1 NAME Nikolaos /Ioannou/",
    "1 SEX M",
    "1 BIRT",
    "2 DATE 1 JAN 1900",
    "2 PLAC Patra",
    "2 SOUR @S1@",
    "3 PAGE 12",
    "1 NOTE Farmer. A long note that is",
    "2 CONC  split in two",
    "2 CONT and goes on a second line.",
    "1 NOTE @N1@",
    "1 DEAT",
    "2 DATE 1975",
    "2 PLAC Athens",
    ...indi(2, "Sofia /Markou/", "F", "ABT 1905", 12),
    ...indi(3, "Petros /Ioannou/", "M", "12 MAR 1930", 31),
    ...indi(4, "Maria /Ioannou/", "F", "1933", 31),
    ...indi(5, "Katerina /Papadopoulou/", "F", "BET 1934 AND 1936", 45),
    ...indi(6, "Stavros /Papadopoulos/", "M", "1930/31", 45),
    ...indi(7, "Andreas /Ioannou/", "M", "1960", 58),
    ...indi(8, "Anna /Ioannou/", "F", "1963", 58),
    ...indi(9, "Dimitra /Papadopoulou/", "F", "1962", 64),
    ...indi(10, "Kostas /Papadopoulos/", "M", "1965", 64),
    ...indi(11, "Ioanna /Vlachou/", "F", "1962", 72),
    ...indi(12, "Danae /Georgiou/", "F", "1966", 77),
    ...indi(13, "Nikos /Ioannou/", "M", "1990", 91),
    ...indi(14, "Eirini /Ioannou/", "F", "1993", 91),
    ...indi(15, "Alexandros /Ioannou/", "M", "1998", 103),
    ...indi(16, "Thomas /Kyriakou/", "M", "1970", 80),
    ...indi(17, "Lena /Kyriakou/", "F", "1995", 98),
    ...indi(18, "Sotiris /Lazarou/", "M", "1964", 77),
    ...indi(19, "Alexia /Lazarou/", "F", "1994", 98),
    "0 @I20@ INDI",
    "1 SEX U",
    ...fam(1, ["1 HUSB @I1@", "1 WIFE @I2@"], ["I3", "I4"], 1927),
    ...fam(2, ["1 HUSB @I3@", "1 WIFE @I5@"], ["I7", "I8"], 1957),
    ...fam(3, ["1 HUSB @I6@", "1 WIFE @I4@"], ["I9", "I10"], 1958),
    ...fam(4, ["1 HUSB @I7@", "1 WIFE @I11@"], ["I13", "I14"], 1988),
    ...fam(5, ["1 HUSB @I7@", "1 WIFE @I12@"], ["I15"], 1996),
    ...fam(6, ["1 HUSB @I16@"], ["I17"]),
    "1 NOTE Mother not recorded",
    ...fam(7, ["1 HUSB @I18@", "1 WIFE @I12@"], ["I19"], 1992),
    "0 TRLR",
  ].join("\r\n") +
  "\r\n";
