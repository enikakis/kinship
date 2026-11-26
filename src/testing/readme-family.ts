import { createTree } from "../tree";

/**
 * The family of the README's "How it works", kept here so `src/readme.test.ts` checks every
 * output the README shows. Katerina married her second cousin Lefteris.
 *
 * ```text
 *                 Markos ═ Despina
 *              ┌────────┴────────┐
 *            Rena             Ioannis
 *              │                 │
 *   Stelios ═ Sofia            Petros
 *     ┌─────┴─────────┐          │
 *   Dafni         Katerina ═ Lefteris
 *     │
 *    Anna
 * ```
 */
export const readmeTree = createTree({
  people: [
    { id: "markos", name: "Markos", sex: "male" },
    { id: "despina", name: "Despina", sex: "female" },
    { id: "rena", name: "Rena", sex: "female" },
    { id: "ioannis", name: "Ioannis", sex: "male" },
    { id: "stelios", name: "Stelios", sex: "male" },
    { id: "sofia", name: "Sofia", sex: "female" },
    { id: "petros", name: "Petros", sex: "male" },
    { id: "dafni", name: "Dafni", sex: "female" },
    { id: "katerina", name: "Katerina", sex: "female" },
    { id: "lefteris", name: "Lefteris", sex: "male" },
    { id: "anna", name: "Anna", sex: "female" },
  ],
  parents: [
    ["markos", "rena"],
    ["despina", "rena"],
    ["markos", "ioannis"],
    ["despina", "ioannis"],
    ["rena", "sofia"],
    ["ioannis", "petros"],
    ["stelios", "dafni"],
    ["sofia", "dafni"],
    ["stelios", "katerina"],
    ["sofia", "katerina"],
    ["petros", "lefteris"],
    ["dafni", "anna"],
  ],
  unions: [
    { a: "markos", b: "despina" },
    { a: "stelios", b: "sofia" },
    { a: "katerina", b: "lefteris" },
  ],
});
