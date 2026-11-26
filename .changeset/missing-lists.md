---
"@enikakis99/kinship": minor
---

`createTree` and `validateTree` treat a missing `parents` or `unions` list as empty, so a tree with no marriages needs no `unions: []`. Before, plain JavaScript without one of the lists threw "is not iterable".

Breaking for TypeScript code that reads the lists off a `TreeInput`: both are now optional, so `input.parents` is possibly `undefined` (use `input.parents ?? []`). `fromGedcom` still returns both lists.
