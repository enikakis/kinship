import { describe, expect, it } from "vitest";
import type { ConnectionDiagram } from "./diagram";
import { describeRelation } from "./describe";
import { en } from "./locales/en";
import { relate } from "./relate";
import { toSvg } from "./svg";
import { family, twice, type TestPerson } from "./testing/fixtures";

const count = (text: string, pattern: RegExp) => text.match(pattern)?.length ?? 0;
const idPrefixOf = (svg: string) => svg.match(/<title id="([^"]*)-title"/)![1];
const single = (...ids: string[]): ConnectionDiagram<TestPerson> => ({
  nodes: ids.map((id, lane) => ({ person: { id, sex: "unknown", name: id }, row: 0, lane })),
  rows: 1,
  lanes: ids.length,
  links: ids.slice(1).map((id, i) => ({ from: ids[i]!, to: id, kind: "spouse" as const })),
});
const name = (p: TestPerson) => p.name;

const chain = (from: string, to: string) => {
  const relation = relate(family, from, to)!;
  return { diagram: relation.main.diagram, roles: describeRelation(family, relation, en).main.roles };
};

describe("toSvg", () => {
  const { diagram, roles } = chain("me", "cousinKid");
  const svg = toSvg(diagram, { name, roles });

  it("is an accessible, self-contained svg", () => {
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('role="img"');
    const prefix = idPrefixOf(svg);
    expect(prefix).toMatch(/^kinship-[0-9a-z]+$/);
    expect(svg).toContain(`aria-labelledby="${prefix}-title ${prefix}-desc"`);
    expect(svg).toContain('<svg class="kinship" ');
    expect(count(svg, /<title /g)).toBe(1);
    expect(svg).toContain(`<title id="${prefix}-title">me Παπαδόπουλος — cousinKid Παπαδόπουλος</title>`);
    expect(svg).toContain(`<desc id="${prefix}-desc">`);
  });

  it("describes the chain by its names, with the roles at the two ends", () => {
    const names = diagram.nodes.map((n) => n.person.name);
    const desc = svg.match(/<desc [^>]*>([^<]*)<\/desc>/)![1];
    expect(desc).toBe(
      [`${names[0]} (${roles!.self})`, ...names.slice(1, -1), `${names.at(-1)} (${roles!.other})`].join(" → "),
    );
    expect(toSvg(diagram, { name })).toContain(`${names.join(" → ")}</desc>`);
  });

  it("draws one box per person, one line per link and two ends with their roles", () => {
    expect(count(svg, /class="kinship-node/g)).toBe(diagram.nodes.length);
    expect(count(svg, /class="kinship-link/g)).toBe(diagram.links.length);
    expect(count(svg, /class="kinship-node kinship-end"/g)).toBe(2);
    expect(roles).not.toBeNull();
    expect(svg).toContain(`>${roles!.self}</text>`);
    expect(svg).toContain(`>${roles!.other}</text>`);
  });

  it("tells parent links from spouse links", () => {
    const { diagram: d } = chain("me", "wifeSister");
    const s = toSvg(d, { name });
    expect(count(s, /kinship-link-parent"/g)).toBe(d.links.filter((l) => l.kind === "parent").length);
    expect(count(s, /kinship-link-spouse"/g)).toBe(d.links.filter((l) => l.kind === "spouse").length);
    expect(count(s, /kinship-link-spouse"/g)).toBeGreaterThan(0);
  });

  it("sizes the view box from the lanes and rows (label room: 20 above and 20 below)", () => {
    const w = 2 * 20 + (diagram.lanes - 1) * 180 + 140;
    const h = 2 * 20 + (diagram.rows - 1) * 90 + 40 + 2 * 20;
    expect(svg).toContain(`viewBox="0 0 ${w} ${h}"`);
  });

  it("styles only through custom properties", () => {
    expect(svg).not.toMatch(/(fill|stroke)="#/);
    expect(count(svg, /<style>/g)).toBe(1);
    expect(svg).toContain("var(--kinship-node-fill, Canvas)");
    expect(svg).toContain("var(--kinship-end-stroke, Highlight)");
  });

  it("escapes names, title and description", () => {
    const d: ConnectionDiagram<TestPerson> = {
      nodes: [{ person: { id: "a", sex: "male", name: 'A & <B> "C"' }, row: 0, lane: 0 }],
      rows: 1,
      lanes: 1,
      links: [],
    };
    const s = toSvg(d, { name, title: "<t>", description: "d & e" });
    expect(s).toContain("A &amp; &lt;B&gt; &quot;C&quot;");
    expect(s).not.toContain("<B>");
    expect(s).toContain("&lt;t&gt;");
    expect(s).toContain("d &amp; e");
  });

  it("prefixes every id and the aria reference", () => {
    const s = toSvg(diagram, { name, idPrefix: "x" });
    expect(s).toContain('aria-labelledby="x-title x-desc"');
    expect(s).toContain('id="x-title"');
    expect(s).toContain('id="x-desc"');
    expect(s).not.toContain("kinship-me");
  });

  it("gives different diagrams different ids by default and sanitises a given prefix", () => {
    const other = toSvg(chain("me", "sis").diagram, { name });
    expect(idPrefixOf(other)).not.toBe(idPrefixOf(svg));
    const s = toSvg(diagram, { name, idPrefix: 'a "b' });
    expect(s).toContain('aria-labelledby="a--b-title a--b-desc"');
  });

  it("hashes every id along the chain (FNV-1a, base 36) into the default prefix", () => {
    expect(idPrefixOf(toSvg(single("a"), { name }))).toBe(`kinship-${(0xe40c292c).toString(36)}`);
  });

  it("gives the main and another tie of one pair different ids", () => {
    const relation = relate(twice, "c1", "c2")!;
    expect(relation.others.length).toBeGreaterThan(0);
    const main = toSvg(relation.main.diagram, { name });
    const other = toSvg(relation.others[0]!.diagram, { name });
    expect(idPrefixOf(main)).not.toBe(idPrefixOf(other));
  });

  it("gives chains of Greek ids of equal length different ids", () => {
    const a = toSvg(single("Άρης", "Ρέα"), { name });
    const b = toSvg(single("Όλγα", "Ήρα"), { name });
    expect(idPrefixOf(a)).toMatch(/^kinship-[0-9a-z]+$/);
    expect(idPrefixOf(a)).not.toBe(idPrefixOf(b));
  });

  it("sets the fonts through custom properties", () => {
    expect(svg).toContain("font:var(--kinship-font, 14px sans-serif)");
    expect(svg).toContain("font:var(--kinship-role-font, 12px sans-serif)");
  });

  it("names a person like createTree when no name is given: the name property, else the id", () => {
    const s = toSvg(single("a", "b"), {});
    expect(s).toContain(">a</text>");
    const d: ConnectionDiagram<{ id: string; sex: "male" }> = {
      nodes: [{ person: { id: "x1", sex: "male" }, row: 0, lane: 0 }],
      rows: 1,
      lanes: 1,
      links: [],
    };
    expect(toSvg(d)).toContain(">x1</text>");
  });

  it("refuses a diagram with no people", () => {
    const empty: ConnectionDiagram<TestPerson> = { nodes: [], rows: 0, lanes: 0, links: [] };
    expect(() => toSvg(empty, { name })).toThrow(new RangeError("toSvg: the diagram has no people"));
  });

  it("scopes every style rule to the svg and classes every drawn element", () => {
    const css = svg.match(/<style>([\s\S]*?)<\/style>/)![1];
    expect(css.split("\n").every((rule) => rule.startsWith("svg.kinship "))).toBe(true);
    expect(count(svg, /<(rect|text|path|g) (?!class=)/g)).toBe(0);
  });

  it("draws a spouse link from the right edge of one box to the left edge of the next", () => {
    const { diagram: d } = chain("me", "wifeSister");
    const s = toSvg(d, { name });
    const link = d.links.find((l) => l.kind === "spouse")!;
    const [a, b] = [link.from, link.to].map((id) => d.nodes.find((n) => n.person.id === id)!);
    const [left, right] = a.lane <= b.lane ? [a, b] : [b, a];
    const path = s.match(/kinship-link-spouse" d="([^"]*)"/)![1];
    const xs = [...path.matchAll(/[MH](\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]));
    const edge = 20 + left.lane * 180 + 140;
    const next = 20 + right.lane * 180;
    expect(xs).toEqual([edge, next, edge, next]);
  });

  it.each([
    ["me", "grandpa"],
    ["grandpa", "me"],
    ["me", "inlawDad"],
    ["me", "cousinKid"],
    ["cousinKid", "me"],
  ])("keeps the role labels clear of the links (%s to %s)", (from, to) => {
    const { diagram: d, roles: r } = chain(from, to);
    const s = toSvg(d, { name, roles: r });
    const labels = [...s.matchAll(/class="kinship-role" x="([\d.]+)" y="([\d.]+)"/g)].map((m) => [Number(m[1]), Number(m[2])]);
    expect(labels).toHaveLength(2);
    const paths = [...s.matchAll(/kinship-link-parent" d="M([\d.]+) ([\d.]+)V([\d.]+)H([\d.]+)V([\d.]+)"/g)];
    for (const [x, y] of labels) {
      for (const m of paths) {
        const [x1, y1, , x2, y2] = m.slice(1).map(Number);
        if (x === x1) expect(y < Math.min(y1, y2) || y > Math.max(y1, y2)).toBe(true);
        if (x === x2) expect(y < Math.min(y1, y2) || y > Math.max(y1, y2)).toBe(true);
      }
    }
  });

  it("is deterministic", () => {
    expect(toSvg(diagram, { name, roles })).toBe(svg);
  });
});
