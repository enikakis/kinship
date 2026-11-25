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

`relateAll` then ran one full path search per person, so on the 10,000-person tree a single call
(`relateAll(tree, "p5000")`, 9,855 relatives) took 540 s in a separate one-off run. That is too long
for a repeatable benchmark, so its case uses a 1,000-person tree (`largeTree(1000)`).

## After

Mean time per run, at each step of the speed-ups (same machine, same day):

| Case | Tree | Baseline | After the heap and spouse index | After the single relateAll search |
| --- | --- | ---: | ---: | ---: |
| `createTree` | 10,000 people | 3.01 ms | 3.08 ms | 3.11 ms |
| `relate`, 200 pairs | 10,000 people | 5,040 ms | 198 ms | 199 ms |
| `describeRelation` (el), 198 relations | 10,000 people | 0.98 ms | 0.47 ms | 0.45 ms |
| `relateAll`, 3 people | 1,000 people | 1,704 ms | 305 ms | 158 ms |
| `relateAll(tree, "p5000")`, one call (one-off run) | 10,000 people | 540 s | 18.5 s | 9.3 s |

The last row is not part of `npm run bench`: it was timed once per version in a separate run.

Each case has few samples (5, or 3 for `relateAll`) and the tables do not record the relative margin
of error (vitest prints it), so differences of a few percent are noise. The lower `describeRelation`
numbers after the speed-ups are run-order noise: its code did not change, and in the baseline run it
came right after the old slow `relate` case.

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

### After the single relateAll search

`relateAll` used to run a whole `relate`, with its own path search, for each person. Now one search
from the person, run to the end instead of stopping at a target, gives everyone after them in
`people` the chain `relate` finds. Everyone before them still gets a search of their own, because
`relate` searches from whichever of the two comes first and could pick another of several equally
short chains. The person's ancestor lines are worked out once. Every result is the same as before
(the equality property with `relate`, a fixture with such a tie, and a 1,000-person check).

| Case | Tree | ops/s | mean |
| --- | --- | ---: | ---: |
| `createTree` | 10,000 people | 321.99 | 3.11 ms |
| `relate`, 200 pairs | 10,000 people | 5.0324 | 199 ms |
| `describeRelation` (el), 198 relations | 10,000 people | 2,215.94 | 0.45 ms |
| `relateAll`, 3 people | 1,000 people | 6.3205 | 158 ms |

The code before this step, run in the same session, gave 305.59 ms for `relateAll` (and 198.63 ms
for `relate`, 3.16 ms for `createTree`, 0.80 ms for `describeRelation`). `relateAll` is about 1.9
times faster. The gain depends on where the person stands in `people`: one call each, before and
after, in a separate run on the 1,000-person tree:

| Person | Where in `people` | Before | After |
| --- | --- | ---: | ---: |
| `p0` | first | 98 ms | 5 ms |
| `p500` | middle | 113 ms | 66 ms |
| `p999` | last | 85 ms | 87 ms |

On the 10,000-person tree one call for `p5000` (9,855 relatives) took 18.5 s before and 9.3 s
after, in the same run; 4,894 of its relatives come before it and still need a search each.

## Final summary

From the baseline to the final code. The final column is a fresh `npm run bench` run (2026-11-25,
same machine), so it differs a little from the "After the single relateAll search" column. Five
samples per case (3 for `relateAll`), so read small differences as noise.

| Case | Tree | Baseline | Final | Speed-up |
| --- | --- | ---: | ---: | ---: |
| `createTree` | 10,000 people | 3.01 ms | 3.11 ms | unchanged (noise) |
| `relate`, 200 pairs | 10,000 people | 5,040 ms | 202 ms | 25x |
| `describeRelation` (el), 198 relations | 10,000 people | 0.98 ms | 0.46 ms | noise, not a real gain |
| `relateAll`, 3 people | 1,000 people | 1,704 ms | 151 ms | 11x |
| `relateAll(tree, "p5000")`, one call (one-off) | 10,000 people | 540 s | 9.3 s (after the single relateAll search) | 58x |

Raw final run: createTree 321.77 ops/s (mean 3.1078 ms); relate 4.9417 ops/s (202.36 ms);
describeRelation 2,194.63 ops/s (0.4557 ms); relateAll 6.6100 ops/s (151.29 ms).
