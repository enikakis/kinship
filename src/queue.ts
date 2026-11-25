/**
 * A priority queue that always gives back the cheapest entry and, among equally cheap ones, the
 * one added first. The path search depends on that tie order: it decides which of several equally
 * short chains is found. A binary heap keyed on (cost, order added).
 */
export class CheapestFirst<T> {
  private readonly heap: { value: T; cost: number; seq: number }[] = [];
  private added = 0;

  get size(): number {
    return this.heap.length;
  }

  push(value: T, cost: number): void {
    const heap = this.heap;
    const entry = { value, cost, seq: this.added++ };
    let i = heap.length;
    heap.push(entry);
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (!before(entry, heap[parent]!)) break;
      heap[i] = heap[parent]!;
      i = parent;
    }
    heap[i] = entry;
  }

  /** The cheapest entry and its cost, or undefined when the queue is empty. */
  pop(): { value: T; cost: number } | undefined {
    const heap = this.heap;
    const top = heap[0];
    const last = heap.pop();
    if (top === undefined || last === undefined) return undefined;
    if (heap.length > 0) {
      let i = 0;
      for (;;) {
        const left = 2 * i + 1;
        if (left >= heap.length) break;
        const right = left + 1;
        const child = right < heap.length && before(heap[right]!, heap[left]!) ? right : left;
        if (!before(heap[child]!, last)) break;
        heap[i] = heap[child]!;
        i = child;
      }
      heap[i] = last;
    }
    return { value: top.value, cost: top.cost };
  }
}

const before = (x: { cost: number; seq: number }, y: { cost: number; seq: number }) =>
  x.cost < y.cost || (x.cost === y.cost && x.seq < y.seq);
