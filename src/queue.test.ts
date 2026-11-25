import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { CheapestFirst } from "./queue";

describe("CheapestFirst", () => {
  it("is empty at first", () => {
    const queue = new CheapestFirst<string>();
    expect(queue.size).toBe(0);
    expect(queue.pop()).toBeUndefined();
  });

  it("gives back the cheapest first and, among equals, the one added first", () => {
    const queue = new CheapestFirst<string>();
    queue.push("b", 20);
    queue.push("a", 10);
    queue.push("c", 20);
    queue.push("d", 10);
    expect([queue.pop(), queue.pop(), queue.pop(), queue.pop()]).toEqual([
      { value: "a", cost: 10 },
      { value: "d", cost: 10 },
      { value: "b", cost: 20 },
      { value: "c", cost: 20 },
    ]);
    expect(queue.size).toBe(0);
  });

  it("pops in the order of a stable sort by cost, with pushes between pops", () => {
    // Each operation is a push with that cost, or a pop (null), as the path search does.
    const arbOps = fc.array(fc.option(fc.integer({ min: 0, max: 40 }), { nil: null }), { maxLength: 200 });
    fc.assert(
      fc.property(arbOps, (ops) => {
        const queue = new CheapestFirst<number>();
        const list: { value: number; cost: number }[] = [];
        ops.forEach((cost, index) => {
          if (cost === null) {
            list.sort((a, b) => a.cost - b.cost);
            expect(queue.pop()).toEqual(list.shift());
          } else {
            queue.push(index, cost);
            list.push({ value: index, cost });
          }
          expect(queue.size).toBe(list.length);
        });
      }),
      { numRuns: 500 },
    );
  });
});
