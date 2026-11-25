# @enikakis/kinship

A TypeScript library that finds how two people in a family tree are related and names the
relationship in Greek or English (French, German and Spanish experimental): «θεία», «πρώτος
εξάδελφος του πατέρα», "second cousin once removed", plus the legal degree (Greek Civil Code arts.
1463–1464), the other blood ties, and data for a small diagram of the chain.

**Status:** extracted from the author's village history site, `vrisies-history-hub`
(`src/features/family-tree/`, commit `3433dad`), and made standalone. The core API is in place
(`createTree` / `relate` / `describeRelation`; el + en locales, and fr, de, es experimental until
native speakers review them). The roadmap to a published npm package continues in
**`docs/PLAN.md`**: read it first, work through it in order, and tick the boxes as steps are done.

## Commands

```sh
npm test            # vitest, the whole suite must stay green
npm run typecheck   # tsc (strict): the library without Node types, tests via tsconfig.test.json, the demo via demo/tsconfig.json
npm run lint        # biome check . (lint + format check; `npm run format` fixes formatting and import order)
npm run build       # tsup: ESM + CJS + .d.ts in dist/
npm run check:package  # publint + attw on the packed tarball (run after build)
npm run test:dist   # smoke test of dist/ through the package's own name (run after build)
npm run bench       # vitest bench --run on a generated 10,000-person tree (results in docs/benchmarks.md)
npm run demo        # Vite dev server for the live demo in demo/ (http://localhost:5173/kinship/)
npm run demo:build  # the demo as a static site in demo/dist (base /kinship/, for GitHub Pages)
```

Runtime: Node ≥ 22.18 (`engines`). Develop on Node 22.18+, 24 or 26, the versions CI runs (dev machine has
Node 26). Tooling: TypeScript 5.9, Vitest 3.2, tsup 9, Biome 2.6 (pinned), publint, attw, Vite 7 (demo
only). No runtime dependencies. Keep it that way.

## Layout (current)

- `tsup.config.ts`: the build (entries, formats); `biome.jsonc`: lint and format rules.
- `scripts/smoke-dist.mjs`: imports and requires the built package by name (`npm run test:dist`).
- `.github/workflows/ci.yml`: CI on Node 22/24/26: lint, typecheck, test, build, check:package, test:dist.
- `.github/workflows/pages.yml`: builds the demo and deploys it to GitHub Pages on push to main.
- `src/index.ts`: public entry: `createTree`, `relate`, `relateAll`, `describeRelation`, `validateTree`, and
  the types.
- `src/types.ts`: `Person`, `Sex`, `Move`, `TreeInput`, `TreeOptions`.
- `src/tree.ts`: `createTree()`: lookups of parents, children, spouses, half-siblings, names.
- `src/chain.ts`: a chain of moves between two people, and helpers on moves (`"UUD"` keys).
- `src/path.ts`: the shortest chain (Dijkstra, 10 a step, 11 a marriage step); `searchFrom`/`chainTo` for one search to everyone.
- `src/queue.ts`: `CheapestFirst`, the binary heap the search uses (pops by cost, then insertion order).
- `src/ties.ts`: the other blood ties, one per closest common ancestor (or couple).
- `src/choose.ts`: which relationship is the main one (`findRelationships`, `chooseRelationships`).
- `src/validate.ts`: `validateTree()`: reports broken links, cycles and duplicates in raw input.
- `src/classify.ts`: a chain's kind, generations, cousin degree, side and elder branch.
- `src/degree.ts`: the legal degree as data.
- `src/diagram.ts`: the chain laid out in rows and lanes for a small diagram.
- `src/relate.ts`: `relate()`: how two people are related, as data.
- `src/relate-all.ts`: `relateAll()`: what everyone connected is to one person (one search from the person, plus a search per earlier person).
- `src/svg.ts`: `toSvg()`: a relationship diagram as an accessible SVG string (own module, no DOM).
- `src/gedcom.ts`: `fromGedcom()`: people and families of a GEDCOM file as `createTree` input (own module).
- `src/describe.ts`: `describeRelation()`: a relation in words, in a locale.
- `src/locale.ts`: the `KinshipLocale` interface and its `NameQuery`.
- `src/locales/el.ts`, `src/locales/en.ts`: Greek and English (`shared.ts`: helpers for all locales).
- `src/locales/fr.ts`, `de.ts`, `es.ts`: French, German, Spanish (experimental, awaiting native
  review). Their term tables, rulings and open questions are in `docs/locales/{fr,de,es}.md`.
- `src/testing/fixtures.ts`: the test trees, drawn in ASCII. Read them to understand the cases.
- `src/testing/sample-gedcom.ts`: an invented GEDCOM file for the reader's tests.
- `src/testing/large-tree.ts`: `largeTree(size, seed)`: a seeded, fictional tree for benchmarks and sanity tests.
- `src/testing/reference-path.ts`: the old path search, kept verbatim as the reference for differential tests.
- `src/testing/sample-pairs.ts`: `samplePairs(input, count, seed)`: a fixed list of pairs for the benchmark and path tests.
- `src/testing/describing.ts`: `describing(locale)` helpers shared by the locale tests.
- `src/bench/relate.bench.ts`: the benchmarks (`npm run bench`); not part of `npm test`.
- `demo/`: the live demo, a Vite page with no framework. `index.html`, `style.css` (light and dark,
  works from 360px), `main.ts` (the DOM: pickers, language switch, result, everyone list, GEDCOM
  file input), `logic.ts` (pure: URL hash, picker labels, grouping of `relateAll`; tested in
  `logic.test.ts`), `family.ged` (the invented Karydas family, 38 people). `vite.config.ts` aliases
  `@enikakis/kinship/*` to `src/`; `demo/tsconfig.json` holds the DOM types, apart from the library.
- `src/*.test.ts`, `src/locales/*.test.ts`: behaviour spec: data next to each module, words
  per locale.
- Git history: the first commit holds the four original files (only the example names changed to
  fictional ones), for reference.

## Domain notes (don't "fix" these, they are intentional)

- Moves are `up` (to a parent), `down` (to a child), `spouse`, written as keys like `"UUD"` (aunt).
  Blood relation ⇔ key matches `/^U*D*$/`.
- Path cost: 10 per step, 11 per marriage step, so blood wins among equally short chains.
- Main relationship choice (`findRelationships`): blood usually first, but a couple always comes
  first as a couple, and another *named* relation by marriage (uncle by marriage, in-laws) beats a
  blood tie more distant than first cousins (in a village an aunt's husband is often also a distant
  cousin; he is her husband first).
- Half-siblings are only claimed when both people have two recorded parents sharing exactly one.
- Greek names need gender **and** the genitive case («του πρώτου εξαδέλφου», «της γιαγιάς»);
  `sex: "unknown"` gives both forms («θείος/θεία»). Generations beyond θείος/ανιψιός are named
  through the person of the other's generation («αδελφός της γιαγιάς»).
- English uses standard genealogical terms (great-great-grandfather, then 3rd great-grandfather;
  first cousin once removed).
- Legal degree: one per generation through the common ancestor; affinity (αγχιστεία) only through
  one marriage at either end; couples, chains whose one marriage is in the middle, and chains with
  more than one marriage have no degree (null).

## Rules

- Behaviour changes need a test first. Refactors must keep all existing tests green.
- Test fixtures and doc comments must use **fictional** people (surname «Παπαδόπουλος»), never the
  owner's family or other real people.
- Don't publish to npm, create GitHub repos, or push without the owner's explicit OK.
- Commits: author is the owner (`enikakis`, with the GitHub noreply email set in this repo's git
  config); Claude only as a `Co-Authored-By` trailer, never as the author (so commits count on
  their GitHub profile).
- This is a portfolio piece: clean commit history, small focused commits, clear messages.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):
  `type(scope): subject` in the imperative, lower case, e.g. `feat(locales): add French names`,
  `fix(relate): …`, `test: …`, `docs(plan): …`. Types: feat, fix, refactor, test, docs, build,
  ci, chore. Scopes are module names (tree, path, ties, choose, classify, degree, diagram, relate,
  describe, locales, gedcom, svg) or doc names (plan, design).
