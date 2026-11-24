# @enikakis/kinship

A TypeScript library that finds how two people in a family tree are related and names the
relationship in Greek or English: «θεία», «πρώτος εξάδελφος του πατέρα», "second cousin once
removed", plus the legal degree (Greek Civil Code arts. 1463–1464), the other blood ties, and data
for a small diagram of the chain.

**Status:** extracted from the owner's site `~/Developer/personal/vrisies-history-hub`
(`src/features/family-tree/`, commit `3433dad`) and made standalone. The code is still in its
original shape. The roadmap to a published npm package is in **`docs/PLAN.md`**: read it first,
work through it in order, and tick the boxes as steps are done.

## Commands

```sh
npm test            # vitest, 27 tests, all must stay green
npm run typecheck   # tsc --noEmit (strict)
```

Node ≥ 20 (dev machine has Node 26). Tooling: TypeScript 5.9, Vitest 3.2. No runtime dependencies.
Keep it that way.

## Layout (current)

- `src/index.ts`: public entry: `createTree`, `relate`, `describeRelation`, and the types.
- `src/types.ts`: `Person`, `Sex`, `Move`, `TreeInput`, `TreeOptions`.
- `src/tree.ts`: `createTree()`: lookups of parents, children, spouses, half-siblings, names.
- `src/chain.ts`: a chain of moves between two people, and helpers on moves (`"UUD"` keys).
- `src/path.ts`: the shortest chain (Dijkstra, 10 a step, 11 a marriage step).
- `src/ties.ts`: the other blood ties, one per closest common ancestor (or couple).
- `src/choose.ts`: which relationship is the main one (`findRelationships`).
- `src/classify.ts`: a chain's kind, generations, cousin degree, side and elder branch.
- `src/degree.ts`: the legal degree as data.
- `src/diagram.ts`: the chain laid out in rows and lanes for a small diagram.
- `src/relate.ts`: `relate()`: how two people are related, as data.
- `src/describe.ts`: `describeRelation()`: a relation in words, in a locale.
- `src/locale.ts`: the `KinshipLocale` interface and its `NameQuery`.
- `src/locales/el.ts`, `src/locales/en.ts`: Greek and English (`shared.ts`: helpers for both).
- `src/testing/fixtures.ts`: the test trees, drawn in ASCII. Read them to understand the cases.
- `src/*.test.ts`, `src/locales/*.test.ts`: behaviour spec: data next to each module, words
  per locale.
- Git history: the first commit holds the four original files (only the example names changed to
  fictional ones), for reference.

## Domain notes (don't "fix" these, they are intentional)

- Moves are `up` (to a parent), `down` (to a child), `spouse`, written as keys like `"UUD"` (aunt).
  Blood relation ⇔ key matches `/^U*D*$/`.
- Path cost: 10 per step, 11 per marriage step, so blood wins among equally short chains.
- Main relationship choice (`findRelationships`): blood usually first, but a *named* relation by
  marriage (spouse, uncle by marriage, in-laws) beats a blood tie more distant than first cousins
  (in a village an aunt's husband is often also a distant cousin; he is her husband first).
- Half-siblings are only claimed when both people have two recorded parents sharing exactly one.
- Greek names need gender **and** the genitive case («του πρώτου εξαδέλφου», «της γιαγιάς»);
  `sex: "unknown"` gives both forms («θείος/θεία»). Generations beyond θείος/ανιψιός are named
  through the person of the other's generation («αδελφός της γιαγιάς»).
- English uses standard genealogical terms (great-great-grandfather, then 3rd great-grandfather;
  first cousin once removed).
- Legal degree: one per generation through the common ancestor; affinity (αγχιστεία) only through
  one marriage at either end; couples and multi-marriage chains have no degree (null).

## Rules

- Behaviour changes need a test first. Refactors must keep all existing tests green.
- Test fixtures and doc comments must use **fictional** people (surname «Παπαδόπουλος»), never the
  owner's family or other real people.
- Don't publish to npm, create GitHub repos, or push without the owner's explicit OK.
- Commits: author is the owner (`enikakis <44342446+enikakis@users.noreply.github.com>`); Claude only as a
  `Co-Authored-By` trailer, never as the author (so commits count on their GitHub profile).
- This is a portfolio piece: clean commit history, small focused commits, clear messages.
