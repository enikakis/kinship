import { describe, expect, it } from "vitest";
import { describeRelation } from "./describe";
import { el } from "./locales/el";
import { relate } from "./relate";
import { family, line } from "./testing/fixtures";

/* The family tree is drawn in testing/fixtures.ts. */

describe("the chain as a small tree", () => {
  const diagram = (from: string, to: string) => relate(family, from, to)!.main.diagram;

  /** Each person of the chain with their row and lane, in chain order. */
  const layout = (from: string, to: string) =>
    diagram(from, to).nodes.map((node) => [
      node.person.id.replace(/^grand(pa|ma)$/, "grandparent").replace(/^inlaw(Dad|Mom)$/, "inlawParent"),
      node.row,
      node.lane,
    ]);

  it("stands each line of ancestors straight, with the common ancestor above both", () => {
    expect(layout("me", "cousinKid")).toEqual([
      ["me", 2, 0],
      ["dad", 1, 0],
      ["grandparent", 0, 0.5],
      ["aunt", 1, 1],
      ["cousin", 2, 1],
      ["cousinKid", 3, 1],
    ]);
  });

  it("keeps spouses side by side in one row", () => {
    const { rows, lanes, links } = diagram("me", "wifeSisterHusband");
    expect(layout("me", "wifeSisterHusband")).toEqual([
      ["me", 1, 0],
      ["wife", 1, 1],
      ["inlawParent", 0, 1.5],
      ["wifeSister", 1, 2],
      ["wifeSisterHusband", 1, 3],
    ]);
    expect([rows, lanes]).toEqual([2, 4]);
    expect(links.map((link) => link.kind)).toEqual(["spouse", "parent", "parent", "spouse"]);
  });

  it("puts a straight line of descent in one lane", () => {
    expect(layout("grandpa", "me")).toEqual([
      ["grandparent", 0, 0],
      ["dad", 1, 0],
      ["me", 2, 0],
    ]);
  });

  it("marks the two people with what each is to the other", () => {
    // The two people are the first and the last node; what each is to the other is in the words.
    const relation = relate(family, "me", "aunt")!;
    const { nodes } = relation.main.diagram;
    expect([nodes[0].person.id, nodes.at(-1)!.person.id]).toEqual(["me", "aunt"]);
    expect(describeRelation(family, relation, el).main.roles).toEqual({ other: "θεία", self: "ανιψιός" });

    const { tree, from, to } = line("UDSUD", ["male", "unknown", "female", "male", "unknown", "male"]);
    const apart = relate(tree, from, to)!;
    const ends = apart.main.diagram.nodes;
    expect([ends[0].person.id, ends.at(-1)!.person.id]).toEqual(["p0", "p5"]);
    expect(describeRelation(tree, apart, el).main.roles).toBeNull();
  });
});
