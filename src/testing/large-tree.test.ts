import { expect, it } from "vitest";
import { largeTree } from "./large-tree";

it("has the asked size, valid links and a birth year for everyone", () => {
  const t = largeTree(2000);
  const ids = new Set(t.people.map((p) => p.id));
  expect(t.people).toHaveLength(2000);
  expect(ids.size).toBe(2000);
  expect(t.people.every((p) => typeof p.born === "number")).toBe(true);
  for (const [p, c] of t.parents) expect(ids.has(p) && ids.has(c) && p !== c).toBe(true);
  for (const { a, b } of t.unions) expect(ids.has(a) && ids.has(b) && a !== b).toBe(true);
  expect(t.unions.length).toBeGreaterThan(500);
});

it("has remarriages: someone is in two unions", () => {
  const count = new Map<string, number>();
  for (const { a, b } of largeTree(2000).unions) for (const id of [a, b]) count.set(id, (count.get(id) ?? 0) + 1);
  expect([...count.values()].some((n) => n >= 2)).toBe(true);
});

it("gives at least a couple for a tiny size", () => {
  expect(largeTree(0).people).toHaveLength(2);
});

it("is the same for the same seed and different for another", () => {
  expect(largeTree(500, 1)).toEqual(largeTree(500, 1));
  expect(largeTree(500, 1)).not.toEqual(largeTree(500, 2));
});

it("has parents born before their children", () => {
  const t = largeTree(1000);
  const born = new Map(t.people.map((p) => [p.id, p.born!]));
  for (const [p, c] of t.parents) expect(born.get(p)!).toBeLessThan(born.get(c)!);
});
