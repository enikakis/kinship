# Benchmarks

Run with `npm run bench` (`vitest bench --run`, files in `src/bench/`). They are not part of `npm test`.
The tree comes from `largeTree()` in `src/testing/large-tree.ts`: seeded (mulberry32), so every run
builds the same people, parents and unions. The 200 pairs are fixed too (`samplePairs` in
`src/testing/sample-pairs.ts`, seed 12345): half are reached by walking 4 to 11 steps through the
tree from one person (so they are related, often distantly), half are random people. 198 of the 200
pairs are related.

Machine: Apple M5, 24 GB, macOS 27.0.1. Node v26.8.2, Vitest 3.2.7. Measured on 2026-11-25.
The slow cases run 5 iterations (relateAll: 3) after 1 warm-up, because a time-based run would take minutes.

## Baseline (before any speed-up)

| Case | Tree | ops/s | mean |
| --- | --- | ---: | ---: |
| `createTree` | 10,000 people | 331.86 | 3.01 ms |
| `relate`, 200 pairs | 10,000 people | 0.1984 | 5,040 ms |
| `describeRelation` (el), 198 relations | 10,000 people | 1,024.66 | 0.98 ms |
| `relateAll`, 3 people | 1,000 people | 0.5869 | 1,704 ms |

`relateAll` runs one full path search per person, so on the 10,000-person tree a single call
(`relateAll(tree, "p5000")`, 9,855 relatives) took 540 s in a separate one-off run. That is too long
for a repeatable benchmark, so its case uses a 1,000-person tree (`largeTree(1000)`).
