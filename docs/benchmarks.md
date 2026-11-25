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

## After

Mean time per run, at each step of the speed-ups (same machine, same day):

| Case | Tree | Baseline | After the heap and spouse index |
| --- | --- | ---: | ---: |
| `createTree` | 10,000 people | 3.01 ms | 3.08 ms |
| `relate`, 200 pairs | 10,000 people | 5,040 ms | 198 ms |
| `describeRelation` (el), 198 relations | 10,000 people | 0.98 ms | 0.47 ms |
| `relateAll`, 3 people | 1,000 people | 1,704 ms | 305 ms |

### After the heap and spouse index

`createTree` builds each person's spouse list once (it used to filter every union on each lookup),
and the path search pops the cheapest entry from a binary heap keyed on (cost, order added) instead
of sorting its whole queue on every step. Every chain is the same as before, ties included
(`src/path.test.ts` compares it with a verbatim copy of the old search).

| Case | Tree | ops/s | mean |
| --- | --- | ---: | ---: |
| `createTree` | 10,000 people | 324.60 | 3.08 ms |
| `relate`, 200 pairs | 10,000 people | 5.0441 | 198 ms |
| `describeRelation` (el), 198 relations | 10,000 people | 2,112.60 | 0.47 ms |
| `relateAll`, 3 people | 1,000 people | 3.2740 | 305 ms |

`relate` is about 25 times faster and `relateAll` about 5.6 times. `createTree` is unchanged within
noise. `describeRelation` does no path search and its code did not change: its difference is noise.
With only 5 samples right after the slow `relate` case its spread is wide; a re-run of the old code
in the same session gave 1.17 ms with samples from 0.49 to 3.12 ms (that re-run also gave 4,600 ms
for `relate` and 1,569 ms for `relateAll`).
