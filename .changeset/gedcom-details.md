---
"@enikakis99/kinship": minor
---

`fromGedcom` keeps more of each person and marriage, when the file has it: `given` and `surname`
(from the slashes in `NAME`, or else its `GIVN`, `SPFX` and `SURN`), `died`, `birthPlace` and
`deathPlace` (places drop the empty parts between commas), and on unions `married` and `place`. New types `GedcomUnion` and `GedcomInput`. A named person now also
carries `given` and `surname`, so a deep equality check on `fromGedcom`'s output sees new fields.
