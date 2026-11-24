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

- `src/kinship.ts`: everything: path search (Dijkstra), other blood ties, choosing the main
  relationship, Greek and English names, legal degree, diagram layout. Public: `relationReport()`.
- `src/tree.ts`: `Tree` / `TreePerson` types, `indexTree()` lookups, `fullName()`. Trimmed from
  the site's `model.ts` + `person-display.ts` (no zod, no site fields).
- `src/locale.ts`: `type Locale = "el" | "en"`.
- `src/index.ts`: public entry (temporary re-exports until the new API in PLAN step 2).
- `src/kinship.test.ts`: behaviour spec. Read its ASCII family diagrams to understand the cases.
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
