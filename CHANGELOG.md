# @enikakis99/kinship

## 0.2.0

### Minor Changes

- 6abae90: `createTree` and `validateTree` treat a missing `parents` or `unions` list as empty, so a tree with no marriages needs no `unions: []`. Before, plain JavaScript without one of the lists threw "is not iterable".
  
  Breaking for TypeScript code that reads the lists off a `TreeInput`: both are now optional, so `input.parents` is possibly `undefined` (use `input.parents ?? []`). `fromGedcom` still returns both lists.

## 0.1.0

### Minor Changes

- First release. `createTree`, `relate`, `relateAll`, `describeRelation` and `validateTree`; names in
  Greek and English, with French, German and Spanish experimental; the legal degree of kinship; an
  accessible SVG of the chain (`@enikakis99/kinship/svg`); and GEDCOM input (`@enikakis99/kinship/gedcom`).
