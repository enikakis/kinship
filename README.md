# @enikakis99/kinship

Name how two people in a family tree are related, in Greek and English, with French, German and
Spanish experimental.

[![CI](https://img.shields.io/github/actions/workflow/status/enikakis/kinship/ci.yml?branch=main&label=CI)](https://github.com/enikakis/kinship/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@enikakis99/kinship)](https://www.npmjs.com/package/@enikakis99/kinship)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/@enikakis99/kinship)](https://bundlephobia.com/package/@enikakis99/kinship)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

Give it a tree and two people. It finds the chain between them and tells you what each is to the
other («θεία» / «ανιψιά», "aunt" / "niece"), every other way they are related by blood, and the
legal degree of kinship. Zero runtime dependencies, fully typed, ESM and CommonJS.

**[Live demo](https://enikakis.github.io/kinship/)** · [Design](docs/design.md) ·
[Benchmarks](docs/benchmarks.md) · [Contributing](CONTRIBUTING.md)

## Install

```sh
npm install @enikakis99/kinship
```

Node 22.18 or later, or any modern browser. Each language is its own entry point, so a bundle
carries only the languages you import. Minified and gzipped (esbuild, measured 2026-11-25):
`createTree`, `relate` and `describeRelation` with Greek and English, about 6.3 kB; all core
exports with Greek and English, about 7.0 kB; everything (all five languages, SVG and GEDCOM),
about 12.1 kB.

## In ten seconds

```ts
import { createTree, describeRelation, relate } from "@enikakis99/kinship";
import { el } from "@enikakis99/kinship/locales/el";
import { en } from "@enikakis99/kinship/locales/en";

const tree = createTree({
  people: [
    { id: "sofia", name: "Sofia", sex: "female" },
    { id: "dafni", name: "Dafni", sex: "female" },
    { id: "katerina", name: "Katerina", sex: "female" },
    { id: "anna", name: "Anna", sex: "female" },
  ],
  parents: [
    ["sofia", "dafni"], // [parent, child]
    ["sofia", "katerina"],
    ["dafni", "anna"],
  ],
  unions: [],
});

const relation = relate(tree, "anna", "katerina"); // what Katerina is to Anna, or null
if (relation) {
  console.log(describeRelation(tree, relation, el).main);
  console.log(describeRelation(tree, relation, en).main);
}
```

```js
{
  roles: { other: 'θεία', self: 'ανιψιά' },
  summary: 'θεία',
  degree: 'Συγγένεια εξ αίματος εκ πλαγίου, 3ου βαθμού',
  chain: [
    { id: 'anna', text: 'Anna' },
    { id: 'dafni', text: 'μητέρα: Dafni' },
    { id: 'sofia', text: 'μητέρα: Sofia' },
    { id: 'katerina', text: 'κόρη: Katerina' }
  ]
}
{
  roles: { other: 'aunt', self: 'niece' },
  summary: 'aunt',
  degree: 'Related by blood in the collateral line, 3rd degree',
  chain: [
    { id: 'anna', text: 'Anna' },
    { id: 'dafni', text: 'mother: Dafni' },
    { id: 'sofia', text: 'mother: Sofia' },
    { id: 'katerina', text: 'daughter: Katerina' }
  ]
}
```

The same relation as language-neutral data, for your own wording or logic:

```ts
relation?.main.kind;        // "uncle" (kinds are sex-neutral: an uncle or an aunt)
relation?.main.blood;       // { up: 2, down: 1 }
relation?.main.moves;       // ["up", "up", "down"]
relation?.main.legalDegree; // { degree: 3, line: "collateral", kind: "blood" }
```

People are your own objects: the library needs only `id` and `sex` (`"female"`, `"male"` or
`"unknown"`) and hands the same objects back in results. `createTree(input, { name, born })` says
how to write a name (default: a string `name` property, else the id) and how to read a birth year,
which orders relatives and settles ties between equally short chains.

## What it answers

- **What is each to the other**, in both directions, with gender and grammar right: «πρώτος
  εξάδελφος της μητέρας» / «κόρη της πρώτης εξαδέλφης», "first cousin once removed", "3rd
  great-grandfather" / "3rd great-grandson". An unknown sex gives both forms: «θείος/θεία».
- **Every other blood tie**, each with its closest common ancestors, so a cousin marriage or double
  first cousins (two brothers married to two sisters) show up in full.
- **Whether the two are a couple**, and what else they were before they married.
- **The legal degree** of kinship, by blood or by marriage, as civil law counts it.
- **The chain step by step** («μητέρα: Dafni», "mother: Dafni") and **layout data** to draw it,
  plus a ready-made accessible SVG.
- **What everyone is to one person**, in a single call.
- **GEDCOM in**, and **validation** that tells you what is wrong with a tree instead of quietly
  giving odd answers.

## Relationships and languages

Every language names every blood relationship, at any distance, and every relation by marriage that
has an everyday name, for men, women and people of unknown sex, in both directions. A sample:

| Relationship | el | en | fr\* | de\* | es\* |
|---|---|---|---|---|---|
| Parent | πατέρας<br>μητέρα | father<br>mother | père<br>mère | Vater<br>Mutter | padre<br>madre |
| Grandparent | παππούς<br>γιαγιά | grandfather<br>grandmother | grand-père<br>grand-mère | Großvater<br>Großmutter | abuelo<br>abuela |
| Sibling | αδελφός<br>αδελφή | brother<br>sister | frère<br>sœur | Bruder<br>Schwester | hermano<br>hermana |
| Half-sibling | ετεροθαλής αδελφός<br>ετεροθαλής αδελφή | half-brother<br>half-sister | demi-frère<br>demi-sœur | Halbbruder<br>Halbschwester | medio hermano<br>media hermana |
| Uncle, aunt | θείος<br>θεία | uncle<br>aunt | oncle<br>tante | Onkel<br>Tante | tío<br>tía |
| Nephew, niece | ανιψιός<br>ανιψιά | nephew<br>niece | neveu<br>nièce | Neffe<br>Nichte | sobrino<br>sobrina |
| First cousin | πρώτος εξάδελφος<br>πρώτη εξαδέλφη | first cousin | cousin germain<br>cousine germaine | Cousin<br>Cousine | primo hermano<br>prima hermana |
| First cousin once removed (father's first cousin) | πρώτος εξάδελφος του πατέρα<br>πρώτη εξαδέλφη του πατέρα | first cousin once removed | cousin germain du père<br>cousine germaine du père | Cousin des Vaters<br>Cousine des Vaters | primo hermano del padre<br>prima hermana del padre |
| Second cousin | δεύτερος εξάδελφος<br>δεύτερη εξαδέλφη | second cousin | cousin issu de germain<br>cousine issue de germain | Cousin 2. Grades<br>Cousine 2. Grades | primo segundo<br>prima segunda |
| Spouse | σύζυγος | husband<br>wife | époux<br>épouse | Ehemann<br>Ehefrau | esposo<br>esposa |
| Parent-in-law | πεθερός<br>πεθερά | father-in-law<br>mother-in-law | beau-père<br>belle-mère | Schwiegervater<br>Schwiegermutter | suegro<br>suegra |
| Sibling-in-law (wife's sibling) | κουνιάδος<br>κουνιάδα | brother-in-law<br>sister-in-law | beau-frère<br>belle-sœur | Schwager<br>Schwägerin | cuñado<br>cuñada |
| Co-parent-in-law (son's wife's parent) | συμπέθερος<br>συμπεθέρα | child's father-in-law<br>child's mother-in-law | père de l'épouse du fils<br>mère de l'épouse du fils | Schwiegervater des Sohnes<br>Schwiegermutter des Sohnes | consuegro<br>consuegra |
| Step-parent | πατριός<br>μητριά | stepfather<br>stepmother | beau-père<br>belle-mère | Stiefvater<br>Stiefmutter | padrastro<br>madrastra |

*Each cell is `describeRelation(...).main.roles.other`, what the relative is to the first person:
for a male relative on top, a female one below, one line when both are the same. The first person
is a man, and so is everyone between them, except the wife in the in-law rows and the mother
through whom a man has a stepfather.*

Past the everyday words, names are built the way each language builds them: «αδελφός της γιαγιάς»
(a great-uncle, named through the grandmother), «προ-προ-προπάππους», "3rd great-grandfather",
«ascendant au 5e degré», "third cousin", «cousin au troisième degré». A relation by marriage with no
everyday name (a cousin's wife's brother, an uncle by marriage's mother) gets a sentence instead:
"Related through the marriages of Nikos and Dafni; Irini and Pavlos."

| Language | Entry point | Status |
|---|---|---|
| Greek (el) | `@enikakis99/kinship/locales/el` | stable |
| English (en) | `@enikakis99/kinship/locales/en` | stable |
| French (fr) | `@enikakis99/kinship/locales/fr` | \*experimental: [term table](docs/locales/fr.md) |
| German (de) | `@enikakis99/kinship/locales/de` | \*experimental: [term table](docs/locales/de.md) |
| Spanish (es) | `@enikakis99/kinship/locales/es` | \*experimental: [term table](docs/locales/es.md) |

\*Experimental languages are researched from dictionaries and statutes, with every term sourced in
its term table, but no native speaker has reviewed them yet. If you speak one,
[a review](CONTRIBUTING.md#reviewing-a-language) is the most useful contribution there is.

## How it works

Take this family. `═` is a marriage; Katerina married her first cousin Lefteris.

```text
                    Markos ═ Despina
                  ┌────────┴────────┐
      Stelios ═ Sofia            Ioannis
        ┌─────┴─────────┐           │
      Dafni         Katerina ═ Lefteris
        │
       Anna
```

<details>
<summary>The same family as input</summary>

```ts
const tree = createTree({
  people: [
    { id: "markos", name: "Markos", sex: "male" },
    { id: "despina", name: "Despina", sex: "female" },
    { id: "stelios", name: "Stelios", sex: "male" },
    { id: "sofia", name: "Sofia", sex: "female" },
    { id: "ioannis", name: "Ioannis", sex: "male" },
    { id: "dafni", name: "Dafni", sex: "female" },
    { id: "katerina", name: "Katerina", sex: "female" },
    { id: "lefteris", name: "Lefteris", sex: "male" },
    { id: "anna", name: "Anna", sex: "female" },
  ],
  parents: [
    ["markos", "sofia"],
    ["despina", "sofia"],
    ["markos", "ioannis"],
    ["despina", "ioannis"],
    ["stelios", "dafni"],
    ["sofia", "dafni"],
    ["stelios", "katerina"],
    ["sofia", "katerina"],
    ["ioannis", "lefteris"],
    ["dafni", "anna"],
  ],
  unions: [
    { a: "markos", b: "despina" },
    { a: "stelios", b: "sofia" },
    { a: "katerina", b: "lefteris" },
  ],
});
```

</details>

**1. The shortest chain.** The tree is a graph whose steps go to a parent (`up`), a child (`down`)
or a spouse (`spouse`). A shortest-path search (Dijkstra) finds the cheapest chain between the two
people. Every step costs 10 and a marriage step 11, so among chains of equal length the one with
fewer marriages wins. From Anna to Lefteris the cheapest chain is up, up, down, spouse (cost 41):
Lefteris is the husband of her aunt. The blood chain, up three and down two through Markos,
costs 50.

**2. Other blood ties.** Next it walks both people's ancestor lines and finds every set of closest
common ancestors. Each set gives a blood tie: Lefteris is also the first cousin of Anna's mother,
through Markos and Despina.

**3. Which one comes first.** A couple always comes first as a couple, whatever their blood ties.
Otherwise a blood tie usually comes before a chain through marriages, even a shorter one, with one
exception: a relation by marriage with an everyday name (an aunt's husband, an in-law) comes before
a blood tie more distant than first cousins. In a village an aunt's husband is often a distant
cousin too, and he is her husband first of all. So:

```ts
const relation = relate(tree, "anna", "lefteris")!;
const text = describeRelation(tree, relation, en);
text.main.summary;                     // "uncle by marriage"
text.others[0].summary;                // "first cousin once removed"
text.others[0].commonAncestors;        // "Common ancestors: Markos and Despina"
describeRelation(tree, relation, el).others[0].roles;
// { other: 'πρώτος εξάδελφος της μητέρας', self: 'κόρη της πρώτης εξαδέλφης' }
```

For Katerina and Lefteris themselves, who are first cousins, `couple` is true and the main
relationship is "husband"; "first cousin" is the other tie, with the same common ancestors.

**4. The same answer from either end.** The search always runs from whichever of the two comes
first in your `people` and is read backwards for the other direction, so `relate(tree, "lefteris",
"anna")` is the same relationship with the roles swapped: "niece by marriage" / "uncle by
marriage", and the same other tie.

**5. Names.** The chain's moves (up, up, down, spouse) decide the kind (`uncleByMarriage`), the
cousin degree and removal, and the legal degree. A language turns that, with the sex of everyone on
the chain, into words: Greek needs the genitive for longer names («της πρώτης εξαδέλφης»), French
contracts articles («du père»), German declines («des Vaters»). Which relationship is the main one
never depends on the language.

## Legal degree

Each relationship carries its degree of kinship as the civil law counts it, the Roman computation:
one degree per generation, counted up from one person to the closest common ancestor and down to
the other. The example is the Greek Civil Code, arts. 1463–1464; the French Code civil
(arts. 741–745) and the German BGB (§ 1589) count the same way.

- **By blood** (εξ αίματος), in the **direct line** (σε ευθεία γραμμή) when one descends from the
  other: a parent is in the 1st degree, a grandparent in the 2nd. Otherwise in the **collateral
  line** (εκ πλαγίου): siblings 2nd, uncle and niece 3rd, first cousins 4th, first cousins once
  removed 5th.
- **By marriage** (affinity, αγχιστεία): a spouse's blood relatives, and a blood relative's spouse,
  in the same line and degree as the blood tie. A son-in-law is in the direct line, 1st degree; a
  wife's sister in the collateral line, 2nd degree; Anna's uncle by marriage, 3rd degree.
- **No degree** (`legalDegree: null`, `degree: null` in the text): a couple, and any chain whose
  marriage is not at one end or that has more than one, which the law does not count: affinity is
  only between one spouse and the other spouse's blood relatives. So co-parents-in-law (one
  marriage, in the middle of the chain) and two men married to two sisters have no degree.

```ts
describeRelation(tree, relate(tree, "anna", "lefteris")!, el).main.degree;
// 'Συγγένεια εξ αγχιστείας εκ πλαγίου, 3ου βαθμού'
describeRelation(tree, relate(tree, "anna", "lefteris")!, en).main.degree;
// 'Related by marriage (affinity) in the collateral line, 3rd degree'
```

Canon law and some genealogists count differently (first cousins in the 2nd degree), so check the
counting your use needs. The library gives the degree; it does not answer legal questions such as
who may marry or who inherits.

## API

The full reference is in the TSDoc of each export; your editor shows it on hover.

### `relateAll(tree, fromId)`: what everyone is to one person

A `Map` from each connected person's id, in the order of `people`, to the same `main` and `couple`
that `relate(tree, fromId, id)` would give, for much less than calling `relate` for everyone: one
search from the person serves everyone listed after them in `people`. Other blood ties are per
pair: use `relate` for those.

```ts
import { relateAll } from "@enikakis99/kinship";

for (const [id, entry] of relateAll(tree, "anna")) {
  const text = describeRelation(tree, { ...entry, others: [] }, el);
  console.log(id.padEnd(10), text.main.summary);
}
```

```text
markos     προπάππους
despina    προγιαγιά
stelios    παππούς
sofia      γιαγιά
ioannis    αδελφός της γιαγιάς
dafni      μητέρα
katerina   θεία
lefteris   θείος (από γάμο)
```

### `toSvg(diagram, options)`: the chain as an SVG

```ts
import { toSvg } from "@enikakis99/kinship/svg";

const relation = relate(tree, "anna", "lefteris")!;
const text = describeRelation(tree, relation, en);
const svg = toSvg(relation.main.diagram, { roles: text.main.roles, title: text.main.summary });
```

```xml
<svg class="kinship" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 300" width="540" height="300" role="img" aria-labelledby="kinship-d5obtt-title kinship-d5obtt-desc">
<title id="kinship-d5obtt-title">uncle by marriage</title>
<desc id="kinship-d5obtt-desc">Anna (niece by marriage) → Dafni → Stelios → Katerina → Lefteris (uncle by marriage)</desc>
…
```

A box per person, parent links as elbows, marriages as double lines, the two ends highlighted with
their roles. It builds a string, with no DOM, so it works on a server and in the browser. It is
accessible (`role="img"`, a `<title>` and a `<desc>`), and styled through CSS custom properties:
colours (`--kinship-node-fill`, `--kinship-node-stroke`, `--kinship-text`, `--kinship-link`,
`--kinship-end-stroke`) that fall back to system colours, so it follows the page's light or dark
`color-scheme`, and fonts (`--kinship-font`, `--kinship-role-font`) that default to sans-serif.
The layout data (`relation.main.diagram`: nodes with a row and a lane, and links) is public if you
would rather draw it yourself.

### `fromGedcom(text)`: read a GEDCOM file

```ts
import { createTree } from "@enikakis99/kinship";
import { fromGedcom } from "@enikakis99/kinship/gedcom";

const input = fromGedcom(text); // the file's contents, already decoded to a string
const tree = createTree(input, { born: (person) => person.born });
```

<details>
<summary>A small file and what it gives</summary>

```text
0 HEAD
1 GEDC
2 VERS 5.5.1
0 @I1@ INDI
1 NAME Sofia /Andreou/
1 SEX F
1 BIRT
2 DATE ABT 1890
0 @I2@ INDI
1 NAME Dafni /Andreou/
1 SEX F
1 BIRT
2 DATE 3 MAY 1921
0 @I3@ INDI
1 NAME Katerina /Andreou/
1 SEX F
0 @F1@ FAM
1 WIFE @I1@
1 CHIL @I2@
1 CHIL @I3@
0 TRLR
```

```js
{
  people: [
    { id: 'I1', sex: 'female', name: 'Sofia Andreou', born: 1890 },
    { id: 'I2', sex: 'female', name: 'Dafni Andreou', born: 1921 },
    { id: 'I3', sex: 'female', name: 'Katerina Andreou' }
  ],
  parents: [ [ 'I1', 'I2' ], [ 'I1', 'I3' ] ],
  unions: []
}
```

</details>

It reads GEDCOM 5.5.1 and 7.0 text (already decoded from UTF-8): each person's name, sex and birth
year, and each family's partners and children. Everything else is ignored, and it never throws.

### `validateTree(input)`: what is wrong with a tree

`createTree` quietly skips links it cannot use. `validateTree` takes the same raw input and says
why:

```ts
import { validateTree } from "@enikakis99/kinship";

validateTree({
  people: [
    { id: "anna", sex: "female" },
    { id: "dafni", sex: "female" },
    { id: "anna", sex: "female" },
  ],
  parents: [
    ["dafni", "anna"],
    ["anna", "dafni"],
    ["nikos", "anna"],
  ],
  unions: [{ a: "dafni", b: "dafni" }],
});
```

```js
{
  ok: false,
  issues: [
    { code: 'duplicateId', message: 'Person id "anna" is used more than once.', ids: [ 'anna' ] },
    { code: 'unknownId', message: 'A parent link names unknown id "nikos".', ids: [ 'nikos' ] },
    { code: 'selfUnion', message: '"dafni" is recorded as married to themselves.', ids: [ 'dafni' ] },
    { code: 'cycle', message: `"anna", "dafni" are each other's ancestors (a cycle).`, ids: [ 'anna', 'dafni' ] }
  ]
}
```

The codes are `duplicateId`, `unknownId`, `selfParent`, `selfUnion`, `tooManyParents` and `cycle`.

### Good to know

- **Names are in-sentence forms**: «θεία», "first cousin". Capitalise the first letter for display
  («Θεία», "First cousin").
- **`relate` returns `null`** for two people who are not connected, for the same person twice, and
  for an id that is not in the tree. Run `validateTree` on your input to tell these apart.
- **`path` and `chain` differ by one.** The data's `relation.main.path` lists each person *after*
  the first, with the move that reached them (`[dafni, up], [sofia, up], [katerina, down]`); the
  text's `chain` starts with the first person's own name.
- **Half-siblings** are named only when both people have two recorded parents and share exactly one.
  With a parent missing, the library cannot tell, so it says sibling.

## Performance

On generated trees (Apple M5, Node 26.8.2; `npm run bench`, measured 2026-11-25):

| Case | Mean time |
|---|---:|
| `createTree`, 10,000 people | 3.11 ms |
| `relate`, 200 pairs (about 1 ms a pair) | 202 ms |
| `describeRelation` (el), 198 relations | 0.46 ms |
| `relateAll`, 3 people, on a 1,000-person tree | 151 ms |
| `relateAll`, one person with 9,855 relatives, on the 10,000-person tree (one-off run) | 9.3 s |

Against the original code, `relate` is 25 times faster (a binary heap and a spouse index) and
`relateAll` 11 times (the same, plus one shared search). Method, baseline and every step are in
[docs/benchmarks.md](docs/benchmarks.md).

## Add a language

A language is one small module and a term table with a source for every word. The library ships
languages whose kinship works like Greek and English (the same relatives told apart, no separate
words for the father's or mother's side); Italian, Portuguese and Dutch would fit. The step-by-step
guide, and how to review an existing language, are in
[CONTRIBUTING.md](CONTRIBUTING.md#adding-a-language).

## Development

```sh
npm install
npm test                # Vitest: unit, property-based and locale tests
npm run typecheck       # tsc, strict
npm run lint            # Biome
npm run build           # tsup: ESM, CommonJS and types in dist/
npm run check:package   # publint and are-the-types-wrong, after a build
npm run test:dist       # smoke test of the built package
npm run bench           # the benchmarks in docs/benchmarks.md
npm run demo            # the live demo, served from the source by Vite
npm run demo:build      # the demo as a static site in demo/dist
```

The design and its reasoning are in [docs/design.md](docs/design.md), the roadmap in
[docs/PLAN.md](docs/PLAN.md).

## License

[MIT](LICENSE)
