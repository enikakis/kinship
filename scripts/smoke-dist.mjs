// Smoke test of the built package, loaded by its own name so the exports map is exercised.
// Run `npm run build` first; `npm run test:dist` does not build.
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const localeNames = ["el", "en", "fr", "de", "es"];

const input = {
  people: [
    { id: "gp", sex: "male" },
    { id: "dad", sex: "male" },
    { id: "maria", sex: "female" },
    { id: "nikos", sex: "male" },
  ],
  parents: [
    ["gp", "dad"],
    ["gp", "maria"],
    ["dad", "nikos"],
  ],
  unions: [],
};

function check(label, kinship, locales, svg, gedcom) {
  for (const name of localeNames) assert.ok(locales[name], `${label}: locales/${name}`);
  const tree = kinship.createTree(input);
  const rel = kinship.relate(tree, "nikos", "maria");
  assert.equal(rel.main.kind, "uncle", `${label}: relate`);
  assert.equal(kinship.describeRelation(tree, rel, locales.el).main.roles.other, "θεία", `${label}: el`);
  assert.equal(kinship.describeRelation(tree, rel, locales.en).main.roles.other, "aunt", `${label}: en`);
  assert.equal(typeof svg.toSvg, "function", `${label}: svg`);
  assert.equal(typeof gedcom.fromGedcom, "function", `${label}: gedcom`);
}

const esm = {};
for (const name of localeNames) esm[name] = (await import(`@enikakis99/kinship/locales/${name}`))[name];
check(
  "esm",
  await import("@enikakis99/kinship"),
  esm,
  await import("@enikakis99/kinship/svg"),
  await import("@enikakis99/kinship/gedcom"),
);

const cjs = {};
for (const name of localeNames) cjs[name] = require(`@enikakis99/kinship/locales/${name}`)[name];
check(
  "cjs",
  require("@enikakis99/kinship"),
  cjs,
  require("@enikakis99/kinship/svg"),
  require("@enikakis99/kinship/gedcom"),
);

console.log("dist smoke test passed");
