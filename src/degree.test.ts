import { describe, expect, it } from "vitest";
import { legalDegree } from "./degree";
import { fromKey } from "./testing/fixtures";

describe("legalDegree", () => {
  it.each([
    ["D", { degree: 1, line: "direct", kind: "blood" }],
    ["UU", { degree: 2, line: "direct", kind: "blood" }],
    ["UUD", { degree: 3, line: "collateral", kind: "blood" }],
    ["UUDD", { degree: 4, line: "collateral", kind: "blood" }],
    ["SU", { degree: 1, line: "direct", kind: "affinity" }],
    ["SUD", { degree: 2, line: "collateral", kind: "affinity" }],
    ["UDS", { degree: 2, line: "collateral", kind: "affinity" }],
    ["UUDDS", { degree: 4, line: "collateral", kind: "affinity" }],
  ])("counts %s as the civil law does", (key, expected) => {
    expect(legalDegree(fromKey(key))).toEqual(expected);
  });

  it.each(["S", "DSU", "SUDS", "SUUDS"])("counts no degree for %s", (key) => {
    expect(legalDegree(fromKey(key))).toBeNull();
  });
});
