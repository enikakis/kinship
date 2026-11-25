import {
  createTree,
  describeRelation,
  type KinshipLocale,
  relate,
  relateAll,
  type Tree,
  type TreeIssue,
  validateTree,
} from "@enikakis99/kinship";
import { fromGedcom, type GedcomPerson } from "@enikakis99/kinship/gedcom";
import { de } from "@enikakis99/kinship/locales/de";
import { el } from "@enikakis99/kinship/locales/el";
import { en } from "@enikakis99/kinship/locales/en";
import { es } from "@enikakis99/kinship/locales/es";
import { fr } from "@enikakis99/kinship/locales/fr";
import { toSvg } from "@enikakis99/kinship/svg";
import sample from "./family.ged?raw";
import {
  capitalise,
  type Group,
  type GroupKey,
  groupEveryone,
  LANGUAGES,
  type LanguageCode,
  parseHash,
  pickerLabels,
  preferredLanguage,
  rememberLast,
  resolvePerson,
  serialiseHash,
  type ViewState,
} from "./logic";

const LOCALES: Record<LanguageCode, KinshipLocale> = { el, en, fr, de, es };

/** Lydia and Dimos: he is her uncle by marriage and her father's first cousin. */
const SAMPLE_PAIR = { from: "I29", to: "I14" };

/** A loaded GEDCOM file, ready to query. */
type Family = {
  tree: Tree<GedcomPerson>;
  people: readonly GedcomPerson[];
  labels: Map<string, string>;
  names: Map<string, string>;
  /** The visitor's file name; null for the sample. */
  fileName: string | null;
  issues: TreeIssue[];
};

/** Reads a GEDCOM text; null when it has no people. */
function load(text: string, fileName: string | null): Family | null {
  const input = fromGedcom(text);
  if (input.people.length === 0) return null;
  const tree = createTree(input, { born: (person) => person.born });
  const names = new Map(input.people.map((person) => [person.id, tree.name(person)]));
  const labels = pickerLabels(input.people.map((person) => ({ ...person, name: tree.name(person) })));
  return { tree, people: input.people, labels, names, fileName, issues: validateTree(input).issues };
}

/**
 * The pair to show first: the sample's, or the file's first person and a parent, child or spouse
 * of theirs (no tree search, so a large file opens quickly), else the next person.
 */
function defaultPair(family: Family): { from: string; to: string } {
  if (family.fileName === null) return SAMPLE_PAIR;
  const { tree, people } = family;
  const from = people[0]!.id;
  const near = tree.parents(from)[0] ?? tree.children(from)[0] ?? tree.spouses(from)[0] ?? people[1];
  return { from, to: near?.id ?? from };
}

// ---- Elements ---------------------------------------------------------------------------------

const byId = <T extends HTMLElement = HTMLElement>(id: string) => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`demo: #${id} is missing from index.html`);
  return element as T;
};

const ui = {
  source: byId("source"),
  datalist: byId<HTMLDataListElement>("people"),
  swap: byId<HTMLButtonElement>("swap"),
  languages: byId("languages"),
  resultTitle: byId("result-title"),
  resultStatus: byId("result-status"),
  resultBody: byId("result-body"),
  everyone: byId("everyone"),
  everyoneTitle: byId("everyone-title"),
  everyoneName: byId("everyone-name"),
  everyoneCount: byId("everyone-count"),
  everyoneBody: byId("everyone-body"),
  file: byId<HTMLInputElement>("file"),
  reset: byId<HTMLButtonElement>("reset"),
  ownControls: byId("own-controls"),
  fileStatus: byId("file-status"),
};

const ends = {
  from: { input: byId<HTMLInputElement>("from"), error: byId("from-error"), role: byId("from-role") },
  to: { input: byId<HTMLInputElement>("to"), error: byId("to-error"), role: byId("to-role") },
};

type Child = Node | string | null | false;

/** A new element with an optional class, attributes and children. */
function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Record<string, string> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  for (const child of children) if (child) element.append(child);
  return element;
}

// ---- State ------------------------------------------------------------------------------------

let family = load(sample, null)!;
let from = SAMPLE_PAIR.from;
let to = SAMPLE_PAIR.to;
let lang: LanguageCode = preferredLanguage(navigator.languages);

/** Takes what the URL hash says, keeping the current value for anything missing or unknown. */
function apply(state: ViewState) {
  const known = (id: string | null) => id !== null && family.tree.byId.has(id);
  if (known(state.from)) from = state.from!;
  if (known(state.to)) to = state.to!;
  if (state.lang !== null) lang = state.lang;
}

const nameOf = (id: string) => family.names.get(id) ?? id;
/**
 * The shareable hash. A visitor's file is not part of the link, so with one loaded the hash keeps
 * only the language: a reload, or someone else opening the link, gets the sample, not a pair of
 * ids that mean other people there.
 */
const hashFor = (state: { from: string; to: string }) =>
  serialiseHash(family.fileName === null ? { ...state, lang } : { from: null, to: null, lang });

// ---- Rendering --------------------------------------------------------------------------------

function render() {
  for (const end of [ends.from, ends.to]) {
    end.error.textContent = "";
    end.input.removeAttribute("aria-invalid");
  }
  ends.from.input.value = family.labels.get(from) ?? from;
  ends.to.input.value = family.labels.get(to) ?? to;
  for (const radio of ui.languages.querySelectorAll<HTMLInputElement>("input[type=radio]")) {
    radio.checked = radio.value === lang;
  }
  renderResult();
  renderEveryone();
  // Names only for the invented sample: a visitor's file stays out of tab titles and history.
  document.title = family.fileName === null ? `${nameOf(from)} and ${nameOf(to)}: Kinship` : "Your tree: Kinship";
  history.replaceState(null, "", hashFor({ from, to }));
}

/** A role under a picker: what this end is to the other, and to whom. */
function setRole(element: HTMLElement, role: string | null, otherName: string) {
  element.replaceChildren();
  if (role === null) {
    element.append(h("span", { class: "role-none" }, "No everyday name"));
    return;
  }
  element.append(
    h("span", { class: "role-name", lang }, capitalise(role, lang)),
    h("span", { class: "role-of" }, `to ${otherName}`),
  );
}

function renderResult() {
  const body = ui.resultBody;
  body.replaceChildren();
  const relation = from === to ? null : relate(family.tree, from, to);
  // A status region, so a screen reader hears when there is no result.
  ui.resultStatus.textContent = relation
    ? ""
    : from === to
      ? "Pick two different people."
      : `No chain of parents, children or marriages joins ${nameOf(from)} and ${nameOf(to)} in this tree.`;
  if (!relation) {
    ends.from.role.replaceChildren();
    ends.to.role.replaceChildren();
    return;
  }

  const locale = LOCALES[lang];
  const text = describeRelation(family.tree, relation, locale);
  setRole(ends.from.role, text.main.roles?.self ?? null, nameOf(to));
  setRole(ends.to.role, text.main.roles?.other ?? null, nameOf(from));

  const noDegree = text.main.degree === null;
  const degreeNote = relation.couple
    ? "None: the law counts no degree between husband and wife."
    : "None: the law counts kinship by marriage only between one spouse and the other spouse's blood relatives.";
  const facts = h(
    "dl",
    { class: "facts" },
    h("dt", {}, `What ${nameOf(to)} is to ${nameOf(from)}`),
    h("dd", { lang, class: "summary" }, capitalise(text.main.summary, lang)),
    h("dt", {}, "Legal degree"),
    noDegree ? h("dd", {}, degreeNote) : h("dd", { lang }, text.main.degree),
    relation.couple && h("dt", {}, "Married"),
    relation.couple && h("dd", {}, "Yes, to each other."),
  );

  const svg = toSvg(relation.main.diagram, {
    name: (person) => family.tree.name(person),
    roles: text.main.roles,
    title: capitalise(text.main.summary, lang),
    description: text.main.chain.map((step) => step.text).join(", "),
    idPrefix: "demo-main",
  });
  const drawing = h("div", { class: "drawing", role: "group", "aria-label": "Diagram of the chain" });
  drawing.innerHTML = svg; // toSvg escapes every name and label.
  // The wrapper's label is English; the SVG's roles, title and description are in the chosen language.
  drawing.querySelector("svg")?.setAttribute("lang", lang);
  const figure = h(
    "figure",
    { class: "diagram" },
    drawing,
    h(
      "figcaption",
      {},
      "The chain, drawn: the two people are outlined, a double line is a marriage.",
      h("span", { class: "scroll-hint", hidden: "" }, " Scroll sideways to see all of it."),
    ),
  );

  const chain = h(
    "section",
    { class: "chain", "aria-labelledby": "chain-title" },
    h("h3", { id: "chain-title" }, "Step by step"),
    h("ol", { lang }, ...text.main.chain.map((step) => h("li", {}, step.text))),
  );

  const others = h(
    "section",
    { class: "others", "aria-labelledby": "others-title" },
    h("h3", { id: "others-title" }, "Other blood ties"),
    text.others.length === 0
      ? h("p", { class: "note" }, relation.main.blood ? "None besides this one." : "None.")
      : h(
          "ul",
          {},
          ...text.others.map((tie) =>
            h(
              "li",
              { class: "tie-other" },
              tie.roles
                ? h(
                    "dl",
                    { class: "tie-roles" },
                    h("dt", {}, nameOf(from)),
                    h("dd", { lang }, capitalise(tie.roles.self, lang)),
                    h("dt", {}, nameOf(to)),
                    h("dd", { lang }, capitalise(tie.roles.other, lang)),
                  )
                : h("p", { lang, class: "tie-name" }, capitalise(tie.summary, lang)),
              tie.commonAncestors && h("p", { lang }, tie.commonAncestors),
              tie.degree && h("p", { lang, class: "note" }, tie.degree),
              h("p", { lang, class: "note" }, tie.chain.map((step) => step.text).join(" → ")),
            ),
          ),
        ),
  );

  body.append(facts, figure, h("div", { class: "columns" }, chain, others));
  fitDrawing();
}

/**
 * The diagram shrinks to fit, but not below 80% of its size (or 440px for a small one), so its
 * text stays readable on a phone; past that its box scrolls sideways, and then takes keyboard
 * focus so it can be scrolled without a pointer.
 */
function fitDrawing() {
  const drawing = ui.resultBody.querySelector<HTMLElement>(".drawing");
  const svg = drawing?.querySelector("svg");
  if (!drawing || !svg) return;
  const natural = Number(svg.getAttribute("width"));
  if (natural > 0) svg.style.minWidth = `${Math.min(natural, Math.max(440, Math.round(natural * 0.8)))}px`;
  const scrolls = drawing.scrollWidth > drawing.clientWidth + 1;
  if (scrolls) drawing.tabIndex = 0;
  else drawing.removeAttribute("tabindex");
  const hint = ui.resultBody.querySelector<HTMLElement>(".scroll-hint");
  if (hint) hint.hidden = !scrolls;
}

/** Above this many people, the list of everyone is worked out only when asked for. */
const LARGE_TREE = 2000;
/** Entries shown per group before a "Show all" button. */
const LIST_LIMIT = 60;

/**
 * Everyone connected to one person, in groups: one tree search per person, kept for the last two
 * people, so a swap and a swap back search nothing.
 */
const everyoneOf = rememberLast((family: Family, from: string) => groupEveryone(relateAll(family.tree, from)), 2);

/** What the list of everyone shows now; null while it is out of date. */
let listed: { family: Family; from: string; lang: LanguageCode } | null = null;
/** Groups shown in full, for the listed person. */
let expanded = new Set<GroupKey>();
/** The latest list job, so an older, slower one gives way. */
let listJob = 0;

function renderEveryone() {
  ui.everyoneName.textContent = nameOf(from);
  const samePerson = listed?.family === family && listed.from === from;
  if (samePerson && listed?.lang === lang) {
    markCurrent();
    return;
  }
  if (!samePerson) expanded = new Set();
  ++listJob; // An older list job gives way.
  ui.everyone.removeAttribute("aria-busy");
  // A small tree, or a person already searched (a language switch, a swap back): list them now.
  if (family.people.length <= LARGE_TREE || everyoneOf.has(family, from)) {
    fillEveryone(everyoneOf(family, from));
    return;
  }
  // In a large tree each new person needs a long search, so it waits to be asked for.
  listed = null;
  ui.everyoneCount.textContent = `Listing everyone in a tree of ${family.people.length} people takes a moment.`;
  ui.everyoneBody.replaceChildren(
    h("button", { type: "button", class: "list-everyone" }, `List everyone related to ${nameOf(from)}`),
  );
}

/** Lists everyone in a large tree, on request: says so, and lets the page paint before the search. */
function listEveryone() {
  const job = ++listJob;
  ui.everyone.setAttribute("aria-busy", "true");
  ui.everyoneCount.textContent = `Working out how all ${family.people.length} people are related to ${nameOf(from)}…`;
  // The button goes away, so focus moves to the section's heading.
  ui.everyoneBody.replaceChildren();
  ui.everyoneTitle.focus();
  setTimeout(() => {
    if (job !== listJob) return;
    fillEveryone(everyoneOf(family, from));
    ui.everyone.removeAttribute("aria-busy");
  }, 30);
}

function fillEveryone(groups: Group<GedcomPerson>[]) {
  const connected = groups.reduce((sum, group) => sum + group.entries.length, 0);
  const unconnected = family.people.length - 1 - connected;
  ui.everyoneCount.textContent =
    `${connected} ${connected === 1 ? "person" : "people"} connected` +
    (unconnected > 0 ? `, ${unconnected} not connected.` : ".") +
    " Choose someone to see how they are related.";

  const locale = LOCALES[lang];
  const row = ({ id, entry }: Group<GedcomPerson>["entries"][number]) => {
    const { main } = describeRelation(family.tree, { ...entry, others: [] }, locale);
    const link = h("a", { href: hashFor({ from, to: id }), "data-id": id }, nameOf(id));
    return h("li", {}, link, h("span", { class: "relation", lang }, capitalise(main.summary, lang)));
  };
  ui.everyoneBody.replaceChildren(
    ...groups.map((group) => {
      const all = expanded.has(group.key) || group.entries.length <= LIST_LIMIT;
      const shown = all ? group.entries : group.entries.slice(0, LIST_LIMIT);
      return h(
        "section",
        { class: "group", "aria-labelledby": `group-${group.key}` },
        h(
          "h3",
          { id: `group-${group.key}` },
          `${group.title} `,
          h("span", { class: "count" }, `(${group.entries.length})`),
        ),
        h("ul", {}, ...shown.map(row)),
        !all &&
          h(
            "button",
            { type: "button", class: "show-all", "data-group": group.key, "aria-describedby": `group-${group.key}` },
            `Show all ${group.entries.length}`,
          ),
      );
    }),
  );
  listed = { family, from, lang };
  markCurrent();
}

/** Marks the second person in the list of everyone. */
function markCurrent() {
  for (const link of ui.everyoneBody.querySelectorAll<HTMLAnchorElement>("a[data-id]")) {
    if (link.dataset.id === to) link.setAttribute("aria-current", "true");
    else link.removeAttribute("aria-current");
  }
}

function renderLanguages() {
  ui.languages.replaceChildren(
    ...LANGUAGES.map(({ code, label, experimental }) =>
      h(
        "label",
        { class: "language" },
        h("input", { type: "radio", name: "lang", value: code }),
        h("span", { lang: code }, label),
        experimental && h("span", { class: "experimental" }, "experimental"),
      ),
    ),
  );
}

/** The sample's description, as index.html writes it. */
const sampleSource = ui.source.textContent ?? "";

function renderSource() {
  const { people, issues, fileName } = family;
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  if (fileName === null) ui.source.textContent = sampleSource;
  else {
    ui.source.replaceChildren(`${fileName}: ${plural(people.length, "person", "people")}, read in your browser.`);
    if (issues.length > 0) {
      ui.source.append(" ", problemsLink(`${plural(issues.length, "problem", "problems")} found in the file`), ".");
    }
  }
  ui.reset.hidden = fileName === null;
  ui.datalist.replaceChildren(...[...family.labels.values()].map((label) => h("option", { value: label })));
}

/** A link to the list of the file's problems, which scrolls to it and moves focus there. */
function problemsLink(text: string) {
  const link = h("a", { href: "#file-status" }, text);
  link.addEventListener("click", (event) => {
    event.preventDefault();
    ui.fileStatus.focus();
  });
  return link;
}

// ---- Events -----------------------------------------------------------------------------------

function choose(end: "from" | "to", id: string) {
  if (end === "from") from = id;
  else to = id;
  render();
}

for (const end of ["from", "to"] as const) {
  const { input, error } = ends[end];
  input.addEventListener("focus", () => input.select());
  // Picking an option from the list fills in its exact label.
  input.addEventListener("input", () => {
    const id = [...family.labels].find(([, label]) => label === input.value)?.[0];
    if (id !== undefined) choose(end, id);
  });
  input.addEventListener("change", () => {
    const id = resolvePerson(input.value, family.labels, family.names);
    if (id !== null) {
      choose(end, id);
      return;
    }
    input.setAttribute("aria-invalid", "true");
    error.textContent = input.value.trim()
      ? `No one in this tree is called “${input.value.trim()}”. Pick a name from the list.`
      : "Pick a name from the list.";
  });
}

ui.swap.addEventListener("click", () => {
  [from, to] = [to, from];
  render();
});

ui.languages.addEventListener("change", (event) => {
  const value = (event.target as HTMLInputElement).value;
  const language = LANGUAGES.find((option) => option.code === value);
  if (language) {
    lang = language.code;
    render();
  }
});

// A name in the list becomes the second person; the result comes into view.
ui.everyoneBody.addEventListener("click", (event) => {
  if ((event.target as Element).closest("button.list-everyone")) {
    listEveryone();
    return;
  }
  const more = (event.target as Element).closest<HTMLButtonElement>("button.show-all");
  if (more) {
    const key = more.dataset.group as GroupKey;
    expanded.add(key);
    fillEveryone(everyoneOf(family, from));
    // Focus the first name that was hidden.
    ui.everyoneBody.querySelectorAll<HTMLAnchorElement>(`#group-${key} ~ ul a`)[LIST_LIMIT]?.focus();
    return;
  }
  const link = (event.target as Element).closest<HTMLAnchorElement>("a[data-id]");
  if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  choose("to", link.dataset.id!);
  ui.resultTitle.focus();
});

window.addEventListener("hashchange", () => {
  apply(parseHash(location.hash));
  render();
});

window.addEventListener("resize", fitDrawing);

ui.file.addEventListener("change", async () => {
  const file = ui.file.files?.[0];
  if (!file) return;
  let loaded: Family | null;
  try {
    loaded = load(await file.text(), file.name);
  } catch {
    ui.fileStatus.replaceChildren(
      h("p", { class: "problem" }, `${file.name} could not be read. Try opening it again.`),
    );
    return;
  }
  if (!loaded) {
    ui.fileStatus.replaceChildren(
      h("p", { class: "problem" }, `No people found in ${file.name}. Is it a GEDCOM file?`),
    );
    return;
  }
  try {
    family = loaded;
    ({ from, to } = defaultPair(family));
    renderSource();
    render();
    showIssues();
  } catch (error) {
    showSample();
    const reason = error instanceof Error && error.message ? ` (${error.message})` : "";
    ui.fileStatus.replaceChildren(
      h("p", { class: "problem" }, `${file.name} could not be shown${reason}, so the sample family is back.`),
    );
  }
});

/** Back to the built-in sample family and its pair. */
function showSample() {
  family = load(sample, null)!;
  ({ from, to } = SAMPLE_PAIR);
  ui.file.value = "";
  renderSource();
  render();
  ui.fileStatus.replaceChildren();
}

ui.reset.addEventListener("click", () => {
  showSample();
  ends.from.input.focus();
});

/** Problems listed before "And N more". */
const ISSUE_LIMIT = 50;

function showIssues() {
  const { issues, fileName } = family;
  if (issues.length === 0) {
    ui.fileStatus.replaceChildren(h("p", {}, `Loaded ${fileName}. No problems found.`));
    return;
  }
  ui.fileStatus.replaceChildren(
    h(
      "div",
      { class: "issues" },
      h("h3", {}, `${issues.length} ${issues.length === 1 ? "problem" : "problems"} in ${fileName}`),
      h("p", {}, "Links that cannot be used are skipped, so some answers may look odd until the file is fixed."),
      h("ul", {}, ...issues.slice(0, ISSUE_LIMIT).map((issue) => h("li", {}, issue.message))),
      issues.length > ISSUE_LIMIT && h("p", {}, `And ${issues.length - ISSUE_LIMIT} more.`),
    ),
  );
}

// ---- Start ------------------------------------------------------------------------------------

ui.ownControls.append(
  h(
    "a",
    { href: URL.createObjectURL(new Blob([sample], { type: "text/plain" })), download: "kinship-sample-family.ged" },
    "Download the sample file",
  ),
);
renderLanguages();
renderSource();
apply(parseHash(location.hash));
render();
