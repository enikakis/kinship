import { describe, expect, it } from "vitest";
import { nameQuery, type Blood, type Kind } from "../classify";
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

  it("names the spouse of a relative through the relative", () => {
    const q = nameQuery(fromKey("UUDDS"), ["male", "unknown", "unknown", "unknown", "female", "male"], false);
    expect(el.name(q)).toBe("σύζυγος της πρώτης εξαδέλφης");
    expect(en.name(q)).toBe("husband of a first cousin");
  });

  it("names a relative of a spouse of unknown sex with both forms", () => {
    const q = nameQuery(fromKey("SDD"), ["male", "unknown", "unknown", "female"], false);
    expect(el.name(q)).toBe("εγγονή του συζύγου/της συζύγου");
    expect(en.name(q)).toBe("spouse's granddaughter");
  });
});
