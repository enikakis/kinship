# Contributing to @enikakis/kinship

Thank you for helping. The most useful contributions are languages and corrections from native
speakers: kinship terms are the one part of this library a program cannot check for itself.

Please read `docs/design.md` before changing the algorithm, above all "Behaviour to keep": the
behaviours there are deliberate.

## Setting up

Node 22.18 or later. There are no runtime dependencies and there should not be any.

```sh
npm install
npm test            # Vitest: every test must pass
npm run typecheck   # tsc, strict, for the library, the tests and the demo
npm run lint        # Biome (npm run format fixes what it can)
npm run build       # tsup, to dist/
npm run check:package   # publint and are-the-types-wrong, after a build
npm run test:dist   # smoke test of the built package, after a build
npm run demo        # the live demo, served locally by Vite
```

Run `npm test`, `npm run typecheck` and `npm run lint` before every commit. CI runs them, and the
build and package checks, on Node 22, 24 and 26, and builds the demo on Node 24.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/): `feat: …`, `fix: …`,
`docs: …`, `test: …`, `refactor: …`, `chore: …`, `ci: …`, with a scope when it helps
(`feat(locales): add Italian`). Keep commits small and focused, and say why in the body when it is
not obvious. A change of behaviour comes with a test that fails first. Tests and examples use
fictional people only.

## Adding a language

A language is one module in `src/locales/` with one exported constant: `el`, `en`, `fr`, `de`, `es`
are the existing ones. The work is mostly research and checking; the code is small. French
(`src/locales/fr.ts`, `docs/locales/fr.md`, `src/locales/fr.test.ts`) is the best one to copy.

### 1. Research the terms and write them down

Before any code, write `docs/locales/<code>.md` (use the ISO 639-1 code: `it`, `pt`, …). Look at
`docs/locales/fr.md`, `de.md` and `es.md`. Each file has the same shape:

- **Rulings**: the project's cross-language decisions as they apply to your language, numbered.
  They are: relatives of a different generation beyond the standard words are named through the
  person of the other's generation («cousin germain du père», "father's first cousin"); cousins by
  degree, never by invented words; an unknown sex gives both forms («oncle/tante»), except for
  genuinely neutral words; named relations by marriage get their own word where the language has
  one, and a composed descriptive name where it does not; the legal degree, if your country's law
  counts it, in the law's own words.
- **Calls made while implementing**: the choices the rulings leave open, each with its reason, so a
  reviewer can overrule one without reading the code.
- **For native reviewers**: the questions you are least sure of, ranked. This is what a reviewer
  reads first.
- Then the **research**: a term table for every case below, each term with a source (dictionary,
  statute, genealogical society), its confidence, and the grammar the names need (articles, cases,
  agreement, contractions, elision). Say which regional variety you describe.

The cases to cover: ancestors and descendants (parent, grandparent, great-grandparent, how far the
words go before "ancestor at the 5th degree"), siblings and half-siblings, uncles and nephews
(great-uncle, great-nephew), cousins (first, second, then by degree; removed cousins), spouse,
parent-in-law, child-in-law, sibling-in-law, co-parent-in-law, the husbands of two sisters
(co-sibling-in-law), step-parent and step-child, uncle and nephew by marriage, and the relatives
of a spouse or spouses of a relative that have no word of their own. The kinds are the values of
`Kind` in `src/classify.ts`.

### 2. Implement the locale

Create `src/locales/<code>.ts` exporting a constant that implements `KinshipLocale`
(`src/locale.ts`):

```ts
export interface KinshipLocale {
  readonly code: string;
  name(query: NameQuery): string | null;
  step(move: Move, sex: Sex): string;
  labelled(label: string, name: string): string;
  degree(degree: LegalDegree): string;
  throughMarriages(couples: readonly (readonly [string, string])[]): string;
  commonAncestors(names: readonly string[]): string;
}
```

`name` is the one that matters. A `NameQuery` says what the last person of a chain is to the
first:

- `kind`: the relationship, in any language (`ancestor`, `uncle`, `cousin`, `spouse`,
  `parentInLaw`, `spouseOfRelative`, `unnamed`, …).
- `moves`: the chain from the viewer, each `"up"`, `"down"` or `"spouse"`.
- `blood`: `{ up, down }`, the generations up to the common ancestor and down from it. For
  `spouseOfRelative` and `relativeOfSpouse` it is the blood relative's chain, without the marriage
  step. Null for the other relations by marriage.
- `sexes`: everyone on the chain, viewer first, named person last. The named person's sex is the
  last; names of in-laws and "of the spouse" parts need the others.

Return null for a chain with no everyday name (`unnamed`). Every blood tie must have a name.

`src/locales/shared.ts` has the helpers:

- `w(male, female, unknown?)` and `neutral(male, female, unknown)` make a word in its forms by
  sex; with no `unknown` form both forms are given, «θείος/θεία».
- `STEP_TERMS` maps a move to the word for a step: `up` is a parent, `down` a child, `spouse` a
  spouse.
- `bloodPart(query)` reads the blood generations of a query that needs them.
- `bloodName(parts, blood, sex, chain, form)` names any blood relative from a `BloodParts`
  description of your language (ancestors, descendants, cousins by rung, uncles, nephews) and does
  the naming through the person of the other's generation for you. `form` is whatever your grammar
  needs to say a word on its own or inside a longer name (the Greek genitive; French «du», «de
  l'»).
- `list(names, and)` joins «A, B and C».

Mark the module experimental: start it with a comment saying the terms come from
`docs/locales/<code>.md` and await a native speaker's review, and add the same sentence to the
doc comment of the exported constant (see `src/locales/fr.ts`).

### 3. Test it with `describing(locale)`

Write `src/locales/<code>.test.ts`. `describing(locale)` from `src/testing/describing.ts` gives
`text`, `roles`, `along` and `ties` helpers, so every language's tests read the same way, over the
fixtures drawn in `src/testing/fixtures.ts`:

```ts
import { describing } from "../testing/describing";
import { fr } from "./fr";

const { roles, along } = describing(fr);

it("names a grandmother and a sister", () => {
  expect(roles("me", "grandma")).toEqual({ other: "grand-mère", self: "petit-fils" });
  expect(roles("me", "sis")).toEqual({ other: "sœur", self: "frère" });
  expect(along("UU", "female").summary).toBe("grand-mère");
});
```

Follow `src/locales/fr.test.ts`: the direct line up and down, siblings, uncles and nephews,
cousins up to the degrees where numbers take over, every relation by marriage, unknown sexes, the
sentences (legal degree, common ancestors, through marriages), and your language's typography
(pin special spaces and apostrophes). The tests are the term table in executable form: a reviewer
should be able to check them against the doc. `src/locales/locales.test.ts` also fails when a
locale module is not in `LOCALES`.

### 4. Register it

- Add it to `LOCALES` in `src/locales/index.ts`, which the shared tests run over.
- Add it to `entry` in `tsup.config.ts` as `"locales/<code>": "src/locales/<code>.ts"`.
- Add `./locales/<code>` to `exports` in `package.json` (copy the `fr` block) and the code to
  `localeNames` in `scripts/smoke-dist.mjs`.
- Add it to the language tables in `README.md`, marked experimental.

Then `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run check:package` and
`npm run test:dist`.

### 5. Experimental until a native speaker has reviewed it

A new language stays experimental, in the README and in its doc comments, until a native speaker
has gone through the term table and the tests and said so. Open a pull request without waiting:
review happens on the pull request, and the language-review issue template is how a reviewer
reports back. When review is done, record who reviewed and what changed in the doc under "For
native reviewers", and drop the experimental label in a separate commit.

## Reviewing a language

You do not need to read code. You need to be a native speaker (or close to it) of the language,
and to open `docs/locales/<code>.md`.

1. Read "Rulings" and "Calls made while implementing": these are what the library does.
2. Go through the term table. For each term, is it what people say, in the standard language, in
   that context? Is the grammar right: articles, cases, agreement, contractions, capitalisation,
   punctuation and spaces?
3. Answer the questions under "For native reviewers", first.
4. To see the library's output, open the tests in `src/locales/<code>.test.ts`: each expectation is
   a sentence the library produces. Or try pairs of people in the demo, when it is live.
5. Report what you find with the **Language review** issue template: the term or sentence as the
   library writes it, what it should be, and a source or your own judgement, saying which.
   "Fine as it is" is useful news too. A pull request that edits the table and the tests together
   is welcome.

A wrong term is a bug, and fixing one is a behaviour change with a test.

## Other changes

- Behaviour changes need a test first. Refactors keep every existing test green.
- Relationship choices (which tie is the main one, which half-siblings count) are documented in
  `docs/design.md`, under "Behaviour to keep". Open an issue before changing them.
- Public exports need a doc comment with a short example when they are a main function.
- No runtime dependencies. Examples, fixtures and docs use fictional people.
