import { bench, describe } from "vitest";
import { describeRelation } from "../describe";
import { el } from "../locales/el";
import { relate, type Relation } from "../relate";
import { relateAll } from "../relate-all";
import { createTree } from "../tree";
import { largeTree } from "../testing/large-tree";
import type { TestPerson } from "../testing/fixtures";
import { samplePairs } from "../testing/sample-pairs";

const input = largeTree();
const born = (p: TestPerson) => p.born;
const tree = createTree(input, { born });

// A fixed list of 200 pairs: half walk a few steps through the tree from one person (so they are
// related, often distantly), half are random people (mostly far apart or unrelated).
const pairs = samplePairs(input, 200, 12345);
const relations = pairs.map(([a, b]) => relate(tree, a, b)).filter((r): r is Relation<TestPerson> => r !== null);

// relateAll on the 10,000-person tree took about 540 s per call before the speed-ups (it runs one
// full path search per person), so its benchmark uses a 1,000-person tree.
const smallInput = largeTree(1000);
const smallTree = createTree(smallInput, { born });
const sources = [smallInput.people[0].id, smallInput.people[500].id, smallInput.people[999].id];

// Few, fixed iterations: the slow cases would otherwise run for minutes.
const options = { iterations: 5, warmupIterations: 1, time: 0, warmupTime: 0 };

describe("10,000 people", () => {
  bench("createTree", () => {
    createTree(input, { born });
  }, options);
  bench("relate, 200 pairs", () => {
    for (const [a, b] of pairs) relate(tree, a, b);
  }, options);
  bench(`describeRelation (el), ${relations.length} relations`, () => {
    for (const r of relations) describeRelation(tree, r, el);
  }, options);
});

describe("1,000 people", () => {
  bench("relateAll, 3 people", () => {
    for (const id of sources) relateAll(smallTree, id);
  }, { ...options, iterations: 3 });
});
