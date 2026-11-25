# Correctness and Locale Groundwork Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the two known correctness issues (Greek wording for unknown sex and for distant female relatives; `relate` answering differently depending on which end you ask from) and prepare the code and tests so that French, German and Spanish can be added next without copying.

**Architecture:** Small, test-first changes to existing modules. Greek wording lives only in `src/locales/el.ts`. Direction independence is decided in `src/choose.ts`: the search always runs from the person who comes first in the input, and the result is reversed for the other direction. Kind lists become typed and exhaustive in `src/classify.ts`; test helpers that take a locale move into `src/testing/`.

**Tech Stack:** TypeScript 5.9 (strict), Vitest 3.2, fast-check (dev only). Node ≥ 20.

**Spec:** `docs/superpowers/specs/2026-11-24-kinship-v1-design.md`. Inputs: `docs/PLAN.md` "Step 3b" (first item) and "Follow-ups from the core API reviews".

This is plan 2. Plan 3 adds the fr / de / es locales (with sourced term tables); plan 4 adds `relateAll`, `svg`, `gedcom`.

## Global Constraints

- No runtime dependencies. Dev dependencies only.
- TypeScript strict; `npm test` and `npm run typecheck` green after **every** commit.
- Behaviour changes get a failing test first; refactors keep all tests green.
- Fixtures and doc comments use fictional people only (surname «Παπαδόπουλος»).
- Commits: author is the owner (git is configured); messages follow Conventional Commits as in `CLAUDE.md` (`type(scope): subject`, imperative, lower case); every message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Small, focused commits. No push.
- Keep the domain rules in `CLAUDE.md` "Domain notes" (costs 10/11, blood ⇔ `/^U*D*$/`, named-by-marriage beats blood beyond first cousins, half-sibling rule, legal-degree rules).
- Owner decisions for Greek: a person of unknown sex gets **both full forms**, each with its own ordinal and article («τέταρτος εξάδελφος/τέταρτη εξαδέλφη», «του προγόνου/της προγόνου 7ης γενιάς»); a woman gets the feminine article in the genitive («της προγόνου 7ης γενιάς», «της απογόνου 5ης γενιάς»). Unknown sex for 1–4 generations of descendants keeps the existing neuter forms («του παιδιού», «του εγγονιού»).
- Which relationship is "main" never depends on the language, and (after Task 2) never on which of the two people is asked about first.

## Review Focus

- **Asking from the other end:** `relate(b, a)` must give the same chain backwards, inverse kind and equal legal degree as `relate(a, b)`, also when equally short chains tie. Property test in Task 2.
- **The other blood ties from the other end:** the same number of other ties with the same common ancestors either way. Property test in Task 2.
- **Unknown sex anywhere in a Greek name:** every ordinal and genitive gives both full forms, never a masculine ordinal with a feminine noun. Tests in Task 1.
- **A new `Kind` added later** must not be silently treated as having (or lacking) an everyday name. Compile-time exhaustiveness and a test in Task 3.
- **The diagram from the other end** lists the same people in reverse order. Test in Task 2.

---

### Task 1: Greek wording for unknown sex and distant women

**Files:**
- Modify: `src/locales/el.ts` (`kin`, `ancestor`, `descendant`)
- Test: `src/locales/el.test.ts`

**Interfaces:**
- Consumes: existing `line(key, sexes)` fixture and the file's `along(key, sexes)` helper.
- Produces: no API change.

- [ ] **Step 1: Write the failing tests in `src/locales/el.test.ts`**

```ts
describe("people whose sex is not known, and distant women", () => {
  it("gives both full forms for a cousin of unknown sex", () => {
    expect(along("UUUUUDDDDD", "unknown").summary).toBe("τέταρτος εξάδελφος/τέταρτη εξαδέλφη");
    expect(along("U".repeat(8) + "D".repeat(8), "unknown").summary).toBe("έβδομος εξάδελφος/έβδομη εξαδέλφη");
  });
  it("puts a distant ancestor or descendant in the right genitive", () => {
    const sexes = (n: number, relative: Sex, last: Sex): Sex[] => [...Array(n - 1).fill("male"), relative, last];
    // The husband of a woman seven generations up; of a man; of someone of unknown sex.
    expect(along("UUUUUUUS", sexes(8, "female", "male")).summary).toBe("σύζυγος της προγόνου 7ης γενιάς");
    expect(along("UUUUUUUS", sexes(8, "male", "female")).summary).toBe("σύζυγος του προγόνου 7ης γενιάς");
    expect(along("UUUUUUUS", sexes(8, "unknown", "male")).summary).toBe("σύζυγος του προγόνου/της προγόνου 7ης γενιάς");
    // The same five generations down.
    expect(along("DDDDDS", sexes(6, "female", "male")).summary).toBe("σύζυγος της απογόνου 5ης γενιάς");
    expect(along("DDDDDS", sexes(6, "unknown", "male")).summary).toBe("σύζυγος του απογόνου/της απογόνου 5ης γενιάς");
  });
});
```
Also change the existing expectation in "puts an old common ancestor before a closer chain…" (`text("me", "you", twoLines).main.summary`) from «τέταρτος εξάδελφος/εξαδέλφη» to «τέταρτος εξάδελφος/τέταρτη εξαδέλφη».

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/locales/el.test.ts`
Expected: FAIL on the new tests and the changed twoLines expectation (today «τέταρτος εξάδελφος/εξαδέλφη», «του προγόνου», «του απογόνου»).

- [ ] **Step 3: Implement in `src/locales/el.ts`**

`kin` (nominative, rung ≥ 2): build each sex's form separately and join with `bySex`, like the genitive branch already does. `ancestor` beyond five generations with `of`: «του προγόνου» / «της προγόνου» by sex, both for unknown. `descendant` beyond four generations with `of`: «του απογόνου» / «της απογόνου» by sex, both for unknown. Update the doc comments' examples.

- [ ] **Step 4: Verify**

Run: `npm test && npm run typecheck`
Expected: all pass; no other Greek expectation changes. If one does, it is a sign the change reached further than the three functions — stop and report it.

- [ ] **Step 5: Commit**

```bash
git add src/locales/el.ts src/locales/el.test.ts
git commit -m "fix(locales): give both Greek forms for unknown sex and the feminine genitive for distant women" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: The same relationship from either end

**Files:**
- Modify: `src/chain.ts`, `src/tree.ts`, `src/choose.ts`, `src/types.ts` (doc of `born`), `src/relate.ts` (doc of `relate`), `docs/PLAN.md` (Step 3b first item)
- Test: `src/relate.test.ts`, `src/properties.test.ts`, `src/chain.test.ts` (create)

**Interfaces:**
- Consumes: `Chain<P>`, `reverseMoves` (chain.ts); `findChain`, `otherBloodTies`.
- Produces:
  ```ts
  // src/chain.ts
  /** The same chain read from its last person back to the first. */
  export function reverseChain<P extends Person>(chain: Chain<P>): Chain<P>;
  // src/tree.ts — internal, NOT exported from src/index.ts
  /** Where a person stands in the input's `people` (0-based); Infinity for unknown ids. */
  export function positionOf(tree: Tree<Person>, id: string): number;
  ```
  `createTree` records each tree's positions in a module-level `WeakMap<Tree, Map<string, number>>`; `positionOf` reads it (a tree not made by `createTree` falls back to comparing ids, so results stay deterministic). `findRelationships(tree, fromId, toId)`: when `positionOf(toId) < positionOf(fromId)`, compute `findRelationships(tree, toId, fromId)` and return it with `main` and every tie's `chain` passed through `reverseChain` (ancestors and `couple` unchanged). Nothing else in `choose.ts` changes.

- [ ] **Step 1: Write the failing tests**

In `src/chain.test.ts`:
```ts
it("reads a chain backwards", () => {
  // a →up b →spouse c →down d   becomes   d →up c →spouse b →down a
  const [a, b, c, d] = ["a", "b", "c", "d"].map((id) => ({ id, sex: "unknown" as const }));
  const chain = { from: a, steps: [{ person: b, move: "up" as const }, { person: c, move: "spouse" as const }, { person: d, move: "down" as const }] };
  expect(reverseChain(chain)).toEqual({ from: d, steps: [{ person: c, move: "up" }, { person: b, move: "spouse" }, { person: a, move: "down" }] });
  expect(reverseChain(reverseChain(chain))).toEqual(chain);
});
```
In `src/relate.test.ts`: turn `it.fails("gives the same relationship from either end", …)` into `it(...)`, delete the "Known to fail" comment, and add to it:
```ts
  const there = relate(tree, "anna", "bob")!.main;
  const back = relate(tree, "bob", "anna")!.main;
  const people = (r: typeof there) => [r.from, ...r.path.map((step) => step.person)].map((p) => p.id);
  expect(people(back)).toEqual(people(there).reverse());
  expect(back.diagram.nodes.map((node) => node.person.id)).toEqual(people(back));
```
In `src/properties.test.ts`, a new property (default runs):
```ts
it("gives the same relationship from either end", () => {
  // for every related pair (a, b): with there = relate(tree, a, b), back = relate(tree, b, a)
  //   people(back.main) equals people(there.main) reversed;
  //   back.main.moves equals reverseMoves(there.main.moves);
  //   back.main.legalDegree deep-equals there.main.legalDegree;
  //   back.couple === there.couple; back.others.length === there.others.length;
  //   the sorted id lists of each tie's commonAncestors are equal, tie by tie.
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/chain.test.ts src/relate.test.ts src/properties.test.ts`
Expected: FAIL: `reverseChain` missing; the Anna/Bob test fails on Bob's side (`unnamed`); the property finds a counterexample.

- [ ] **Step 3: Implement `reverseChain`, `positionOf` and the direction rule in `findRelationships`** as specified in Interfaces.

- [ ] **Step 4: Update the docs**

`src/types.ts` (`born`): add that when chains tie, the search runs from whichever of the two people comes first in `people`, so the answer is the same from either end. `src/relate.ts` (`relate` doc): one sentence saying `relate(tree, b, a)` is `relate(tree, a, b)` read backwards. `docs/PLAN.md` Step 3b: tick "Make `relate` independent of direction…".

- [ ] **Step 5: Verify**

Run: `npm test && npm run typecheck`
Expected: all pass, including every existing pinned chain (the tie-order tests ask from the person who comes first, so their answers must not change). If a pinned expectation changes, stop and report it rather than editing it.

- [ ] **Step 6: Commit**

```bash
git add src docs/PLAN.md
git commit -m "fix(relate): give the same relationship from either end" -m "When equally short chains tie, search from the person who comes first in the input and read the result backwards for the other direction." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Exhaustive kind lists and property tests over every locale

**Files:**
- Modify: `src/classify.ts`, `src/choose.ts`, `src/properties.test.ts`
- Create: `src/locales/index.ts`
- Test: `src/classify.test.ts`

**Interfaces:**
- Consumes: `Kind`, `MarriageKind` (classify.ts); `el`, `en`.
- Produces:
  ```ts
  // src/classify.ts (internal; not exported from src/index.ts)
  export const BLOOD_KINDS: readonly Kind[];      // ancestor, descendant, sibling, halfSibling, uncle, nephew, cousin
  export const MARRIAGE_KINDS: readonly MarriageKind[];  // the ten marriage kinds
  /** Whether a relationship of this kind has an everyday name (blood, or a named relation by marriage). */
  export function isNamedKind(kind: Kind): boolean;
  // src/locales/index.ts (internal, for tests and later plans)
  export const LOCALES: readonly KinshipLocale[];  // [el, en]
  ```
  `isNamedKind` is backed by a `const NAMED: Record<Kind, boolean>` so a new `Kind` without an entry is a compile error. `BLOOD_KINDS` / `MARRIAGE_KINDS` are derived from or checked against the same source so they can't drift.

- [ ] **Step 1: Write the failing test in `src/classify.test.ts`**

```ts
it("knows which kinds have an everyday name", () => {
  for (const kind of [...BLOOD_KINDS, ...MARRIAGE_KINDS]) expect(isNamedKind(kind), kind).toBe(true);
  for (const kind of ["spouseOfRelative", "relativeOfSpouse", "unnamed"] as const) expect(isNamedKind(kind), kind).toBe(false);
  expect(BLOOD_KINDS).toHaveLength(7);
  expect(MARRIAGE_KINDS).toHaveLength(10);
});
```

- [ ] **Step 2: Run to verify it fails**: `npx vitest run src/classify.test.ts` → FAIL, exports missing.
- [ ] **Step 3: Implement** `BLOOD_KINDS`, `MARRIAGE_KINDS`, `isNamedKind` in `src/classify.ts`; make `hasName` in `src/choose.ts` use `isNamedKind`; create `src/locales/index.ts` with `LOCALES`.
- [ ] **Step 4: Rework `src/properties.test.ts`**: drop its hand-written kind lists in favour of `isNamedKind`; run the "has names" and "no undefined/NaN" properties for every locale in `LOCALES`; the "has names" property also checks every tie in `others` (all blood, so all named) has non-null roles; give the cheap properties `{ numRuns: 500 }` and keep the file under ~2 s (report the time).
- [ ] **Step 5: Verify** `npm test && npm run typecheck` → all pass.
- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "refactor(classify): make the named kinds an exhaustive list and test every locale" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Shared locale test helpers and the remaining tests

**Files:**
- Create: `src/testing/describing.ts`
- Modify: `src/locales/el.test.ts`, `src/locales/en.test.ts`, `src/classify.test.ts`, `docs/PLAN.md` (Follow-ups)

**Interfaces:**
- Consumes: `relate`, `describeRelation`, fixtures (`family`, `line`, `TestPerson`), `KinshipLocale`.
- Produces:
  ```ts
  // src/testing/describing.ts
  export function describing(locale: KinshipLocale): {
    text(from: string, to: string, tree?: Tree<TestPerson>): RelationText;   // tree defaults to `family`
    roles(from: string, to: string): RelationText["main"]["roles"];
    along(key: string, sexes: readonly Sex[] | Sex): RelationshipText;
    ties(from: string, to: string, tree: Tree<TestPerson>): { main: string; couple: boolean; others: { name: string; ancestors: string | null }[] };
  };
  ```
  Same behaviour as the four helpers now copied at the top of `el.test.ts` and `en.test.ts`; those files use `const { text, roles, along, ties } = describing(el)` (or `en`) instead.

- [ ] **Step 1: Create `src/testing/describing.ts` and switch both test files to it.** Run `npx vitest run src/locales` → the same number of tests pass as before.
- [ ] **Step 2: Commit**

```bash
git add src/testing/describing.ts src/locales/el.test.ts src/locales/en.test.ts
git commit -m "test(locales): share the describing helpers between locales" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 3: Add the remaining tests**

```ts
// src/classify.test.ts, in "says which side of the family a relative is on"
expect(sideOf("UU", ["male", "unknown", "female"])).toBeNull();
// src/classify.test.ts, in the elder-branch test
// equal birth years → null;
// three generations up: great-grandparent g → children b1 (born 1900), b2 (born 1905); b1 → … → me (3 down), b2 → … → cousin (3 down):
//   classify(me → cousin).elderBranch === "from"; classify(cousin → me).elderBranch === "to"
// src/locales/el.test.ts "goes through blood relations rather than marriages": pin the middle step to
//   "πατέρας: dad Παπαδόπουλος" (dad comes before mom in `people`), with a comment saying so.
```
Run: `npx vitest run src/classify.test.ts src/locales/el.test.ts` → PASS (these pin existing behaviour; a failure is a bug to report, not to paper over).

- [ ] **Step 4: Tick the done items in `docs/PLAN.md` "Follow-ups"** (the Greek wording decision, "before fr / de / es", "tests still to add").
- [ ] **Step 5: Verify** `npm test && npm run typecheck` → all pass.
- [ ] **Step 6: Commit**

```bash
git add src docs/PLAN.md
git commit -m "test: pin side, elder branch and tie order in the remaining cases" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
