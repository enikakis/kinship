# `@enikakis/kinship` v1: design

Date: 2026-11-24 · Status: accepted, and kept in step with the code as it is built. The roadmap
is `docs/PLAN.md`.

## Intent

A zero-dependency TypeScript library that answers **"how are these two people related?"** for any
family tree, in several languages, and is good enough that other developers building a family-tree
site or app reach for it. It is also a portfolio piece, so the code, API, tests, docs and git history
are all part of the product.

Why this library and not another tree drawer: drawing family trees is well served on npm
(family-chart, Topola, relatives-tree). Naming relationships is not: the only prior art found is a
Perl module, a 2008 CodeProject article and a PHP class, none multilingual, none finding second
blood ties or the legal degree. The library should be *the* answer to that question and work
**alongside** the tree drawers, not compete with them.

It starts from code that already works in production on the author's village history
site: Dijkstra path search, other blood ties, a careful main-relationship rule,
Greek and English names with gender and genitive, legal degree, chain diagram data. That code is
site-shaped today; v1 makes it general.

## Goals

1. **Any person shape in.** Users pass their own person objects (needing only `id` and `sex`) and
   get them back typed in results. No `given_name` / `surname` / `living` in the core.
2. **GEDCOM in.** A `gedcom` entry point turns a GEDCOM file's text into the input shape, so anyone
   with an export from a genealogy program can use the library in a few lines.
3. **Structured result** for a pair of people: the main relationship, the other blood ties (each
   with its common ancestors), whether they are a couple, the legal degree, the chain, and diagram
   layout data. Language-neutral.
4. **Three levels of output**, each optional:
   - *data*: generations up/down, cousin degree and removal, side, kind, legal degree, path;
   - *names*: what each is to the other in a language («θεία» / «ανιψιός», "aunt" / "nephew");
   - *sentences*: ready-made lines with people's names in them (summary for relations through
     marriages, the chain step by step, common ancestors, the legal degree as a sentence), for
     users who want a working page fast.
5. **Ready languages:** Greek, English, French, German, Spanish: languages whose relatives work like
   Greek and English (the rule for v1). Each term backed by a cited source and by tests.
6. **"What is everyone to me":** the main relationship of one person to every other person, in
   one call, at roughly the cost of one search.
7. **SVG of the chain:** a `svg` entry point that turns diagram data into an accessible SVG string,
   with no DOM needed (works in Node and the browser).
8. **`validateTree()`** reports broken input instead of producing odd results (PLAN step 5).
9. **Fast on big trees:** benchmark on ~10,000 people with recorded before/after numbers
   (PLAN step 4).
10. **Published properly:** ESM + CJS + types, tree-shakeable entry points, CI, docs, live demo,
    npm provenance (PLAN steps 6–10).

## Non-goals (v1)

- Drawing whole family trees. That is the planned **second package** (a mobile-first, accessible
  React tree from the site's `layout.ts` / `TreeView`), designed separately after v1 ships.
- Answering legal questions (may these two marry, who inherits). The degree is given; its use is
  the user's.
- Chinese, Korean, Hindi and other languages with asymmetric terms. v1 must not *prevent* them
  (see "Data for future languages"), but does not ship them.
- Writing GEDCOM, editing trees, storage, any UI.
- Non-UTF-8 GEDCOM (ANSEL). The GEDCOM reader takes a decoded string.

## Anti-goals (failure even if it works)

- **A wrong kinship term in a shipped language.** Worse than not shipping that language.
- Any runtime dependency.
- Anything in the public API that only makes sense for the original site.
- **Real people's names** in fixtures, docs or git history.
- Losing one of the existing subtle rules (listed under "Behaviour to keep") during the refactor.
- A big-bang history: the commits should show the refactor step by step.

## Constraints

- TypeScript strict, Node ≥ 20, Vitest. Dev dependencies are fine (fast-check, tsup or tsdown,
  Biome, publint, attw, changesets); runtime dependencies are not.
- Every commit keeps `npm test` and `npm run typecheck` green. Behaviour changes get a test first.
- Test fixtures and doc comments use fictional people only.
- Small, focused commits with clear messages (Conventional Commits); Claude appears only as
  `Co-Authored-By` where it helped.

## Approaches considered

- **A. Step-by-step refactor (chosen).** Keep the working code and its 27 tests green on every
  commit; split `kinship.ts` into modules; put the new API on top behind a temporary compatibility
  wrapper; then add the new features. Chosen because it cannot silently lose a rule the tests don't
  cover, and the history shows the reasoning, which matters for a portfolio piece. Cost: for a
  while old and new shapes coexist.
- **B. New core from scratch, old tests as the spec.** Faster to a clean design, but rules the
  tests don't pin down get lost, and the history is a few big commits. Rejected.
- **Languages as declarative data (JSON rules, no code).** Rejected: Greek genitive phrasing
  («αδελφός της γιαγιάς») and French/German cousin naming don't fit a table without building a rule
  engine. Locales are code.

## Decided design

### Package and entry points

One package now, with subpath exports (each tree-shakeable, `"sideEffects": false`):

| Entry | Contents |
|---|---|
| `@enikakis/kinship` | `createTree`, `relate`, `relateAll`, `describeRelation`, `validateTree`, types |
| `@enikakis/kinship/locales/el` (and `en`, `fr`, `de`, `es`) | one `KinshipLocale` each |
| `@enikakis/kinship/gedcom` | `fromGedcom(text)` |
| `@enikakis/kinship/svg` | `toSvg(diagram, options)` |

When the tree package starts, the repo becomes a two-package workspace; not before.

### Input

```ts
type Sex = "female" | "male" | "unknown";
type TreeInput<P extends { id: string; sex: Sex }> = {
  people: P[];
  parents: [parentId: string, childId: string][];
  unions: { a: string; b: string }[];   // extra fields allowed and ignored
};
const tree = createTree(input, {
  name?: (p: P) => string,               // for sentences; default p.name ?? p.id
  born?: (p: P) => number | undefined,   // e.g. birth year; for ordering and birth order
});
```

Ordering of relatives (which decides between equally short chains, so it must be deterministic):
by `born` when given, then by input order. This replaces today's "birth year, then Greek
collation of given name"; a small change in which tie wins is accepted (the original site's output
need not stay identical).

### Result

```ts
const rel = relate(tree, "maria", "nikos");   // null if not connected or same person
rel.main        // Relationship<P>
rel.others      // (Relationship<P> & { commonAncestors: P[] })[], closest first
rel.couple      // boolean
```

`Relationship<P>` carries, language-neutral:

- `moves`: `("up" | "down" | "spouse")[]` and `path`: `{ person: P; move }[]`;
- `kind`: a stable string union (`Kind`): by blood ancestor, descendant, sibling, halfSibling,
  uncle, nephew, cousin (how many generations up and down is in `blood`, so a parent and a
  grandparent are both `ancestor`); by marriage spouse, parentInLaw, childInLaw, siblingInLaw,
  coParentInLaw, coSiblingInLaw, uncleByMarriage, nephewByMarriage, stepParent, stepChild
  (`MarriageKind`); then spouseOfRelative, relativeOfSpouse, unnamed. It covers every case the
  original `relationName` / `BY_MARRIAGE` covered;
- `blood`: `{ up, down }` for blood relations (null otherwise); `cousin`: `{ degree, removed }`
  for cousins;
- `legalDegree`: `{ degree, line: "direct" | "collateral", kind: "blood" | "affinity" } | null`;
- `diagram`: today's `ConnectionDiagram` data (nodes with row/lane, links), with `P` for persons.
  No `ends` field: the two people are the first and the last node, and their roles come from
  `describeRelation`.

**Data for future languages** (cheap now, needed by Chinese/Korean/Hindi later; v1 locales may
ignore it): `side` ("paternal" | "maternal" | null: the sex of the first parent stepped up to) and
`elderBranch` ("from" | "to": whose branch below the common ancestor starts with the elder child,
when `born` allows telling; null otherwise).

### The legal degree

Computed as today (one degree per generation through the common ancestor; affinity through one
marriage at either end only; couples and multi-marriage chains have none). Presented in docs and
types as the **civil-law (Roman) computation**, with the Greek Civil Code arts. 1463–1464 as the
worked example, not as a Greece-only feature. Wording of the degree sentence is per locale.

### Languages

```ts
interface KinshipLocale {
  code: string;                                  // "el", "en"
  // what the last person of a chain is to the first; null = no everyday name
  name(query: NameQuery): string | null;         // NameQuery = { kind, moves, blood, sexes }
  step(move, sex): string;                       // «πατέρας», "son", for the chain
  labelled(label: string, name: string): string; // a chain line: «πατέρας: Αντώνης»
  degree(d: LegalDegree): string;                // the degree as a sentence
  throughMarriages(couples: [string, string][]): string;
  commonAncestors(names: string[]): string;
}
const text = describeRelation(tree, rel, el);
// { main: { roles, summary, degree, chain }, others: [{ …, commonAncestors }], couple }, using the tree's `name`
```

`describeRelation` asks the locale for both directions (`roles.other` and `roles.self`). A
query's `blood` is the generations of its blood part: the whole chain for a blood relation; for
`spouseOfRelative` and `relativeOfSpouse`, the chain without its marriage step, so a locale names
them through the blood relative («σύζυγος της πρώτης εξαδέλφης», "wife's first cousin"). The
rules:

- A locale owns its grammar (gender, case, word order). Shared helpers (cousin degree/removal,
  English-style ordinals) live in one internal module locales may use.
- **Which relationship is "main" never depends on the language.** The `findRelationships` rule uses
  language-neutral kinds.
- Every locale must name every blood relationship and every named relation by marriage, for all
  three sexes (`unknown` gives both forms, as today), in both directions. Enforced by
  property-based tests over all locales.
- **Sources:** each new-locale term carries a citation (a dictionary or a genealogy reference:
  e.g. Larousse / CNRTL for French, Duden for German, RAE / DLE for Spanish) in a comment or in the
  test table. Greek and English keep today's terms.
- **Which languages:** only languages whose kinship works like Greek and English:
  the same relatives are told apart (parents, siblings, uncles/aunts, cousins by degree), with no
  separate words for the father's vs the mother's side or for older vs younger siblings. French,
  German and Spanish fit; Italian, Portuguese, Dutch would too, later.
- **No single standard term:** where a relation has competing conventions (removed
  and distant cousins: German "Cousin 2. Grades", French "cousin issu de germain" vs "petit-cousin"),
  name it the way Greek already does, through the person of the other's generation ("cousin germain
  du père"), rather than pick one technical convention. Safer against the worst failure.
- **Review status:** el and en are stable. fr, de, es ship in 0.1.0 marked
  *experimental* in the README until a native speaker reviews each term table; reviews are invited
  through GitHub issues (also good first issues for contributors). The term table per locale is a
  single readable file so a reviewer can check it without reading the code.
- **The shipped term tables** are in `docs/locales/{fr,de,es}.md`: each starts with the rulings and
  implementation calls the code follows, then the research with its sources and open questions.
  The rulings: other-generation relatives beyond the standard words (great-uncle, Großonkel, tío
  abuelo and their great-/Ur-/bis- forms) are named through the person of the other's generation,
  never «oncle à la mode de Bretagne», «Großcousin» or «tío segundo»; cousins by dictionary degree
  («cousin issu de germain», «Cousin 2. Grades», «primo segundo»); the direct line past the named
  words by legal degree («ascendant au 5e degré»); an unknown sex gives both forms except for a
  truly neutral word (parent, Elternteil, cónyuge); composed relations by marriage use the precise
  descriptive form («Ehefrau eines Cousins»), never «primo político».

### "What is everyone to me"

`relateAll(tree, fromId)` returns a `Map<string, RelationEntry>` (`{ main, couple }`) with, for
every connected person, the same `main` and `couple` that `relate(tree, fromId, thatId)` would.
Keys are person ids in the order of `people`, without `fromId` and without unconnected people; an
unknown `fromId` gives an empty map. **Spec: equality with `relate` for every pair**, checked by a
property test on random trees. Other blood ties are not included (they are per pair; call
`relate`). An entry with `others: []` added, `{ ...entry, others: [] }`, is accepted by
`describeRelation`.

Correctness comes before speed: it runs `relate`'s own logic once per person, after one
breadth-first walk finds who is connected at all (so unconnected people cost nothing). This
sidesteps the direction rule (`relate(a, b)` searches from whichever of the two comes first in
`people`, so a single search from `fromId` could pick a different chain when chains tie). The
single-search optimisation is left to the performance step (PLAN Step 4), behind the same equality
property and a benchmark.

### SVG

`toSvg(diagram, { name, roles?, ... })` returns an SVG string. Accessible: `role="img"`, a
`<title>`, and a text description of the chain. Styled through CSS classes / custom properties so it
fits light and dark pages; no inline colours that can't be overridden. No DOM APIs, so it runs in
Node (server rendering) and in the browser. Diagram data stays public for users who draw their own.

### GEDCOM

`fromGedcom(text)` returns `{ people, parents, unions }` with people as
`{ id, sex, name, born? }` (id = the GEDCOM xref, name from `NAME` without slashes, sex `M`/`F`/
otherwise unknown, `born` = year of `BIRT DATE` when parseable). Families: `HUSB`/`WIFE` become a
union, each `CHIL` a parent link to each partner. Supports the common subset of GEDCOM 5.5.1 and
7.0; ignores everything else; never throws on unknown tags. Lines may end in `\n` or `\r\n`.
Tested on small handwritten files and one real-world-shaped fictional sample.

### Validation

As PLAN step 5: cycles (own ancestor), more than two parents, links to unknown ids, self-marriage,
duplicate ids. `{ ok, issues: { code, message, ids }[] }`. `createTree` does not throw on bad
input; it behaves as today (skips links to unknown ids) and `validateTree` tells you why.

### Behaviour to keep (existing rules, do not "fix")

Costs 10 per step and 11 per marriage step; blood relation ⇔ moves match `/^U*D*$/`; a named
relation by marriage beats a blood tie more distant than first cousins; half-siblings only when
both have two recorded parents sharing exactly one; Greek gender + genitive, `unknown` gives both
forms, distant generations named through the person of the other's generation; English standard
genealogical terms; degree rules as above. All 27 existing tests (ported) must still pass.

## Order of work

Follows `docs/PLAN.md`, with the new features slotted in. `PLAN.md` is updated to match this
document as the first commit of the work.

1. Step 2: new API (`createTree`, `relate`, `describeRelation`, locale interface), module split,
   compatibility wrapper; el + en locales ported.
2. Step 3: tests ported to the new API, property-based tests, edge cases; wrapper removed.
3. New: fr, de, es locales; `relateAll`; `svg`; `gedcom`.
4. Steps 4–5: performance with benchmark, `validateTree`.
5. Steps 6–10: build, docs (README with language table, algorithm explanation, "add a language"
   guide), CI, live demo (uses GEDCOM + SVG + all languages), publish.
6. Step 11 (site uses the package) after publishing; the site may change as needed.

## Left to the builder

Exact type and function names beyond those fixed above; internal module boundaries; the precise
`kind` list; the `relateAll` algorithm (so long as it matches `relate`); SVG visuals; GEDCOM parser
internals; benchmark targets (set from the baseline); wording of sentences in fr/de/es (terms need
sources, sentences need only be natural).
