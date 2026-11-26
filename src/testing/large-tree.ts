import type { Sex, TreeInput } from "../types";
import type { TestPerson } from "./fixtures";

/** A small seeded random generator, so every run builds the same tree. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SURNAMES = [
  "Παπαδόπουλος",
  "Γεωργίου",
  "Ιωάννου",
  "Δημητρίου",
  "Αντωνίου",
  "Κωνσταντίνου",
  "Νικολάου",
  "Βασιλείου",
];

/**
 * A large, realistic, fictional family tree for benchmarks and sanity tests: `size` people in
 * generations of couples with 0 to 4 children, some remarriages, some marriages to a cousin or an
 * unrelated person of the same generation (never a sibling or half-sibling), and birth years that
 * rise with each generation. Everyone has `born`. The same `size` and `seed` always give the same
 * tree. `size` is at least 2 (one couple); smaller values give 2.
 */
export function largeTree(size = 10_000, seed = 20_251_125): Required<TreeInput<TestPerson>> {
  const random = mulberry32(seed);
  const int = (n: number) => Math.floor(random() * n);
  const people: TestPerson[] = [];
  const parents: [string, string][] = [];
  const unions: { a: string; b: string }[] = [];
  const parentsOf = new Map<string, string[]>();
  size = Math.max(2, size);
  const full = () => people.length >= size;

  const add = (sex: Sex, born: number): TestPerson => {
    const id = `p${people.length}`;
    const p: TestPerson = { id, sex, name: `${id} ${SURNAMES[int(SURNAMES.length)]}`, born };
    people.push(p);
    return p;
  };
  const sexOf = (): Sex => (random() < 0.5 ? "male" : "female");
  const opposite = (sex: Sex): Sex => (sex === "male" ? "female" : "male");
  const outsider = (sex: Sex, born: number) => add(sex, born + int(7) - 3);

  type Couple = { a: TestPerson; b: TestPerson };
  let couples: Couple[] = [];
  const founders = Math.max(2, Math.round(size / 60));
  const seedFounders = (born: number) => {
    for (let i = 0; i < founders && people.length + 2 <= size; i++) {
      const a = add("male", born + int(10));
      const b = add("female", born + int(10));
      unions.push({ a: a.id, b: b.id });
      couples.push({ a, b });
    }
  };
  seedFounders(1700);

  const childCount = () => [0, 1, 1, 2, 2, 2, 3, 3, 4][int(9)];

  for (let generation = 1; !full(); generation++) {
    const baseYear = 1700 + 28 * generation;
    const children: TestPerson[] = [];
    for (const { a, b } of couples) {
      const n = childCount();
      for (let i = 0; i < n && !full(); i++) {
        const c = add(sexOf(), Math.max(a.born!, b.born!) + 20 + int(14));
        parents.push([a.id, c.id], [b.id, c.id]);
        parentsOf.set(c.id, [a.id, b.id]);
        children.push(c);
      }
    }
    // Marry the children off: mostly to outsiders, sometimes to a cousin or an unrelated person of
    // the same generation (never a sibling or half-sibling).
    const single = new Set(children.map((c) => c.id));
    const next: Couple[] = [];
    const wed = (x: TestPerson, y: TestPerson) => {
      unions.push({ a: x.id, b: y.id });
      next.push(x.sex === "female" ? { a: y, b: x } : { a: x, b: y });
    };
    for (const c of children) {
      if (!single.has(c.id) || full()) continue;
      single.delete(c.id);
      let mate: TestPerson | undefined;
      if (random() < 0.12) {
        const mine = parentsOf.get(c.id)!;
        mate = children
          .slice(int(children.length))
          .concat(children)
          .find(
            (o) => single.has(o.id) && o.sex === opposite(c.sex) && !parentsOf.get(o.id)!.some((p) => mine.includes(p)),
          );
      }
      if (mate) {
        single.delete(mate.id);
        wed(c, mate);
      } else if (!full() && random() < 0.9) {
        wed(c, outsider(opposite(c.sex), c.born!));
      }
      if (!full() && random() < 0.08) {
        // A second marriage: the person also has a union with a new partner.
        wed(c, outsider(opposite(c.sex), c.born! + int(10)));
      }
    }
    couples = next;
    if (couples.length === 0) {
      // The line died out: start a new set of founders so the tree can keep growing.
      seedFounders(baseYear);
      if (couples.length === 0) break;
    }
  }
  return { people, parents, unions };
}
