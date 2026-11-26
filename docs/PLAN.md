# Plan: from extracted code to a published npm package

Design: [docs/design.md](design.md)

Goal: publish `@enikakis99/kinship` as a polished, zero-dependency TypeScript library that works
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
- [x] **Languages as separate, tree-shakeable modules:** `@enikakis99/kinship/locales/el` and
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

- [x] Make `relate` independent of direction (same main relationship, inverse roles, equal degree
      from either end); turn the `it.fails` test in relate.test.ts into a passing test
- [x] fr / de / es locales (experimental; term tables and open questions in `docs/locales/`)
- [x] `relateAll` (one `relate` per connected person; the single-search speed-up is in Step 4)
  - Reconcile with the direction rule: `relate(a, b)` searches from whichever of the two comes
    first in `people`, so a single search from `fromId` can pick a different chain than `relate`
    when chains tie. Plan 4 must either use a tie-break that doesn't depend on direction, or search
    from the earlier person for those pairs, and keep the equality-with-`relate` property.
    (Resolved in Step 4: people before `fromId` keep their own search.)
- [x] `svg` entry (`toSvg`)
- [x] `gedcom` entry (`fromGedcom`)

## Step 4: Performance

- [x] Add a benchmark (`vitest bench`) on a generated ~10,000-person tree; record the baseline.
- [x] `spouses()` scans every union per call, inside the path search → index unions in a `Map`.
- [x] Dijkstra re-sorts the whole queue each iteration → small binary heap (or a bucket queue:
      costs are only 10 / 11).
- [x] `relateAll` with one search from `fromId`, keeping the equality property with `relate` for every
      pair (see the direction rule in Step 3b); benchmark it against the per-person version.
- [x] Re-measured: `docs/benchmarks.md` has the before/after numbers. (Putting them in the README stays for Step 7.)

## Step 5: `validateTree()`

- [x] Report problems instead of misbehaving: cycles (own ancestor), more than two parents,
      parent / union links to unknown ids, self-marriage, duplicate ids.
- [x] Returns `{ ok: boolean; issues: { code, message, ids }[] }`; tested.

## Step 6: Build & package

- [x] Build with `tsup` (or `tsdown`): ESM + CJS + `.d.ts`; `exports` map with `"."`,
      `"./locales/*"`, `"./svg"` and `"./gedcom"`; `"sideEffects": false`; `"files": ["dist"]`;
      `prepublishOnly` builds.
- [x] Check with `publint` and `@arethetypeswrong/cli`.
- [x] Lint/format: Biome (one tool, zero config).
- [x] Remove `"private": true` only when ready to publish.

## Step 7: Documentation

- [x] README: one-line pitch, 10-second example, table of supported relationships (a column per
      language: el, en, and fr, de, es marked experimental), how the algorithm works (with a small
      diagram), legal degree explanation, `relateAll`, `toSvg` (`/svg`) and `fromGedcom`
      (`/gedcom`), benchmark numbers, "add a language" guide, live demo link, badges (CI, npm,
      size). Note that names are in-sentence forms; capitalise the first letter for display.
- [x] TSDoc on every public export.
- [x] English first in the README, with glosses for the Greek; a screenshot of the demo on top;
      every output the README shows checked by `src/readme.test.ts`.
- [ ] Optional: a TypeDoc site.
- [x] `CONTRIBUTING.md` focused on adding locales (good first issues).

## Step 8: CI

- [x] GitHub Actions: test (Node 22 / 24 / 26), typecheck, lint, build, publint, attw.

## Step 9: Live demo

- [x] Small Vite page in `demo/` with a **fictional** family: pick two people → names both ways
      (el / en toggle), legal degree, other ties, and the diagram drawn as SVG. Done with all five
      languages, "everyone, as seen from" one person (`relateAll`), a shareable URL hash, and the
      visitor's own GEDCOM file read in the browser with `validateTree` issues shown.
- [x] Deploy to GitHub Pages (or Vercel); link from README and the GitHub repo "website" field.
      Live at https://enikakis.github.io/kinship/, deployed by `.github/workflows/pages.yml` on
      every push to main.

## Step 10: Publish

- [x] Create the public GitHub repo `enikakis/kinship` (owner's OK first), add topics.
- [x] Changesets for versioning + CHANGELOG.
- [x] npm trusted publishing from GitHub Actions with provenance (verified badge on npm): 0.2.0
      was published by `.github/workflows/release.yml` with an SLSA provenance attestation.
- [x] Publish `0.1.0` (as `@enikakis99/kinship`: the `@enikakis` scope on npm belongs to another
      account). Published from the owner's machine, so without provenance.
- [ ] Pin the repo on the GitHub profile.
- [x] Create the `language` label (the issue templates use it); set Pages to GitHub Actions; fill
      the repo's website field with the demo's URL; add the npm and bundlephobia badges to the
      README once published.

## Step 11: Dogfooding

- [ ] Replace `vrisies-history-hub/src/features/family-tree/kinship.ts` with the package; keep
      the site's behaviour identical (its own tests and e2e `family-tree.spec.ts` must pass).

## Step 12: GEDCOM details for the family tree (0.3.0)

For `@enikakis99/family-tree` (design in that repo, `docs/design.md`), whose demo reads a GEDCOM file.

- [x] `fromGedcom` keeps `given` and `surname` (slashes, or `GIVN` / `SURN`), `died`, `birthPlace`,
      `deathPlace`, and on unions `married` and `place`; new types `GedcomUnion`, `GedcomInput`.
- [x] Released as 0.3.0 from CI (2026-11-26), with provenance; the workflow created the `v0.3.0`
      tag and the GitHub Release itself.

## Follow-ups from the core API reviews (2026-11-24)

Smaller findings from the reviews of the core API work, each to be taken up in the step named.

- [x] **Owner to decide (Greek):** the genitive of a distant ancestor or descendant is always
      «του προγόνου … γενιάς» / «του απογόνου …», also for a woman («της προγόνου») and for unknown
      sex (elsewhere both forms); and an 8th cousin of unknown sex reads «έβδομος εξάδελφος/εξαδέλφη»
      (masculine ordinal, both nouns), the same pattern the original code used for 1st–6th.
      Decided: both full forms for unknown sex; «της προγόνου» / «της απογόνου» for women.
- [x] Before fr / de / es (Step 3b): an exhaustive `isNamedKind(kind)` in `classify.ts`, used by
      `hasName` and by the property tests (today both list kinds by hand); a test helper that takes
      the locale, so each new locale doesn't copy the `el` / `en` test helpers; property tests over
      every locale, also checking the roles of the other ties, with more runs.
- [x] Tests still to add: `side` when the parent's sex is unknown; `elderBranch` with equal birth
      years and with three or more generations up; `el.test.ts` "goes through blood relations
      rather than marriages" still accepts either parent (pin it like the other tie-order tests).
- [x] With `validateTree` (Step 5): duplicate person ids (the last one wins today), a union of a
      person with themselves, a person recorded as their own parent.
- [x] README (Step 7): `relate` returns `null` both for unrelated people and for an unknown id
      (point to `validateTree`); explain that the data's `path` excludes the first person while the
      text's `chain` includes them.
- [ ] Before 0.1.0: decide whether to align the names `path` and `chain`.
- [ ] `ancestorPaths` keeps a full line per ancestor (O(depth²) memory): a crafted
      200,000-generation chain exhausts memory. Store parent pointers instead.
- [x] `createTree` in plain JavaScript: a missing `parents` or `unions` throws "is not iterable".
      Both lists are now optional and default to empty (0.2.0); found by installing 0.1.0.

- [x] The release workflow published 0.2.0 but did not push the `v0.2.0` tag or create the GitHub
      Release (made by hand): `changesets/action@v1` does not support `@changesets/cli` v3. Moved
      to `changesets/action` v2.1.2 (which does), split into select-mode, version and publish jobs
      so that only the publish job can publish. Confirmed by 0.3.0, whose tag and release the
      workflow created.

## Later (not v1)

- The family tree view from the site: its own package and repo, `@enikakis99/family-tree` (planned 2026-11-26).
- More locales via contributions.
- GEDCOM: baptism (`BAPM`/`CHR`) and burial (`BURI`) as fallbacks for the years, a deceased
  mark for `DEAT Y`, and nicknames (`NICK`).
- A tie rule that doesn't depend on direction, so relateAll needs one search for everyone (today people before fromId get their own search).
