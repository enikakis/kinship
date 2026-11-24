import { describe, expect, it } from "vitest";
import type { Blood, Kind } from "../classify";
import type { NameQuery } from "../locale";
import { fromKey } from "../testing/fixtures";
import type { Sex } from "../types";
import { el } from "./el";
import { en } from "./en";

const query = (kind: Kind, key: string, sexes: Sex[], blood: Blood | null = null): NameQuery => ({
  kind,
  moves: fromKey(key),
  sexes,
  blood,
});

describe("locales", () => {
  it("names an aunt in both languages", () => {
    const q = query("uncle", "UUD", ["male", "male", "male", "female"], { up: 2, down: 1 });
    expect(el.name(q)).toBe("θεία");
    expect(en.name(q)).toBe("aunt");
  });

  it("has no name for a chain through a marriage in the middle", () => {
    expect(el.name(query("unnamed", "UDSUD", ["male", "unknown", "female", "male", "unknown", "male"]))).toBeNull();
  });

  it("says the steps and the degree", () => {
    expect(el.step("up", "female")).toBe("μητέρα");
    expect(en.degree({ degree: 3, line: "collateral", kind: "blood" })).toBe(
      "Related by blood in the collateral line, 3rd degree",
    );
  });
});
