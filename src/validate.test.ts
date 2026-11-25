import { describe, expect, it } from "vitest";
import { largeTree } from "./testing/large-tree";
import type { Person, Sex, TreeInput } from "./types";
import { validateTree } from "./validate";

const p = (id: string, sex: Sex = "unknown"): Person => ({ id, sex });
const input = (
  ids: string[],
  parents: [string, string][] = [],
  unions: { a: string; b: string }[] = [],
): TreeInput<Person> => ({ people: ids.map((id) => p(id)), parents, unions });

describe("validateTree", () => {
  it("accepts a valid tree", () => {
    const tree = input(["mum", "dad", "kid"], [["mum", "kid"], ["dad", "kid"]], [{ a: "mum", b: "dad" }]);
    expect(validateTree(tree)).toEqual({ ok: true, issues: [] });
  });

  it("accepts an empty tree", () => {
    expect(validateTree(input([]))).toEqual({ ok: true, issues: [] });
  });

  it("reports a repeated person id once per repeat", () => {
    const result = validateTree(input(["a", "b", "a"]));
    expect(result.ok).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({ code: "duplicateId", ids: ["a"] });
    expect(result.issues[0]!.message).toContain("a");
  });

  it("reports links to unknown ids, naming the unknown ones", () => {
    const result = validateTree(input(["a", "b"], [["a", "ghost"], ["x", "y"]], [{ a: "b", b: "nobody" }]));
    expect(result.issues.map((i) => [i.code, i.ids])).toEqual([
      ["unknownId", ["ghost"]],
      ["unknownId", ["x", "y"]],
      ["unknownId", ["nobody"]],
    ]);
    expect(result.issues[0]!.message).toContain("ghost");
  });

  it("names an unknown id once when both ends of a link are the same", () => {
    const result = validateTree(input(["a"], [["ghost", "ghost"]], [{ a: "ghost", b: "ghost" }]));
    expect(result.issues.map((i) => [i.code, i.ids])).toEqual([
      ["unknownId", ["ghost"]],
      ["unknownId", ["ghost"]],
    ]);
    expect(result.issues[0]!.message).toBe('A parent link names unknown id "ghost".');
    expect(result.issues[1]!.message).toBe('A union names unknown id "ghost".');
  });

  it("reports a person as their own parent and in a union with themselves", () => {
    const result = validateTree(input(["a", "b"], [["a", "a"]], [{ a: "b", b: "b" }]));
    expect(result.issues.map((i) => [i.code, i.ids])).toEqual([
      ["selfParent", ["a"]],
      ["selfUnion", ["b"]],
    ]);
    expect(result.issues[0]!.message).toContain("a");
    expect(result.issues[1]!.message).toContain("b");
  });

  it("reports more than two parents, child first", () => {
    const result = validateTree(input(["p1", "p2", "p3", "kid"], [["p1", "kid"], ["p2", "kid"], ["p3", "kid"]]));
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({ code: "tooManyParents", ids: ["kid", "p1", "p2", "p3"] });
    expect(result.issues[0]!.message).toContain("kid");
  });

  it("does not count a repeated link as another parent", () => {
    const tree = input(["p1", "p2", "kid"], [["p1", "kid"], ["p2", "kid"], ["p1", "kid"]]);
    expect(validateTree(tree)).toEqual({ ok: true, issues: [] });
  });

  it("reports a cycle of three once, people in order", () => {
    const result = validateTree(input(["a", "b", "c"], [["a", "b"], ["b", "c"], ["c", "a"]]));
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({ code: "cycle", ids: ["a", "b", "c"] });
    for (const id of ["a", "b", "c"]) expect(result.issues[0]!.message).toContain(`"${id}"`);
  });

  it("reports a cycle of two", () => {
    const result = validateTree(input(["a", "b"], [["a", "b"], ["b", "a"]]));
    expect(result.issues.map((i) => [i.code, i.ids])).toEqual([["cycle", ["a", "b"]]]);
  });

  it("reports a cycle reached through a tail, without the tail", () => {
    const result = validateTree(input(["x", "a", "b"], [["x", "a"], ["a", "b"], ["b", "a"]]));
    expect(result.issues.map((i) => [i.code, i.ids])).toEqual([["cycle", ["a", "b"]]]);
  });

  it("reports overlapping cycles in one component as one issue per cycle found", () => {
    const links: [string, string][] = [["a", "b"], ["b", "a"], ["b", "c"], ["c", "b"]];
    const result = validateTree(input(["a", "b", "c"], links));
    expect(result.issues.map((i) => [i.code, i.ids])).toEqual([
      ["cycle", ["a", "b"]],
      ["cycle", ["b", "c"]],
    ]);
  });

  it("lists several issues in input order", () => {
    const result = validateTree(
      input(["a", "b", "a"], [["b", "zzz"], ["b", "b"]], [{ a: "a", b: "a" }, { a: "q", b: "b" }]),
    );
    expect(result.issues.map((i) => i.code)).toEqual(["duplicateId", "unknownId", "selfParent", "selfUnion", "unknownId"]);
  });

  it("never throws on garbage", () => {
    const garbage = [
      input([]),
      input([], [["", ""]], [{ a: "", b: "" }]),
      input(["", ""], [["", ""], ["", "x"]], [{ a: "", b: "" }]),
      input(["a"], [["ghost", "ghost"], ["a", "a"], ["a", "nobody"]], [{ a: "ghost", b: "ghost" }, { a: "a", b: "a" }]),
    ];
    for (const tree of garbage) expect(() => validateTree(tree)).not.toThrow();
    expect(validateTree(input([], [["", ""]], [{ a: "", b: "" }])).ok).toBe(false);
  });

  it("validates a large generated tree", () => {
    expect(validateTree(largeTree(10_000))).toEqual({ ok: true, issues: [] });
  });

  it("handles a very long line of descent without overflowing the stack", () => {
    const ids = Array.from({ length: 50_000 }, (_, i) => `n${i}`);
    const links = ids.slice(1).map((id, i): [string, string] => [ids[i]!, id]);
    expect(validateTree(input(ids, links)).ok).toBe(true);
    const looped = validateTree(input(ids, [...links, [ids[ids.length - 1]!, ids[0]!]]));
    expect(looped.issues.map((i) => i.code)).toEqual(["cycle"]);
  });
});
