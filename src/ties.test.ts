import { describe, expect, it } from "vitest";
import { relate } from "./relate";
import { family, tangled, twice } from "./testing/fixtures";

/* The other blood ties of a relation, as data. The test trees are drawn in testing/fixtures.ts. */

const ids = (people: { id: string }[]) => people.map((person) => person.id);

describe("related in more than one way", () => {
  it("finds the second way two double cousins are related, through the other grandparents", () => {
    const { main, others } = relate(twice, "c1", "c2")!;
    expect(main.kind).toBe("cousin");
    const throughPaternal = ["pa", "ma"].includes(main.path[1].person.id);
    expect(others.map((tie) => [tie.kind, ids(tie.commonAncestors).sort()])).toEqual([
      ["cousin", throughPaternal ? ["qa", "qb"] : ["ma", "pa"]],
    ]);
    expect([others[0].from.id, ...ids(others[0].path.map((step) => step.person))]).toEqual(
      throughPaternal
        ? ["c1", "s1", expect.stringMatching(/^q/), "s2", "c2"]
        : ["c1", "b1", expect.any(String), "b2", "c2"],
    );
  });

  it("names no common ancestor when one of the two descends from the other", () => {
    // The tie's common ancestor is the other person himself: old is my ancestor.
    const { main, others } = relate(tangled, "me", "old")!;
    expect(main.kind).toBe("uncleByMarriage");
    expect(others.map((tie) => [tie.kind, tie.blood, ids(tie.commonAncestors)])).toEqual([
      ["ancestor", { up: 5, down: 0 }, ["old"]],
    ]);
  });

  it("finds nothing more for people related in one way only", () => {
    expect(relate(twice, "c2", "c3")!.others).toEqual([]);
    expect(relate(family, "me", "cousin")!.others).toEqual([]);
    expect(relate(family, "me", "half")!.others).toEqual([]);
    expect(relate(family, "me", "wifeSister")!.others).toEqual([]);
  });
});
