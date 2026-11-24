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
      objects and get them back typed. Name display via an option `getName?: (p: P) => string`
      (default: `p.name ?? p.id`). Remove `given_name` / `surname` / `living` from the core.
- [x] **Input shape** stays close to today:
      `{ people: P[]; parents: [parentId, childId][]; unions: { a: string; b: string }[] }`.
- [x] **Structured result** (sketch, refine while implementing):
      ```ts
      const tree = createTree(input);
      const rel = relate(tree, "maria", "nikos");   // null if unrelated / same person
      rel.main.kind          // "parent" | "sibling" | "halfSibling" | "uncle" | "nephew" | "cousin"
                             // | "ancestor" | "descendant" | "spouse" | "inLaw" | … | "unnamed"
      rel.main.moves         // ["up", "up", "down", "down"]
      rel.main.cousin        // { degree: 1, removed: 0 } (only for cousins)
      rel.main.legalDegree   // { degree: 4, line: "collateral", byMarriage: false } | null
      rel.main.path          // [{ person, move }, …]
      rel.main.diagram       // { nodes, rows, lanes, links, ends }
      rel.others             // other blood ties, each with commonAncestors
      rel.couple             // boolean
      ```
- [x] **Languages as separate, tree-shakeable modules:** `@enikakis/kinship/locales/el` and
      `/locales/en`, each implementing one `KinshipLocale` interface (names, ordinals, phrases).
      `describeRelation(tree, relation, locale)` → `{ main, others, couple }`, each with `{ roles, summary, degree, chain }` (today's `Relationship` strings).
- [x] Keep a compatibility wrapper that reproduces the original `relationReport()` output exactly, so
      the existing tests keep passing during the refactor (delete it once tests are ported).
- [x] Split `kinship.ts` into modules:
      ```
      src/
      ├── index.ts        public API: createTree, relate, describeRelation, validateTree, types
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

## Later (not v1)

- `@enikakis/kinship-react`: the diagram + relation finder UI components from the site.
- The pedigree/descendants layout (`layout.ts` in the site).
- More locales via contributions.
