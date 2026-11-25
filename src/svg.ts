import type { ConnectionDiagram } from "./diagram";
import type { Person } from "./types";

/** How `toSvg` writes the names, and optionally the text around the chain. */
export type SvgOptions<P extends Person> = {
  /**
   * The text of a person's box; defaults like `createTree`: a string `name` property, else the id.
   * Pass `name: tree.name` when the tree was made with a custom `name`. Long names are not
   * shortened: that is the caller's concern.
   */
  name?: (person: P) => string;
  /** The role of each end, as `describeRelation(...).main.roles` gives it: `self` is the first node. */
  roles?: { self: string; other: string } | null;
  /** The accessible title; defaults to "first — last". */
  title?: string;
  /**
   * The accessible description; defaults to the names along the chain joined by " → ", with the
   * roles (when given) in parentheses at the two ends: "A (nephew) → … → B (aunt)".
   */
  description?: string;
  /**
   * Prefix of the element ids, so several diagrams can share a page. Characters outside
   * `[A-Za-z0-9_-]` become "-". Defaults to `kinship-<hash>`, the hash (FNV-1a, 32-bit, base 36)
   * of every person's id along the chain, so it is the same on the server and in the browser.
   */
  idPrefix?: string;
};

const MARGIN = 20;
const NODE_W = 140;
const NODE_H = 40;
const LANE_PITCH = 180;
const ROW_PITCH = 90;
/** Room above the first row and under the last for the role labels (drawn 6 above or 15 below a box). */
const LABEL_ROOM = 20;

const STYLE = [
  "svg.kinship .kinship-box{fill:var(--kinship-node-fill, Canvas);stroke:var(--kinship-node-stroke, CanvasText);stroke-width:1}",
  "svg.kinship .kinship-end .kinship-box{stroke:var(--kinship-end-stroke, Highlight);stroke-width:2.5}",
  "svg.kinship .kinship-name,svg.kinship .kinship-role{fill:var(--kinship-text, CanvasText);text-anchor:middle}",
  "svg.kinship .kinship-name{font:var(--kinship-font, 14px sans-serif)}",
  "svg.kinship .kinship-role{font:var(--kinship-role-font, 12px sans-serif)}",
  "svg.kinship .kinship-link{fill:none;stroke:var(--kinship-link, GrayText);stroke-width:1.5}",
].join("\n");

const escapeXml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);

/** A person's name as `createTree` reads it by default: a string `name` property, else the id. */
const defaultName = (person: Person) => {
  const name = (person as { name?: unknown }).name;
  return typeof name === "string" ? name : person.id;
};

/** FNV-1a (32-bit) over the UTF-16 code units of `text`, in base 36. */
function hash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(36);
}

/** Where a node's box sits: its top-left corner, and its centre. */
function geometry(node: { row: number; lane: number }) {
  const x = MARGIN + node.lane * LANE_PITCH;
  const y = MARGIN + LABEL_ROOM + node.row * ROW_PITCH;
  return { x, y, cx: x + NODE_W / 2, cy: y + NODE_H / 2 };
}

/**
 * Draws the chain as a small accessible SVG string: a box per person, parent lines as elbows,
 * marriages as double lines, the two ends highlighted with their roles. Colours and fonts come from
 * CSS custom properties (`--kinship-node-fill`, `--kinship-node-stroke`, `--kinship-text`,
 * `--kinship-link`, `--kinship-end-stroke`, `--kinship-font`, `--kinship-role-font`) with
 * system-colour fallbacks. Builds a string only: no DOM. Text is not measured: long names and role
 * labels may overflow their box, so keep them short or restyle with CSS.
 *
 * `toSvg` knows no language. For locale text, pass `title: text.main.summary` and a `description`
 * built from `text.main.chain`, where `text = describeRelation(tree, relation, locale)`.
 *
 * @param diagram The `diagram` of a relationship, e.g. `relation.main.diagram`.
 * @param options Names, roles and accessibility text; see `SvgOptions`.
 * @returns An `<svg>` element as a string.
 * @throws RangeError when the diagram has no people.
 *
 * @example
 * ```ts
 * import { toSvg } from "@enikakis/kinship/svg";
 *
 * // `tree` and `relation` as in `relate`.
 * const roles = describeRelation(tree, relation, en).main.roles;
 * const svg = toSvg(relation.main.diagram, { roles });
 * // <svg class="kinship" … role="img" …>
 * // <title …>Anna — Kostas</title>
 * // <desc …>Anna (first cousin) → Dafni → Maria → Petros → Kostas (first cousin)</desc> …
 * ```
 */
export function toSvg<P extends Person>(diagram: ConnectionDiagram<P>, options: SvgOptions<P> = {}): string {
  if (diagram.nodes.length === 0) throw new RangeError("toSvg: the diagram has no people");
  const ids = diagram.nodes.map((node) => node.person.id);
  const prefix = (options.idPrefix ?? `kinship-${hash(ids.join("\u0000"))}`).replace(/[^A-Za-z0-9_-]/g, "-");
  const name = options.name ?? defaultName;
  const names = diagram.nodes.map((node) => name(node.person));
  const title = options.title ?? `${names[0]} — ${names.at(-1)}`;
  const { roles } = options;
  const last = diagram.nodes.length - 1;
  const roleOf = (i: number) => (i === 0 ? roles?.self : i === last ? roles?.other : null);
  const description =
    options.description ?? names.map((text, i) => (roleOf(i) ? `${text} (${roleOf(i)})` : text)).join(" → ");
  const width = 2 * MARGIN + (diagram.lanes - 1) * LANE_PITCH + NODE_W;
  const height = 2 * MARGIN + (diagram.rows - 1) * ROW_PITCH + NODE_H + 2 * LABEL_ROOM;
  const byId = new Map(diagram.nodes.map((node) => [node.person.id, geometry(node)]));

  const links = diagram.links.map(({ from, to, kind }) => {
    const a = byId.get(from)!;
    const b = byId.get(to)!;
    if (kind === "spouse") {
      const [left, right] = a.x <= b.x ? [a, b] : [b, a];
      const line = (dy: number) => `M${left.x + NODE_W} ${left.cy + dy}H${right.x}`;
      return `<path class="kinship-link kinship-link-spouse" d="${line(-3)}${line(3)}"/>`;
    }
    const [upper, lower] = a.y <= b.y ? [a, b] : [b, a];
    const mid = (upper.y + NODE_H + lower.y) / 2;
    return `<path class="kinship-link kinship-link-parent" d="M${upper.cx} ${upper.y + NODE_H}V${mid}H${lower.cx}V${lower.y}"/>`;
  });

  // A parent line leaves the bottom of the upper box, so an end that is the upper box of its link
  // gets its role above the box; otherwise below.
  const linkedBelow = (i: number) => {
    const id = diagram.nodes[i].person.id;
    return diagram.links.some(({ from, to, kind }) => {
      if (kind !== "parent") return false;
      const other = from === id ? to : to === id ? from : null;
      return other !== null && byId.get(other)!.y > byId.get(id)!.y;
    });
  };
  const nodes = diagram.nodes.map((node, i) => {
    const { x, y, cx } = geometry(node);
    const end = i === 0 || i === last;
    const role = roleOf(i);
    return [
      `<g class="kinship-node${end ? " kinship-end" : ""}">`,
      `<rect class="kinship-box" x="${x}" y="${y}" width="${NODE_W}" height="${NODE_H}" rx="8"/>`,
      `<text class="kinship-name" x="${cx}" y="${y + NODE_H / 2 + 5}">${escapeXml(names[i])}</text>`,
      role
        ? `<text class="kinship-role" x="${cx}" y="${linkedBelow(i) ? y - 6 : y + NODE_H + 15}">${escapeXml(role)}</text>`
        : "",
      "</g>",
    ].join("");
  });

  return [
    `<svg class="kinship" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="${prefix}-title ${prefix}-desc">`,
    `<title id="${prefix}-title">${escapeXml(title)}</title>`,
    `<desc id="${prefix}-desc">${escapeXml(description)}</desc>`,
    `<style>${STYLE}</style>`,
    ...links,
    ...nodes,
    "</svg>",
  ].join("\n");
}
