---
"@enikakis99/kinship": patch
---

`createTree` and `validateTree` treat a missing `parents` or `unions` list as empty, so a tree with no marriages needs no `unions: []`. Before, plain JavaScript without one of the lists threw "is not iterable".
