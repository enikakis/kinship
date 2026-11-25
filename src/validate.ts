import type { Person, TreeInput } from "./types";

/** One problem `validateTree` found in raw tree input. */
export type TreeIssue = {
  /** What kind of problem it is. */
  code: "duplicateId" | "unknownId" | "selfParent" | "selfUnion" | "tooManyParents" | "cycle";
  /** A short English sentence naming the ids involved. */
  message: string;
  /** The ids involved: the repeated id, the unknown ids, the person, the child then its parents, or the people of a cycle in order. */
  ids: string[];
};

/** What `validateTree` returns: `ok` is true exactly when `issues` is empty. */
export type TreeValidation = { ok: boolean; issues: TreeIssue[] };

/**
 * Checks raw input for problems `createTree` quietly works around or `relate` cannot make sense of.
 * Issues come in input order: repeated ids (by `people`), then each link in `parents`, then each
 * union, then people with more than two parents (in the order of each child's first valid parent
 * link), then cycles. A cycle is reported once, with its people in order: each id is a parent of the
 * next, and the last is a parent of the first. Overlapping cycles in one component may come out as
 * more than one issue, depending on search order. Never throws.
 */
export function validateTree<P extends Person>(input: TreeInput<P>): TreeValidation {
  const issues: TreeIssue[] = [];
  const known = new Set<string>();
  for (const { id } of input.people) {
    if (known.has(id)) issues.push({ code: "duplicateId", message: `Person id "${id}" is used more than once.`, ids: [id] });
    known.add(id);
  }

  const parentsOf = new Map<string, Set<string>>();
  const childrenOf = new Map<string, string[]>();
  for (const [parent, child] of input.parents) {
    const unknown = unique([parent, child].filter((id) => !known.has(id)));
    if (unknown.length > 0) {
      issues.push({ code: "unknownId", message: `A parent link names unknown ${unknown.length > 1 ? "ids" : "id"} ${quoted(unknown)}.`, ids: unknown });
    } else if (parent === child) {
      issues.push({ code: "selfParent", message: `"${parent}" is recorded as their own parent.`, ids: [parent] });
    } else {
      const parents = parentsOf.get(child) ?? parentsOf.set(child, new Set()).get(child)!;
      if (parents.has(parent)) continue;
      parents.add(parent);
      (childrenOf.get(parent) ?? childrenOf.set(parent, []).get(parent)!).push(child);
    }
  }

  for (const { a, b } of input.unions) {
    const unknown = unique([a, b].filter((id) => !known.has(id)));
    if (unknown.length > 0) {
      issues.push({ code: "unknownId", message: `A union names unknown ${unknown.length > 1 ? "ids" : "id"} ${quoted(unknown)}.`, ids: unknown });
    } else if (a === b) {
      issues.push({ code: "selfUnion", message: `"${a}" is recorded as married to themselves.`, ids: [a] });
    }
  }

  for (const [child, parents] of parentsOf) {
    if (parents.size > 2) {
      issues.push({ code: "tooManyParents", message: `"${child}" has ${parents.size} parents: ${quoted([...parents])}.`, ids: [child, ...parents] });
    }
  }

  issues.push(...findCycles(input.people.map((person) => person.id), childrenOf));
  return { ok: issues.length === 0, issues };
}

const unique = (ids: readonly string[]) => [...new Set(ids)];
const quoted = (ids: readonly string[]) => ids.map((id) => `"${id}"`).join(", ");

/** Depth-first search with colours, without recursion; each back edge closes one reported cycle. */
function findCycles(ids: readonly string[], childrenOf: ReadonlyMap<string, string[]>): TreeIssue[] {
  const issues: TreeIssue[] = [];
  const onPath = new Map<string, number>(); // grey: position on the current path
  const done = new Set<string>(); // black
  for (const start of ids) {
    if (done.has(start) || onPath.has(start)) continue;
    const path: string[] = [start];
    const next: number[] = [0];
    onPath.set(start, 0);
    while (path.length > 0) {
      const top = path.length - 1;
      const id = path[top]!;
      const children = childrenOf.get(id) ?? [];
      const index = next[top]!;
      if (index >= children.length) {
        path.pop();
        next.pop();
        onPath.delete(id);
        done.add(id);
        continue;
      }
      next[top] = index + 1;
      const child = children[index]!;
      const at = onPath.get(child);
      if (at !== undefined) {
        const people = path.slice(at);
        issues.push({ code: "cycle", message: `${quoted(people)} are each other's ancestors (a cycle).`, ids: people });
      } else if (!done.has(child)) {
        onPath.set(child, path.length);
        path.push(child);
        next.push(0);
      }
    }
  }
  return issues;
}
