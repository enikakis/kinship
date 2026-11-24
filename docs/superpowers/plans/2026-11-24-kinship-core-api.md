# Kinship core API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the extracted site code into the library's core: generic people in, `createTree` / `relate` / `describe` out, with Greek and English as separate locale modules, and the existing behaviour kept exactly.

**Architecture:** Step-by-step refactor (spec approach A). The original code moves to `src/legacy/` and keeps its 27 tests running; each task extracts one part into its own module that the legacy code then imports, so the legacy tests guard every commit. When `relate` + `describe` exist, the legacy `relationReport` becomes a thin wrapper over them (proving the new API reproduces the old output), then the tests are ported to the new API and `src/legacy/` is deleted.

**Tech Stack:** TypeScript 5.9 (strict), Vitest 3.2, fast-check (dev only, added in Task 9). Node ≥ 20.

**Spec:** `docs/superpowers/specs/2026-11-24-kinship-v1-design.md`

This is plan 1 of 5. Later plans, written when this one is done: (2) fr / de / es locales; (3) `relateAll`, `svg`, `gedcom`; (4) performance benchmark + `validateTree`; (5) build, docs, CI, demo, publish.

## Global Constraints

- No runtime dependencies. Dev dependencies allowed (this plan adds only `fast-check`).
- TypeScript strict; `npm test` and `npm run typecheck` green after **every** commit.
- Behaviour changes get a failing test first; pure moves are guarded by the existing tests.
- Test fixtures and doc comments use fictional people only; the fixture surname is «Παπαδόπουλος».
- Commits: author is the owner (git is already configured as `enikakis`); every message ends with
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Plain-sentence subjects like the
  existing history (no `feat:` prefixes). Small, focused commits.
- No push, no GitHub repo, no npm publish.
- Keep these rules exactly (CLAUDE.md "Domain notes"): cost 10 per step / 11 per marriage step;
  blood ⇔ moves key matches `/^U*D*$/`; a named relation by marriage beats a blood tie more distant
  than first cousins (`FIRST_COUSIN_STEPS = 4`); half-siblings only when both have two recorded
  parents sharing exactly one; Greek gender + genitive, `unknown` gives both forms; English standard
  genealogical terms; legal degree: affinity only through one marriage at either end, couples and
  multi-marriage chains `null`.
- Which relationship is "main" never depends on the language.

## Review Focus

- **Duplicate links in the input** (the same `[parent, child]` twice, the same couple twice, common in imported data): must not create fake half-siblings or duplicate spouses. Test in Task 2.
- **Parent cycles from bad data** (someone recorded as their own ancestor): `relate` must return without hanging or throwing. Test in Task 10.
- **The caller's own objects come back:** results hold the very objects passed in (same identity, extra fields intact), typed as the caller's type. Test in Task 2 and Task 7.
- **Sex `unknown` anywhere on a chain:** names give both forms and never contain `undefined` / `NaN`. Property test in Task 9.
- **Very distant relatives:** Greek cousin ordinals beyond «έκτος» read as words or as «11ος», never «8.»; 12-generation ancestors are named. Test in Task 10.

---

### Task 1: Point the roadmap at the design, move the original code aside

**Files:**
- Modify: `docs/PLAN.md`
- Move: `src/kinship.ts` → `src/legacy/kinship.ts`, `src/kinship.test.ts` → `src/legacy/kinship.test.ts`, `src/tree.ts` → `src/legacy/tree.ts`, `src/locale.ts` → `src/legacy/locale.ts`
- Modify: `src/index.ts` (import paths only)

**Interfaces:**
- Produces: the legacy suite at `src/legacy/kinship.test.ts` (27 tests), which every later task until Task 8 must keep green.

- [ ] **Step 1: Update `docs/PLAN.md`**

Under the title add: `Design: docs/superpowers/specs/2026-11-24-kinship-v1-design.md · Implementation plans: docs/superpowers/plans/`. Replace the body of "Step 2" with one line pointing to the spec's "Decided design" and to this plan (keep its checkboxes as the list of this plan's tasks 2–7). Insert a new step after Step 3, "New features", with unchecked boxes: fr / de / es locales; `relateAll`; `svg` entry; `gedcom` entry. Leave the other steps as they are.

- [ ] **Step 2: Commit**

```bash
git add docs/PLAN.md
git commit -m "Point the roadmap at the v1 design and its plans" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 3: Move the four files with `git mv` and fix the imports in `src/index.ts`**

Relative imports between the four moved files stay valid (they move together).

- [ ] **Step 4: Verify**

Run: `npm test && npm run typecheck`
Expected: `Tests  27 passed (27)`, no type errors.

- [ ] **Step 5: Commit**

```bash
git add -A src
git commit -m "Move the original code under src/legacy" -m "It keeps its 27 tests while the new modules are extracted from it." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Shared types and a generic `createTree`

**Files:**
- Create: `src/types.ts`, `src/tree.ts`, `src/tree.test.ts`
- Modify: `src/legacy/tree.ts` (`indexTree` becomes a wrapper), `src/legacy/kinship.ts` (spouses now return people)

**Interfaces:**
- Produces (`src/types.ts`):
  ```ts
  export type Sex = "female" | "male" | "unknown";
  export type Person = { id: string; sex: Sex };
  export type Move = "up" | "down" | "spouse";
  export type TreeInput<P extends Person> = {
    people: readonly P[];
    parents: readonly (readonly [parentId: string, childId: string])[];
    unions: readonly { a: string; b: string }[];
  };
  export type TreeOptions<P extends Person> = {
    name?: (person: P) => string;
    born?: (person: P) => number | undefined;
  };
  ```
- Produces (`src/tree.ts`):
  ```ts
  export type Tree<P extends Person> = {
    readonly byId: ReadonlyMap<string, P>;
    parents(id: string): P[];        // ordered, see below
    children(id: string): P[];
    spouses(id: string): P[];
    areHalfSiblings(a: string, b: string): boolean;
    name(person: P): string;
    born(person: P): number | undefined;
  };
  export function createTree<P extends Person>(input: TreeInput<P>, options?: TreeOptions<P>): Tree<P>;
  ```
  Ordering of `parents` / `children` / `spouses`: by `born` ascending (undefined last), then by position in `input.people`. Default `name`: the person's `name` property when it is a string, else `id`. Default `born`: always undefined. Links naming an unknown id are skipped; duplicate parent links and duplicate unions (either order of `a`/`b`) count once. `spouses` still scans the unions per call (indexing it is plan 4's measured optimisation).

- [ ] **Step 1: Write the failing tests in `src/tree.test.ts`**

```ts
const p = (id: string, sex: Sex, extra = {}) => ({ id, sex, ...extra });

it("orders relatives by birth, then as given", () => {
  const tree = createTree(
    { people: [p("mom", "female"), p("c", "male"), p("a", "female", { year: 1950 }), p("b", "male", { year: 1940 })],
      parents: [["mom", "c"], ["mom", "a"], ["mom", "b"]], unions: [] },
    { born: (x) => x.year },
  );
  expect(tree.children("mom").map((x) => x.id)).toEqual(["b", "a", "c"]);
});
it("keeps the given order without birth years", () => { /* same input, no `born` → ["c", "a", "b"] */ });
it("names people by their name, or by id", () => { /* {name:"Νίκος"} → "Νίκος"; no name → id; option `name` wins */ });
it("gives back the caller's own objects", () => { /* tree.byId.get("a") toBe the input object, extra fields intact */ });
it("skips links to people it does not know", () => { /* parent link and union to "ghost" → no parents/spouses */ });
it("counts a repeated link once", () => {
  // the same [dad, kid] twice and the couple recorded as (a,b) and (b,a)
  // → parents("kid") has dad once; spouses("a") has b once;
  // and two full siblings with a duplicated link are not half-siblings
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/tree.test.ts`
Expected: FAIL, `createTree` not found.

- [ ] **Step 3: Implement `src/types.ts` and `createTree` in `src/tree.ts`**

Start from `src/legacy/tree.ts`'s `indexTree`; drop `byBirth`'s name tie-break in favour of input position; dedupe with a `Set` of `parent→child` / sorted `a|b` keys.

- [ ] **Step 4: Make the legacy code use it**

`src/legacy/tree.ts`: `indexTree(tree)` returns `createTree(tree, { name: fullName, born: (p) => p.birth?.year })`; `TreeIndex = Tree<TreePerson>`. In `src/legacy/kinship.ts`, `index.spouses(id)` now yields people (drop the `{ person }` destructuring).

- [ ] **Step 5: Verify**

Run: `npm test && npm run typecheck`
Expected: new tests pass; legacy `27 passed`. If a legacy test fails **only** because of which of two equally short chains wins (the dropped name tie-break), loosen that expectation to `expect.stringMatching` / either-or like its neighbours, and say so in the commit body. Any other failure is a bug.

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "Add a generic createTree for any person shape" -m "Relatives are ordered by an optional birth year, then as given; repeated links count once." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Test fixtures for the new API

**Files:**
- Create: `src/testing/fixtures.ts`

**Interfaces:**
- Consumes: `createTree`, `Tree`, `TreeInput`, `Sex`.
- Produces:
  ```ts
  export type TestPerson = { id: string; sex: Sex; name: string; born?: number };
  export const person: (id: string, sex: Sex, born?: number) => TestPerson;  // name = `${id} Παπαδόπουλος`
  export const family: Tree<TestPerson>;    // the me / dad / aunt / wife … tree of the legacy test, with its ASCII diagram
  export const twice: Tree<TestPerson>;     // double cousins + the cousin marriage
  export const twoLines: Tree<TestPerson>;  // the "old common ancestor before a chain through children" tree
  export const village: Tree<TestPerson>;   // aunt's husband who is also a distant cousin
  export const tangled: Tree<TestPerson>;   // aunt's husband who is also an ancestor
  export function line(key: string, sexes: readonly Sex[] | Sex): { tree: Tree<TestPerson>; from: string; to: string };
  export const fromKey: (key: string) => Move[];                     // "UUD" → ["up", "up", "down"]
  export const sexesFor: (key: string, last: Sex) => Sex[];          // all "unknown", the last person `last`
  ```
  Copy the people, links and comments verbatim from `src/legacy/kinship.test.ts`; trees are built with `createTree(input, { born: (p) => p.born })`. `line` follows the legacy helper (ids `p0…pN`).

- [ ] **Step 1: Write `src/testing/fixtures.ts`**
- [ ] **Step 2: Verify** `npm run typecheck` passes (fixtures are used from Task 4 on).
- [ ] **Step 3: Commit** "Add shared test fixtures for the new API"

---

### Task 4: Split the chain machinery into modules

Pure moves out of `src/legacy/kinship.ts`, one module per commit; the legacy file imports each back. The only new behaviour is the legal-degree shape (test first).

**Files:**
- Create: `src/chain.ts`, `src/path.ts`, `src/ties.ts`, `src/classify.ts`, `src/choose.ts`, `src/degree.ts`, `src/degree.test.ts`, `src/diagram.ts`
- Modify: `src/legacy/kinship.ts`

**Interfaces:**
- Consumes: `Tree<P>`, `Person`, `Move` (Task 2); `fromKey` (Task 3).
- Produces:
  ```ts
  // src/chain.ts
  export type Chain<P extends Person> = { from: P; steps: { person: P; move: Move }[] };
  export const lastOf: <P extends Person>(chain: Chain<P>) => P;
  export const movesOf: (chain: Chain<Person>) => Move[];
  export const movesKey: (moves: readonly Move[]) => string;     // "UUD"
  export const BLOOD: RegExp;                                     // /^U*D*$/
  export const isBloodLine: (chain: Chain<Person>) => boolean;
  export const reverseMoves: (moves: readonly Move[]) => Move[];
  // src/path.ts   (was findConnection)
  export function findChain<P extends Person>(tree: Tree<P>, fromId: string, toId: string): Chain<P> | null;
  // src/ties.ts
  export type BloodTie<P extends Person> = { chain: Chain<P>; ancestors: P[] };
  export function otherBloodTies<P extends Person>(tree: Tree<P>, main: Chain<P>): BloodTie<P>[];
  // src/classify.ts (this task: only the marriage table)
  export type MarriageKind = "spouse" | "parentInLaw" | "childInLaw" | "siblingInLaw" | "coParentInLaw"
    | "coSiblingInLaw" | "uncleByMarriage" | "nephewByMarriage" | "stepParent" | "stepChild";
  export function marriageKind(key: string, sex: Sex, otherSex: Sex): MarriageKind | null;  // was marriageTerm
  // src/choose.ts
  export function findRelationships<P extends Person>(tree: Tree<P>, fromId: string, toId: string):
    { main: Chain<P>; others: BloodTie<P>[]; couple: boolean } | null;
  // src/degree.ts
  export type LegalDegree = { degree: number; line: "direct" | "collateral"; kind: "blood" | "affinity" };
  export function legalDegree(moves: readonly Move[]): LegalDegree | null;
  // src/diagram.ts
  export type DiagramNode<P extends Person> = { person: P; row: number; lane: number };
  export type ConnectionDiagram<P extends Person> = {
    nodes: DiagramNode<P>[]; rows: number; lanes: number;
    links: { from: string; to: string; kind: "parent" | "spouse" }[];
  };   // no `ends`: the two people are nodes[0] and nodes.at(-1)
  export function chainDiagram<P extends Person>(chain: Chain<P>): ConnectionDiagram<P>;
  ```

- [ ] **Step 1: Move `chain.ts` + `path.ts`; run `npm test` (27 pass); commit** "Extract the shortest-chain search"
- [ ] **Step 2: Move `ties.ts`; run `npm test`; commit** "Extract the other blood ties"
- [ ] **Step 3: Move the marriage table into `classify.ts` and `findRelationships` into `choose.ts`; run `npm test`; commit** "Extract the choice of the main relationship"
- [ ] **Step 4: Write the failing test `src/degree.test.ts`**

```ts
it.each([
  ["D", { degree: 1, line: "direct", kind: "blood" }],
  ["UU", { degree: 2, line: "direct", kind: "blood" }],
  ["UUD", { degree: 3, line: "collateral", kind: "blood" }],
  ["UUDD", { degree: 4, line: "collateral", kind: "blood" }],
  ["SU", { degree: 1, line: "direct", kind: "affinity" }],
  ["SUD", { degree: 2, line: "collateral", kind: "affinity" }],
  ["UDS", { degree: 2, line: "collateral", kind: "affinity" }],
  ["UUDDS", { degree: 4, line: "collateral", kind: "affinity" }],
])("counts %s as the civil law does", (key, expected) => expect(legalDegree(fromKey(key))).toEqual(expected));
it.each(["S", "DSU", "SUDS", "SUUDS"])("counts no degree for %s", (key) => expect(legalDegree(fromKey(key))).toBeNull());
```

- [ ] **Step 5: Run to verify it fails**, then **implement `legalDegree` in `src/degree.ts`** from the legacy `relationDegree` (`byMarriage` → `kind`, `direct` → `line`); adapt the legacy `phrases.degree` to the new shape. Run `npm test` (all pass); commit "Extract the legal degree as data".
- [ ] **Step 6: Move `chainDiagram` into `src/diagram.ts`** without roles; the legacy `describeChain` adds `ends` itself from its roles. Run `npm test`; commit "Extract the chain diagram layout".

---

### Task 5: Classify a chain (kind, generations, side, elder branch)

**Files:**
- Modify: `src/classify.ts`
- Create: `src/classify.test.ts`

**Interfaces:**
- Consumes: `Chain`, `movesKey`, `BLOOD`, `marriageKind`, `findChain` (Task 4); fixtures (Task 3).
- Produces:
  ```ts
  export type Kind =
    | "ancestor" | "descendant" | "sibling" | "halfSibling" | "uncle" | "nephew" | "cousin"
    | MarriageKind | "spouseOfRelative" | "relativeOfSpouse" | "unnamed";
  export type Blood = { up: number; down: number };
  export function kindOf(moves: readonly Move[], sexes: readonly Sex[], halfSibling: boolean): Kind;
  export type Classification = {
    kind: Kind;
    blood: Blood | null;
    cousin: { degree: number; removed: number } | null;
    side: "paternal" | "maternal" | null;
    elderBranch: "from" | "to" | null;
  };
  export function classify<P extends Person>(tree: Tree<P>, chain: Chain<P>): Classification;
  ```
  `kindOf` checks in the legacy `relationName` order: blood (down 0 → ancestor, up 0 → descendant, 1/1 → sibling or halfSibling, down 1 → uncle, up 1 → nephew, else cousin); then `marriageKind(key, last sex, first sex)`; then blood + trailing `S` → spouseOfRelative; leading `S` + blood → relativeOfSpouse; else unnamed. `sexes` = everyone on the chain, first person first. `cousin`: `{ degree: min(up, down) - 1, removed: |up - down| }` when both ≥ 2. `side`: only when the first move is `up`: the sex of that parent (male → paternal, female → maternal, unknown → null). `elderBranch`: only for collateral blood ties (up ≥ 1 and down ≥ 1): compare `tree.born` of the two children of the common ancestor on each branch (the from side: `steps[up - 2].person`, or `from` when up = 1; the to side: `steps[up].person`); earlier birth wins; null when either is unknown or equal.

- [ ] **Step 1: Write the failing tests**

```ts
it.each([
  ["U", "ancestor"], ["UUUU", "ancestor"], ["D", "descendant"], ["UD", "sibling"], ["UUD", "uncle"],
  ["UUUD", "uncle"], ["UDD", "nephew"], ["UUDD", "cousin"], ["UUUDD", "cousin"],
  ["S", "spouse"], ["SU", "parentInLaw"], ["DS", "childInLaw"], ["SUD", "siblingInLaw"], ["UDS", "siblingInLaw"],
  ["DSU", "coParentInLaw"], ["US", "stepParent"], ["SD", "stepChild"], ["UUDS", "uncleByMarriage"],
  ["SUUD", "uncleByMarriage"], ["SUDD", "nephewByMarriage"], ["UDDS", "nephewByMarriage"],
  ["UUDDS", "spouseOfRelative"], ["UUS", "spouseOfRelative"], ["SDD", "relativeOfSpouse"], ["UDSUD", "unnamed"],
])("calls %s a %s", (key, kind) => expect(kindOf(fromKey(key), sexesFor(key, "male"), false)).toBe(kind));
it("calls SUDS co-siblings-in-law only between two people of the same sex", () => {
  // ["female","male","unknown","male","female"] → coSiblingInLaw; ["male",…,"female"] → unnamed
});
it("tells half-siblings apart", () => { /* kindOf(["up","down"], …, true) → "halfSibling"; classify(family, me→half).kind */ });
it("counts cousins by degree and removal", () => {
  // UUDD → {1,0}; UUUDD → {1,1}; UUUDDD → {2,0}; UUUUDD → {1,2}; UUD → null
});
it("says which side of the family a relative is on", () => {
  // classify(l.tree, findChain(l.tree, l.from, l.to)!) for l = line("UU", ["male", "male", "female"]) → "paternal";
  // line("UU", ["male", "female", "female"]) → "maternal"; line("SU", "male") → null; line("D", "male") → null
});
it("says whose branch is the elder, when birth years allow", () => {
  // tree: grandpa's children dad (born 1950) and aunt (1945); me→cousin → "to"; cousin→me → "from";
  // same tree without years → null; me (1980) → sis (1982) → "from"
});
```

- [ ] **Step 2: Run to verify they fail**: `npx vitest run src/classify.test.ts` → FAIL, `kindOf` not exported.
- [ ] **Step 3: Implement `kindOf` and `classify`** in `src/classify.ts`; make `choose.ts`'s `hasName` use `kindOf` (named ⇔ blood or a `MarriageKind`; same rule as before).
- [ ] **Step 4: Verify** `npm test && npm run typecheck`: new tests pass, legacy 27 pass.
- [ ] **Step 5: Commit** "Classify a chain: kind, generations, side and elder branch"

---

### Task 6: The locale interface, with Greek and English as modules

**Files:**
- Create: `src/locale.ts`, `src/locales/shared.ts`, `src/locales/el.ts`, `src/locales/en.ts`, `src/locales/locales.test.ts`
- Modify: `src/legacy/kinship.ts` (naming now delegates to the locale modules)

**Interfaces:**
- Consumes: `Kind`, `Blood` (Task 5), `LegalDegree` (Task 4), `Move`, `Sex`; `fromKey` (Task 3).
- Produces:
  ```ts
  // src/locale.ts
  export type NameQuery = {
    kind: Kind;
    moves: readonly Move[];          // from the viewer to the named person
    blood: Blood | null;
    sexes: readonly Sex[];           // everyone on the chain, viewer first, named person last
  };
  export interface KinshipLocale {
    readonly code: string;           // "el", "en"
    name(query: NameQuery): string | null;   // null: no everyday name
    step(move: Move, sex: Sex): string;      // «πατέρας», "son"
    degree(degree: LegalDegree): string;
    throughMarriages(couples: readonly (readonly [string, string])[]): string;
    commonAncestors(names: readonly string[]): string;
  }
  // src/locales/el.ts, src/locales/en.ts
  export const el: KinshipLocale;  export const en: KinshipLocale;
  // src/locales/shared.ts
  export type Word = { male: string; female: string; unknown: string };
  export const w: (male: string, female: string, unknown?: string) => Word;
  ```
  Each locale owns its grammar: move `words`, ordinals, `greek*` / `english*`, `bySex`, `englishNumber` and the sentence `phrases` out of the legacy file into the locale that uses them. `name` covers what the legacy `relationName` did, with `kind` and `sexes` instead of re-deriving them. No `locale === "el"` branches remain anywhere.

- [ ] **Step 1: Write the failing test `src/locales/locales.test.ts`** (a smoke test of the interface; the full name tables are guarded by the legacy suite now and ported in Task 8)

```ts
const query = (kind: Kind, key: string, sexes: Sex[], blood: Blood | null = null): NameQuery =>
  ({ kind, moves: fromKey(key), sexes, blood });
it("names an aunt in both languages", () => {
  const q = query("uncle", "UUD", ["male", "male", "male", "female"], { up: 2, down: 1 });
  expect(el.name(q)).toBe("θεία");
  expect(en.name(q)).toBe("aunt");
});
it("has no name for a chain through a marriage in the middle", () => {
  expect(el.name(query("unnamed", "UDSUD", ["male", "unknown", "female", "male", "unknown", "male"]))).toBeNull();
});
it("says the steps and the degree", () => {
  expect(el.step("up", "female")).toBe("μητέρα");
  expect(en.degree({ degree: 3, line: "collateral", kind: "blood" })).toBe("Related by blood in the collateral line, 3rd degree");
});
```

- [ ] **Step 2: Run to verify it fails**: `npx vitest run src/locales` → FAIL, modules missing.
- [ ] **Step 3: Move the naming code into `el.ts` / `en.ts`** and make the legacy `describeChain` call `locales[locale].name(...)` with a `NameQuery` built from `kindOf` (both directions: reversed moves and reversed sexes).
- [ ] **Step 4: Verify** `npm test && npm run typecheck`: all pass, legacy 27 included.
- [ ] **Step 5: Commit** "Move Greek and English naming into locale modules"

---

### Task 7: `relate` and `describe`, and the legacy report as a wrapper

**Files:**
- Create: `src/relate.ts`, `src/describe.ts`, `src/relate.test.ts`
- Modify: `src/legacy/kinship.ts` (`relationReport` = `relate` + `describe` + `ends`), `src/index.ts`

**Interfaces:**
- Consumes: everything above.
- Produces:
  ```ts
  // src/relate.ts
  export type Relationship<P extends Person> = Classification & {
    from: P; to: P;
    path: { person: P; move: Move }[];
    moves: Move[];
    legalDegree: LegalDegree | null;
    diagram: ConnectionDiagram<P>;
  };
  export type OtherTie<P extends Person> = Relationship<P> & { commonAncestors: P[] };
  export type Relation<P extends Person> = { main: Relationship<P>; others: OtherTie<P>[]; couple: boolean };
  export function relate<P extends Person>(tree: Tree<P>, fromId: string, toId: string): Relation<P> | null;
  // src/describe.ts
  export type RelationshipText = {
    roles: { other: string; self: string } | null;
    summary: string;
    degree: string | null;
    chain: { id: string; text: string }[];
  };
  export type RelationText = {
    main: RelationshipText;
    others: (RelationshipText & { commonAncestors: string | null })[];
    couple: boolean;
  };
  export function describe<P extends Person>(tree: Tree<P>, relation: Relation<P>, locale: KinshipLocale): RelationText;
  ```
  Exact copy kept from the legacy code: chain item 0 is `tree.name(from)`; each next is `${locale.step(move, person.sex)}: ${tree.name(person)}`; `summary` is `roles?.other ?? locale.throughMarriages(couples)`; `commonAncestors` text is null when an ancestor is one of the two ends. `halfSibling` for a `UD` chain comes from `tree.areHalfSiblings`.
  `src/index.ts` exports `createTree`, `relate`, `describe` and the public types (`Sex`, `Person`, `Move`, `TreeInput`, `TreeOptions`, `Tree`, `Kind`, `Blood`, `LegalDegree`, `ConnectionDiagram`, `DiagramNode`, `Relationship`, `OtherTie`, `Relation`, `RelationshipText`, `RelationText`, `KinshipLocale`, `NameQuery`), plus the legacy exports until Task 8.

- [ ] **Step 1: Write the failing tests `src/relate.test.ts`**

```ts
it("relates two people with plain objects, in a few lines", () => {
  const tree = createTree({
    people: [{ id: "gp", sex: "male" }, { id: "dad", sex: "male" }, { id: "maria", sex: "female", name: "Μαρία" }, { id: "nikos", sex: "male", name: "Νίκος" }],
    parents: [["gp", "dad"], ["gp", "maria"], ["dad", "nikos"]],
    unions: [],
  });
  const rel = relate(tree, "nikos", "maria")!;
  expect(rel.main).toMatchObject({ kind: "uncle", blood: { up: 2, down: 1 }, legalDegree: { degree: 3, line: "collateral", kind: "blood" } });
  expect(rel.main.to).toBe(tree.byId.get("maria"));   // the caller's own object
  expect(describe(tree, rel, el).main.roles).toEqual({ other: "θεία", self: "ανιψιός" });
  expect(describe(tree, rel, en).main.roles).toEqual({ other: "aunt", self: "nephew" });
});
it("is null for people who are not connected, or for the same person", () => {
  // family: me→stranger, me→me, me→"ghost"
});
it("gives the other blood ties with their common ancestors as people", () => {
  // twice: c1→c3 → couple true, main.kind "spouse", others[0].kind "cousin", commonAncestors ids ["ma","pa"] (any order)
});
it("puts the aunt's husband first, before his distant blood tie", () => {
  // village: me→husband → main.kind "uncleByMarriage", others.length 1, others[0].cousin { degree: 3, removed: 1 }
});
```

- [ ] **Step 2: Run to verify they fail**: `npx vitest run src/relate.test.ts` → FAIL, `relate` missing.
- [ ] **Step 3: Implement `relate` (from `findRelationships` + `classify` + `legalDegree` + `chainDiagram`) and `describe`** (from the legacy `describeChain` / `commonAncestors` / `marriagesOf`).
- [ ] **Step 4: Rewrite the legacy `relationReport`** as `relate` → `describe` → old shape (`from`, `to`, and diagram `ends` with the roles). The legacy file should now be only this wrapper.
- [ ] **Step 5: Verify** `npm test && npm run typecheck`: new tests pass and the **legacy 27 pass unchanged**, which proves the new API reproduces the old output.
- [ ] **Step 6: Commit** "Add relate and describe; the old report is now a wrapper over them"

---

### Task 8: Port the tests to the new API and remove the legacy code

**Files:**
- Create: `src/locales/el.test.ts`, `src/locales/en.test.ts`, `src/diagram.test.ts`, `src/ties.test.ts`
- Modify: `src/relate.test.ts`, `src/index.ts`, `CLAUDE.md` (Layout section)
- Delete: `src/legacy/`

**Interfaces:**
- Consumes: fixtures (Task 3), `relate`, `describe`, `el`, `en`.

- [ ] **Step 1: Port every assertion of `src/legacy/kinship.test.ts`** to the new API, using the fixtures:
  - chain texts, summaries, roles, degree sentences, common-ancestor sentences → `el.test.ts` / `en.test.ts` (via `describe`);
  - "not connected / same person", chain ids, `couple`, main-vs-other choice → `relate.test.ts` (data assertions);
  - other ties and their order → `ties.test.ts`;
  - rows / lanes / links → `diagram.test.ts`; the old "marks the two people" test becomes: `nodes[0]` and `nodes.at(-1)` are the two people, and `describe(...).main.roles` gives their names (`null` for the UDSUD chain).
  Keep the test names and the ASCII diagrams' comments. Each legacy `expect` must have a counterpart; none may be dropped.
- [ ] **Step 2: Verify** `npm test`: the ported suites pass alongside the legacy one.
- [ ] **Step 3: Delete `src/legacy/`, drop the legacy exports from `src/index.ts`, update CLAUDE.md "Layout"** to the new files (one line each, as now).
- [ ] **Step 4: Verify** `npm test && npm run typecheck`: all pass; `git grep -n legacy src` prints nothing.
- [ ] **Step 5: Commit** "Port the tests to the new API and remove the legacy code"

---

### Task 9: Property-based tests

**Files:**
- Create: `src/testing/arbitraries.ts`, `src/properties.test.ts`
- Modify: `package.json` (devDependency `fast-check`)

**Interfaces:**
- Produces (`src/testing/arbitraries.ts`):
  ```ts
  export const arbTree: fc.Arbitrary<{ tree: Tree<TestPerson>; ids: string[] }>;
  ```
  2–30 people with random sex (all three values) and optional birth year; parent links only from a lower to a higher index (acyclic), at most two parents per child; 0–10 random unions between distinct people. Pairs are drawn as two indices into `ids`.

- [ ] **Step 1: Install** `npm install --save-dev fast-check`
- [ ] **Step 2: Write `src/properties.test.ts`** with these properties (each `fc.assert(fc.property(...))`):
  - `relate(a, b) === null` ⇔ `relate(b, a) === null`;
  - `findChain(a, b)` and `findChain(b, a)` have the same number of steps and of marriage steps;
  - `reverseMoves(reverseMoves(m))` equals `m` (arbitrary move arrays);
  - `legalDegree(m)` deep-equals `legalDegree(reverseMoves(m))` for every `main.moves`;
  - for every pair with a blood `main` (or a `MarriageKind` main), `describe` with `el` and with `en` gives non-null `roles`;
  - no string anywhere in `describe(...)` output (both locales) contains `undefined` or `NaN`.
- [ ] **Step 3: Run** `npx vitest run src/properties.test.ts`. Expected: PASS. A counterexample is a real bug: add it as a plain unit test in the owning module's test file, fix it there, then re-run.
- [ ] **Step 4: Commit** "Add property-based tests on random trees"

---

### Task 10: Edge cases

**Files:**
- Modify: `src/relate.test.ts`, `src/locales/el.test.ts`, `src/locales/en.test.ts`, `src/locales/el.ts`, `docs/PLAN.md`

- [ ] **Step 1: Write the failing / pinning tests**

```ts
// el.test.ts
it("names cousins beyond the sixth with words, then with numbers", () => {
  expect(name(line("U".repeat(8) + "D".repeat(8), "male"))).toBe("έβδομος εξάδελφος");
  expect(name(line("U".repeat(11) + "D".repeat(11), "female"))).toBe("δέκατη εξαδέλφη");
  expect(name(line("U".repeat(12) + "D".repeat(12), "male"))).toBe("11ος εξάδελφος");
  // genitive: a parent's 8th cousin
  expect(name(line("U".repeat(10) + "D".repeat(9), "male"))).toBe("όγδοος εξάδελφος του γονιού");
});
it("names an ancestor twelve generations up", () => {
  expect(name(line("U".repeat(12), "male"))).toBe("πρόγονος 12ης γενιάς");
});
// en.test.ts
it("names very distant relatives", () => {
  expect(name(line("U".repeat(12), "male"))).toBe("10th great-grandfather");
  expect(name(line("U".repeat(8) + "D".repeat(8), "female"))).toBe("7th cousin");
});
// relate.test.ts
it("finds both ways the child of two first cousins descends from the common grandparents", () => {
  // pedigree collapse: gp ═ gm (a recorded union) → a, b; a → x, b → y; x ═ y → kid. relate(kid, gp): main ancestor (blood up 3),
  // others: none (gp is on the main chain); relate(x, y): couple, others[0].kind "cousin"
});
it("does not hang on a parent cycle in bad data", () => {
  // a is parent of b, b is parent of a, b parent of c: relate(tree, "c", "a") returns (not null), no throw
});
it("gives both forms when nobody's sex is known", () => {
  // line("UUD", "unknown"): el "θείος/θεία", en "uncle/aunt"
});
```
(`name(l)` = `describe(l.tree, relate(l.tree, l.from, l.to)!, locale).main.summary`.)

- [ ] **Step 2: Run** `npx vitest run src`. Expected: the Greek ordinal tests FAIL (today «8. εξάδελφος»); the others should pass (if one fails, it is a bug: fix it in its module).
- [ ] **Step 3: Extend the Greek ordinals** in `src/locales/el.ts`: add έβδομος/έβδομη, όγδοος/όγδοη, ένατος/ένατη, δέκατος/δέκατη and their genitives (έβδομου/έβδομης, όγδοου/όγδοης, ένατου/ένατης, δέκατου/δέκατης); beyond ten: `${n}ος` / `${n}η`, genitive `${n}ου` / `${n}ης`.
- [ ] **Step 4: Verify** `npm test && npm run typecheck`: all pass.
- [ ] **Step 5: Tick Steps 2 and 3 in `docs/PLAN.md`** (only the boxes this plan completed).
- [ ] **Step 6: Commit** "Cover very distant relatives, pedigree collapse and bad data"
