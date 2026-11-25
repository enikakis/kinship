import { expect, it } from "vitest";
import { reverseChain } from "./chain";

it("reads a chain backwards", () => {
  // a →up b →spouse c →down d   becomes   d →up c →spouse b →down a
  const [a, b, c, d] = ["a", "b", "c", "d"].map((id) => ({ id, sex: "unknown" as const }));
  const chain = {
    from: a,
    steps: [
      { person: b, move: "up" as const },
      { person: c, move: "spouse" as const },
      { person: d, move: "down" as const },
    ],
  };
  expect(reverseChain(chain)).toEqual({
    from: d,
    steps: [
      { person: c, move: "up" },
      { person: b, move: "spouse" },
      { person: a, move: "down" },
    ],
  });
  expect(reverseChain(reverseChain(chain))).toEqual(chain);
});
