# Plan: from extracted code to a published npm package

Design: docs/superpowers/specs/2026-11-24-kinship-v1-design.md · Implementation plans: docs/superpowers/plans/

Goal: publish `@enikakis/kinship` as a polished, zero-dependency TypeScript library that works
as a portfolio showcase (clear API, strong tests, docs, live demo, CI, verified npm provenance),
then make `vrisies-history-hub` use it instead of its own copy.

Work through the steps in order; tick boxes as you go. Keep `npm test` green after every commit.

---

## Step 1: Repo setup ✅ (done 2026-11-24)

- [x] New repo with the original files (first commit, verbatim) from `vrisies-history-hub@3433dad`
- [x] Standalone: trimmed `tree.ts` (no zod, no site fields), `locale.ts`, imports rewired
- [x] `package.json`, strict `tsconfig.json`, Vitest; 27/27 tests pass, typecheck clean
- [x] `CLAUDE.md`, this plan, README stub, MIT license

## Step 2: Design the public API (data first, words second)

See "Decided design" in the design doc above and its core-API implementation plan; the boxes below are that plan's tasks 2–7.

- [x] **Generic person type:** `<P extends { id: string; sex: Sex }>`, so users pass their own
      objects and get them back typed. Name display via an option `name?: (p: P) => string`
      (default: `p.name` when it is a string, else `p.id`). Remove `given_name` / `surname` /
      `living` from the core.
- [x] **Input shape** stays close to today:
      `{ people: P[]; parents: [parentId, childId][]; unions: { a: string; b: string }[] }`.
- [x] **Structured result:** `relate(tree, from, to)` → `{ main, others, couple }` or null; the
      built shape is in the design doc, "Decided design → Result".
- [x] **Languages as separate, tree-shakeable modules:** `@enikakis/kinship/locales/el` and
      `/locales/en`, each implementing one `KinshipLocale` interface (names, ordinals, phrases).
      The locale modules exist (`src/locales/el.ts`, `en.ts`); the package subpath exports come
      with the build (Step 6).
      `describeRelation(tree, relation, locale)` → `{ main, others, couple }`, each with `{ roles, summary, degree, chain }` (today's `Relationship` strings).
- [x] Keep a compatibility wrapper that reproduces the original `relationReport()` output exactly, so
      the existing tests keep passing during the refactor (delete it once tests are ported).
- [x] Split `kinship.ts` into modules:
      ```
      src/
      ├── index.ts        public API: createTree, relate, describeRelation, validateTree (Step 5), types
      ├── tree.ts         indexing (parents / children / spouses as Maps)
      ├── path.ts         shortest chain (Dijkstra)
      ├── ties.ts         other blood ties, closest common ancestors
      ├── choose.ts       which relationship is main (findRelationships rules)
      ├── classify.ts     moves → kind / cousin degree / removed
      ├── degree.ts       legal degree (ΑΚ 1463–1464)
      ├── diagram.ts      chain layout data
      └── locales/{el,en}.ts
      ```

## Step 3: Tests

- [x] Port the original tests to the new API (data assertions + per-locale name assertions).
- [x] Property-based tests with `fast-check` on random trees:
  - path A→B and B→A have the same length; `reverse(reverse(moves)) === moves`
  - a chain and its reverse count the same legal degree; `relate(a, b)` is null ⇔ `relate(b, a)` is null
  - blood relationships always have a name in both locales; no name contains "undefined"
- [x] Tests for edge cases: unknown sex, single parent recorded, pedigree collapse (cousin
      marriages), very distant relatives (ordinals beyond «έκτος», 10+ generations).

## Step 3b: New features

- [ ] Make `relate` independent of direction (same main relationship, inverse roles, equal degree
      from either end); turn the `it.fails` test in relate.test.ts into a passing test
- [ ] fr / de / es locales
- [ ] `relateAll`
- [ ] `svg` entry
- [ ] `gedcom` entry

## Step 4: Performance

- [ ] Add a benchmark (`vitest bench`) on a generated ~10,000-person tree; record the baseline.
- [ ] `spouses()` scans every union per call, inside the path search → index unions in a `Map`.
- [ ] Dijkstra re-sorts the whole queue each iteration → small binary heap (or a bucket queue:
      costs are only 10 / 11).
- [ ] Re-measure; put real before/after numbers in the README.

## Step 5: `validateTree()`

- [ ] Report problems instead of misbehaving: cycles (own ancestor), more than two parents,
      parent / union links to unknown ids, self-marriage, duplicate ids.
- [ ] Returns `{ ok: boolean; issues: { code, message, ids }[] }`; tested.

## Step 6: Build & package

- [ ] Build with `tsup` (or `tsdown`): ESM + CJS + `.d.ts`; `exports` map with `"."` and
      `"./locales/*"`; `"sideEffects": false`; `"files": ["dist"]`; `prepublishOnly` builds.
- [ ] Check with `publint` and `@arethetypeswrong/cli`.
- [ ] Lint/format: Biome (one tool, zero config).
- [ ] Remove `"private": true` only when ready to publish.

## Step 7: Documentation

- [ ] README: one-line pitch, 10-second example, table of supported relationships (el + en
      columns), how the algorithm works (with a small diagram), legal degree explanation,
      benchmark numbers, "add a language" guide, live demo link, badges (CI, npm, size).
- [ ] TSDoc on every public export; optional TypeDoc site.
- [ ] `CONTRIBUTING.md` focused on adding locales (good first issues).

## Step 8: CI

- [ ] GitHub Actions: test (Node 20 / 22 / 24), typecheck, lint, build, publint, attw.

## Step 9: Live demo

- [ ] Small Vite page in `demo/` with a **fictional** family: pick two people → names both ways
      (el / en toggle), legal degree, other ties, and the diagram drawn as SVG.
- [ ] Deploy to GitHub Pages (or Vercel); link from README and the GitHub repo "website" field.

## Step 10: Publish

- [ ] Create the public GitHub repo `enikakis/kinship` (owner's OK first), add topics.
- [ ] Changesets for versioning + CHANGELOG.
- [ ] npm trusted publishing from GitHub Actions with provenance (verified badge on npm).
- [ ] Publish `0.1.0`; pin the repo on the GitHub profile.

## Step 11: Dogfooding

- [ ] Replace `vrisies-history-hub/src/features/family-tree/kinship.ts` with the package; keep
      the site's behaviour identical (its own tests and e2e `family-tree.spec.ts` must pass).

## Follow-ups from the core API reviews (2026-11-24)

Smaller findings from the reviews of the core API work, each to be taken up in the step named.

- [ ] **Owner to decide (Greek):** the genitive of a distant ancestor or descendant is always
      «του προγόνου … γενιάς» / «του απογόνου …», also for a woman («της προγόνου») and for unknown
      sex (elsewhere both forms); and an 8th cousin of unknown sex reads «έβδομος εξάδελφος/εξαδέλφη»
      (masculine ordinal, both nouns), the same pattern the original code used for 1st–6th.
- [ ] Before fr / de / es (Step 3b): an exhaustive `isNamedKind(kind)` in `classify.ts`, used by
      `hasName` and by the property tests (today both list kinds by hand); a test helper that takes
      the locale, so each new locale doesn't copy the `el` / `en` test helpers; property tests over
      every locale, also checking the roles of the other ties, with more runs.
- [ ] Tests still to add: `side` when the parent's sex is unknown; `elderBranch` with equal birth
      years and with three or more generations up; `el.test.ts` "goes through blood relations
      rather than marriages" still accepts either parent (pin it like the other tie-order tests).
- [ ] With `validateTree` (Step 5): duplicate person ids (the last one wins today), a union of a
      person with themselves, a person recorded as their own parent.
- [ ] README (Step 7): `relate` returns `null` both for unrelated people and for an unknown id
      (point to `validateTree`); explain that the data's `path` excludes the first person while the
      text's `chain` includes them, and decide before 0.1.0 whether to align the names.

## Later (not v1)

- `@enikakis/kinship-react`: the diagram + relation finder UI components from the site.
- The pedigree/descendants layout (`layout.ts` in the site).
- More locales via contributions.
