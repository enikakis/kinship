import type { Chain } from "./chain";
import type { Person } from "./types";

/**
 * A person of the chain in the diagram: `row` is the generation (0 the oldest), `lane` the
 * column, which may be halfway between two (a common ancestor above both lines).
 */
export type DiagramNode<P extends Person> = { person: P; row: number; lane: number };

/**
 * The chain laid out as a tree: its people, how many lanes wide it is, and the lines in chain
 * order. The two people compared are the first and the last of `nodes`.
 */
export type ConnectionDiagram<P extends Person> = {
  nodes: DiagramNode<P>[];
  rows: number;
  lanes: number;
  links: { from: string; to: string; kind: "parent" | "spouse" }[];
};

/**
 * Lays a chain out as a family tree. Going up is the row above and going down the row below, in
 * the same lane, so each line of ancestors stands straight. Where the chain turns from going up
 * to going down, the common ancestor sits halfway between the two lines and the chain moves to a
 * new lane; a marriage or another turn also moves to a new lane, in the same row.
 */
export function chainDiagram<P extends Person>(chain: Chain<P>): ConnectionDiagram<P> {
  const placed: { person: P; level: number; lane: number }[] = [{ person: chain.from, level: 0, lane: 0 }];
  let lane = 0;
  chain.steps.forEach(({ person, move }, i) => {
    const before = placed.at(-1)!;
    const previousMove = chain.steps[i - 1]?.move;
    if (move === "spouse") lane += 1;
    else if (move === "down" && previousMove === "up") {
      before.lane = lane + 0.5;
      lane += 1;
    } else if (move === "up" && previousMove === "down") lane += 1;
    const level = before.level + (move === "up" ? -1 : move === "down" ? 1 : 0);
    placed.push({ person, level, lane });
  });
  const top = Math.min(...placed.map((node) => node.level));
  const nodes = placed.map(({ person, level, lane }) => ({ person, row: level - top, lane }));
  const links = chain.steps.map(({ person, move }, i) => ({
    from: placed[i].person.id,
    to: person.id,
    kind: move === "spouse" ? ("spouse" as const) : ("parent" as const),
  }));
  return {
    nodes,
    rows: Math.max(...nodes.map((node) => node.row)) + 1,
    lanes: Math.ceil(Math.max(...nodes.map((node) => node.lane))) + 1,
    links,
  };
}
