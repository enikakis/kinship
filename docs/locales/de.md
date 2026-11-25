# German (de)

**Experimental.** The terms below come from the sources in the research that follows; they await a
native speaker's review. The "Rulings" and "Calls made while implementing" sections are what
`src/locales/de.ts` implements; where the rulings and the research disagree, the rulings win. The
research's open questions (§10) stay as the list for reviewers.

## Rulings

These are the project's cross-language rulings as they apply to German.

1. **Other-generation relatives beyond the standard words** are named through the person of the
   other's generation, as in Greek, with the genitive after the head noun: «Cousin des Vaters»,
   «Sohn der Cousine», «Cousin 2. Grades des Großvaters», «Bruder des Ururgroßvaters»,
   «Ururenkel des Bruders». The standard words are kept where they exist: Onkel, Großonkel,
   Urgroßonkel; Neffe, Großneffe, Urgroßneffe (and the feminines). Never «Großcousin»,
   «Onkel 2. Grades», «Neffe 2. Grades».
2. **Cousins of the same generation:** «Cousin / Cousine» (1st), then «Cousin / Cousine 2. Grades»,
   «3. Grades» … in figures, with no limit. «Grades» doesn't change with the sex or the case: «des
   Cousins 2. Grades», «der Cousine 2. Grades».
3. **Direct line beyond the named words:** the named words go up to «Urururgroßvater /
   Urururgroßmutter» and down to «Urururenkel / Urururenkelin» (5 generations); from 6 generations
   on, «Vorfahr / Vorfahrin 6. Grades» and «Nachkomme / Nachkommin 6. Grades» (in the direct line the
   BGB degree equals the number of generations). Genitive of the weak nouns: «des Vorfahren», «des
   Nachkommen». Never «n-facher Urgroßvater», «6. Generation».
4. **Unknown sex:** both full forms joined by "/" («Bruder/Schwester», «Großvater/Großmutter»,
   «Onkel/Tante»); a «Grades» degree follows both forms once: «Cousin/Cousine 2. Grades»; in the
   genitive each form has its article: «des Cousins/der Cousine». The neutral words the research
   lists are used instead: **Elternteil**, **Kind**, **Ehepartner**, and Enkelkind, Urenkelkind,
   Schwiegerkind, Stiefkind, Stiefelternteil. Inside a longer name an unknown parent is «eines
   Elternteils» («Cousin eines Elternteils»: «des Elternteils» reads oddly, as there are two).
   Spouse words when the sex is known: **Ehemann / Ehefrau** (genitive «des Ehemannes», «der
   Ehefrau»), in names and in chain steps alike.
5. **Named relations by marriage with no standard word** use a descriptive form: co-parent-in-law
   (one's child's spouse's parent) «Schwiegervater des Sohnes», «Schwiegermutter der Tochter», by
   the sex of one's child; «Schwiegervater/Schwiegermutter des Kindes» when the sexes are unknown.
   Not the regional «Gegenschwiegervater». Where a word exists it is used: co-sibling-in-law
   «Schwippschwager / Schwippschwägerin». The others, from the research: «Schwiegervater /
   Schwiegermutter», «Schwiegersohn / Schwiegertochter / Schwiegerkind», «Schwager / Schwägerin»,
   «angeheirateter Onkel / angeheiratete Tante», «angeheirateter Neffe / angeheiratete Nichte»,
   «Stiefvater / Stiefmutter / Stiefelternteil», «Stiefsohn / Stieftochter / Stiefkind». Every
   noun is capitalised; «angeheiratet» is an adjective, so those names start with a small letter
   (a name, not a sentence).
6. **Composed relations by marriage** use the precise descriptive form, mirroring English:
   «Ehefrau eines Cousins», «Ehemann einer Cousine des Vaters» (spouse of a relative, with the
   indefinite article); «Cousin des Ehemannes», «Sohn des Cousins der Ehefrau», «Enkelkind des
   Ehepartners» (relative of one's spouse).
8. **Sentences:** «Gemeinsamer Vorfahr: A» / «Gemeinsame Vorfahren: A und B» («A, B und C» for
   three or more), always in the generic masculine; «Verbunden über die Ehe von A und B.» /
   «Verbunden über die Ehen von A und B; C und D.»; the legal degree as research §9 recommends:
   «Verwandt / Verschwägert in gerader Linie / in der Seitenlinie im 3. Grad». Chain lines: «Vater:
   Name», with no space before the colon.
9. **Experimental:** `src/locales/de.ts` starts with a doc comment saying so, pointing here.

(Ruling 7 is for Spanish only.)

## Calls made while implementing

Choices the rulings leave open; the research or the nearest ruling decided them.

1. **Neutral words for an unknown sex:** besides Elternteil, Kind, Ehepartner, the research's
   Enkelkind, Urenkelkind, Schwiegerkind, Stiefkind, Stiefelternteil. Not «Großelternteil» (the
   research calls it stiff): an unknown grandparent is «Großvater/Großmutter», also in the genitive
   («des Großvaters/der Großmutter»).
2. **An unknown parent inside a longer name** is «eines Elternteils» (not «des Elternteils»).
3. **An unknown spouse in relativeOfSpouse** is «des Ehepartners» (ruling 4's neutral word).
4. **Genitive spellings:** «des Ehemannes» (ruling 6; the research also allows Ehemanns), «des
   Sohnes».
5. **Legal-degree wording** follows the research's §9 strings: «Verwandt in der Seitenlinie im 3.
   Grad», «Verschwägert in gerader Linie im 1. Grad» (not the medium-confidence «Blutsverwandt»).
6. **«angeheirateter Onkel» etc. start with a small letter**: an adjective in a name, not a
   sentence; callers may use it mid-sentence.
7. **Ancestor nominative «Vorfahr»** (not «Vorfahre»), as in ruling 8's «Gemeinsamer Vorfahr»;
   **descendant feminine «Nachkommin»** as research §2 lists it (low confidence).
8. **Spouse of a relative:** only the head relative takes the indefinite article («Ehemann einer
   Cousine des Vaters»); the nested genitives stay definite, as in French.

## For native reviewers

Besides the research's open questions (§10, below):

- «Verbunden durch die Ehe» against the current «Verbunden über die Ehe von …».
- Ruling 6: do everyday speakers say «angeheiratete Großtante» / «Stiefgroßmutter» where the library
  gives the literal composed name («Ehefrau eines Großonkels», «Ehefrau eines Großvaters»)?

---

# German (de) kinship vocabulary — research for `@enikakis/kinship`

Target: Standard German as written in Germany (de-DE). Austria/Switzerland notes are in §10.
Researched 2026-11-25. Confidence: **high** = dictionary or statute checked directly; **medium** = encyclopedia or genealogy guide checked directly, or standard usage I'm sure of but didn't fetch; **low** = conventions compete or the evidence is thin.

## Sources (short keys used in the tables)

| Key | Source |
|---|---|
| BGB1589 | § 1589 BGB, Verwandtschaft — https://www.gesetze-im-internet.de/bgb/__1589.html |
| BGB1590 | § 1590 BGB, Schwägerschaft — https://www.gesetze-im-internet.de/bgb/__1590.html |
| BGB1307 | § 1307 BGB ("vollbürtigen und halbbürtigen Geschwistern") — https://www.gesetze-im-internet.de/bgb/__1307.html |
| ZPO41 | § 41 Nr. 3 ZPO ("in der Seitenlinie bis zum dritten Grad verwandt oder bis zum zweiten Grad verschwägert") — https://www.gesetze-im-internet.de/zpo/__41.html |
| WP-V | de.wikipedia "Verwandtschaftsbeziehung" — https://de.wikipedia.org/wiki/Verwandtschaftsbeziehung |
| WP-AT | de.wikipedia "Ahnentafel" (Kekulé numbering: proband = 1, generation I) — https://de.wikipedia.org/wiki/Ahnentafel |
| WP-Ahn | de.wikipedia "Ahn" (Vorfahr/Vorfahre/Vorfahrin, Ahn/Ahne/Ahnin) — https://de.wikipedia.org/wiki/Ahn |
| RzD | H. Hungerige, *Verwandtschaftsbezeichnungen und Verwandtschaftsgrade*, Roland zu Dortmund e.V., Heft 2, 4. Fassung, Juli 2023 — https://tng.rolandgen.de/documents/RzD-Forschungshilfen%20Heft%202%20-%20Verwandtschaftsbezeichnungen%20und%20-grade%20-%204.%20Fassung.pdf (announced by CompGen: https://www.compgen.de/?p=57475) |
| D:… | Duden online, https://www.duden.de/rechtschreibung/<entry> (entries fetched: Cousin, Cousine, Vetter, Geschwister, Schwager, Schwippschwager, Gegenschwiegervater, Gegenschwiegermutter, Schwiegerkind, Elternteil, Ehepartner, Halbbruder, Stiefbruder, Halbgeschwister, angeheiratet, Vorfahr, Vorfahrin, Nachkomme) |
| WKT-Schw | de.wiktionary "Schwippschwager" — https://de.wiktionary.org/wiki/Schwippschwager |
| POP | Popular advice pages that show the *colloquial* confusion around "Großcousin" (not authorities): https://www.wunderweib.de/grosscousine-und-grosscousin-die-richtige-definition-die-fast-niemand-kennt-116109.html, https://www.kuechenfibel.de/faq/was-ist-die-cousine-2-grades |

## Grammar the names need (read first)

- **Every noun is capitalised** (Onkel, Cousine, Ehefrau). Ordinal words and adjectives are not: "Cousin zweiten Grades", "angeheirateter Onkel". When a name that starts with an adjective opens a line or sentence, capitalise it: "Angeheirateter Onkel".
- **Descriptive names use the genitive after the head noun**, with the article and no possessive: "Cousin **des** Vaters", "Tochter **der** Cousine", "Cousine 2. Grades **der** Großmutter". Chains nest outward, read right to left: "Cousin des Vaters der Ehefrau" = the wife's father's cousin. The bare name has **no leading article** ("Cousin des Vaters", not "der Cousin des Vaters"), like the Greek output.
- **Genitive forms** (the library only needs these in descriptive names):
  - Masculine nouns take **-s/-es**: des Vaters, des Großvaters, des Urgroßvaters, des Bruders, des Halbbruders, des Sohnes (also Sohns), des Enkels, des Urenkels, des Onkels, des Großonkels, des Cousins, des Ehemanns (also Ehemannes), des Elternteils, des Schwagers, des Stiefvaters. Neuter: des Kindes, des Enkelkindes.
  - Weak masculine nouns take **-n/-en**: des **Neffen**, des Großneffen, des **Vorfahren** (D:Vorfahr), des **Nachkommen** (D:Nachkomme).
  - Feminine nouns don't change: der Mutter, der Großmutter, der Schwester, der Tochter, der Enkelin, der Tante, der Nichte, der Cousine, der Ehefrau, der Vorfahrin.
- **Cousin degree:** the standard pattern is **"Cousin/Cousine N. Grades"** (spelled out: "zweiten Grades"). This is a genitive attribute and **doesn't change with the sex of the person or with case**: "Cousin 2. Grades", "Cousine 2. Grades", "des Cousins 2. Grades", "der Cousine 2. Grades". So the unknown-sex form can be compact: "Cousin/Cousine 2. Grades". The adjective form "zweiter Cousin / zweite Cousine" is a calque of English, rare, and would need adjective endings (des zweiten Cousins): **don't use it**.
  - Spelled out: ersten, zweiten, dritten, vierten, fünften, sechsten, siebten, achten, neunten, zehnten, elften, zwölften… (all end in **-ten Grades**, with no gender or case agreement). As digits: "2. Grades", "11. Grades" (a digit plus a period = ordinal; no suffix like "2te"). Recommend **digits** throughout (RzD and WP-V write "Cousin 2. Grades"), which also avoids any spell-out limit.
  - A first cousin is just **"Cousin" / "Cousine"**; "Cousin 1. Grades" is only used in contrastive genealogical tables.
- **Adjective endings** (only "angeheiratet" is needed): with no article, nominative masculine **angeheirateter Onkel**, feminine **angeheiratete Tante** (Duden's own examples); genitive des angeheirateten Onkels / der angeheirateten Tante.
- **Ordinals in sentences:** "im 3. Grad" (dative; read "im dritten Grad"), "3. Grades" (genitive). Never put a sentence-final period right after a digit ordinal (it would read "3..").
- **Unknown sex:** for most terms, both full forms joined by "/", per the project rule. German has a natural neutral word only for: **Elternteil** (parent), **Kind** (child), **Enkelkind** (grandchild), **Urenkelkind** (great-grandchild), **Schwiegerkind**, **Stiefkind**, **Stiefelternteil**. ("Elternteil" is grammatically masculine but has no feminine form, so it is truly neutral: D:Elternteil "Teil eines Elternpaares".) Avoid the gender-star/colon forms ("Cousin*e", "Cousin:e"): they aren't in standard dictionaries and are politically marked.

---

## 1. Direct line, up

| Generations up | masculine | feminine | unknown (recommended) | source | conf. | notes |
|---|---|---|---|---|---|---|
| 1 parent | Vater | Mutter | **Elternteil** | D:Elternteil; WP-V | high | Genitive with unknown sex: "**eines Elternteils**" (indefinite; WP-V writes "Onkel, Tante eines Elternteils"). "des Elternteils" sounds odd because there are two. |
| 2 grandparent | Großvater | Großmutter | Großvater/Großmutter | WP-V | high | "Großelternteil" exists (WP-V: "eines Großelternteils") but is stiff as a standalone name. Use it only in the genitive: "eines Großelternteils". Opa/Oma are colloquial: don't use. |
| 3 great-grandparent | Urgroßvater | Urgroßmutter | Urgroßvater/Urgroßmutter | WP-V; RzD | high | |
| 4 great-great- | Ururgroßvater | Ururgroßmutter | Ururgroßvater/Ururgroßmutter | WP-V; RzD; WP-Ahn | high | |
| 5 (3rd great-) | Urururgroßvater | Urururgroßmutter | Urururgroßvater/Urururgroßmutter | WP-V ("Ururur…großeltern, und so weiter"); RzD | high | Written as one word, with no hyphens. |
| 6+ | see below | | | | low | |

**Pattern:** one **Ur-** per extra generation, with no limit in principle (WP-V: Ur- is set before Groß- "auch mehrfach, um jeweils eine weitere Generation zurück zu rechnen"; WP-V lists up to "Ururururenkel"). From about 4 Ur-'s it can't be read at a glance ("Ururururgroßvater").
**Recommended switch:** after generation 5 (the same point as the Greek locale), switch to a numbered form. The options are:
- (a) **"Vorfahr 6. Grades" / "Vorfahrin 6. Grades"** (genitive: des Vorfahren / der Vorfahrin 6. Grades). This is unambiguous, because in the direct line the legal degree equals the number of generations (BGB1589: "Zahl der sie vermittelnden Geburten"). The catch is that "Grad" means something else in "Cousin 2. Grades". **Recommended, but low confidence.**
- (b) "Vorfahr in der 6. Generation": **ambiguous**. German Ahnentafeln count the proband as generation I and the parents as II (WP-AT), so "6. Generation" can mean 5 or 6 generations up. **Avoid.**
- (c) "fünffacher Urgroßvater": a calque of "5th great-grandfather". It is unclear whether it counts Ur-'s or greats. **Avoid.**
- Archaic genealogy terms (Alteltern, Obereltern, Stammeltern…) and "Ahn/Ahne" (gehoben; also archaic for "Großvater/Großmutter", WP-Ahn) shouldn't be used.

## 2. Direct line, down

| Generations down | masculine | feminine | unknown (recommended) | source | conf. | notes |
|---|---|---|---|---|---|---|
| 1 child | Sohn | Tochter | **Kind** | WP-V | high | Genitive des Sohnes / der Tochter / des Kindes. |
| 2 grandchild | Enkel | Enkelin | **Enkelkind** | WP-V ("Enkelkinder"; Enkel "kann als generische Maskulinform gebraucht werden") | high | Swiss: "Grosskind" (WP-V). |
| 3 great-grandchild | Urenkel | Urenkelin | **Urenkelkind** | WP-V ("Urenkelkinder") | high | |
| 4 great-great- | Ururenkel | Ururenkelin | Ururenkel/Ururenkelin | WP-V | high | "Ururenkelkind" is rare, so use the slash form. |
| 5 | Urururenkel | Urururenkelin | Urururenkel/Urururenkelin | WP-V | high | |
| 6+ | Nachkomme 6. Grades | Nachkommin 6. Grades | Nachkomme/Nachkommin 6. Grades | D:Nachkomme (lists "Nachkommin"); BGB1589 | low | Same reasoning as §1. "Nachkommin" is rare and many writers use "Nachkomme" for women too. A native speaker should check (alternative: Nachfahre/Nachfahrin). Genitive des Nachkommen / der Nachkommin. |

## 3. Siblings

| Term | masculine | feminine | unknown (recommended) | source | conf. | notes |
|---|---|---|---|---|---|---|
| sibling | Bruder | Schwester | **Bruder/Schwester** | D:Geschwister | high | The singular "das Geschwister" is labelled *fachsprachlich*, and otherwise Swiss (D:Geschwister sense 2); in everyday German, "Geschwister" is plural only. "Geschwisterteil" is understood but stiff. Genitive des Bruders / der Schwester. |
| half-sibling | Halbbruder | Halbschwester | **Halbbruder/Halbschwester** | WP-V; D:Halbbruder | high | German doesn't distinguish paternal and maternal half-siblings in everyday use (the legal term "halbbürtig", BGB1307, covers both). **Risk:** Duden treats "Stiefbruder" as a colloquial synonym of Halbbruder (D:Stiefbruder sense 1), and lists "Halbgeschwister" as plural-only = "Stiefgeschwister". "Halbbruder" itself is unambiguous, so never output "Stief-" for half-siblings. |

## 4. Uncle/aunt, nephew/niece

| Relation | masculine | feminine | unknown | source | conf. | notes |
|---|---|---|---|---|---|---|
| parent's sibling | Onkel | Tante | Onkel/Tante | WP-V | high | Archaic: Oheim, Ohm, Vetter (father's brother), Base, Muhme (RzD §7), so don't use them. Genitive des Onkels / der Tante. |
| grandparent's sibling | Großonkel | Großtante | Großonkel/Großtante | WP-V ("Bruder, Schwester von Großmutter oder Großvater") | high | |
| great-grandparent's sibling | Urgroßonkel | Urgroßtante | Urgroßonkel/Urgroßtante | WP-V | medium | Understood, but less common. |
| further up | → descriptive: "Bruder des Ururgroßvaters", "Schwester der Ururgroßmutter" | | "Bruder/Schwester des Ururgroßvaters" | (pattern, §5) | medium | "Ururgroßonkel" follows the Ur- rule but is rare. The descriptive form is safer and matches the Greek locale. |
| sibling's child | Neffe | Nichte | Neffe/Nichte | WP-V | high | Genitive **des Neffen** (weak noun) / der Nichte. |
| sibling's grandchild | Großneffe | Großnichte | Großneffe/Großnichte | WP-V ("Die Kinder von Neffen oder Nichten sind Großneffen und Großnichten") | high | Genitive des Großneffen. |
| sibling's great-grandchild | Urgroßneffe | Urgroßnichte | Urgroßneffe/Urgroßnichte | WP-V ("deren Kinder Urgroßneffen und Urgroßnichten") | medium | |
| further down | → descriptive: "Ururenkel des Bruders", "Ururenkelin der Schwester" | | | (pattern, §5) | medium | |

## 5. Cousins

### Same generation

| Common ancestor | masculine | feminine | unknown | source | conf. | notes |
|---|---|---|---|---|---|---|
| grandparents (first) | Cousin | Cousine | Cousin/Cousine | D:Cousin, D:Cousine | high | Vetter = Cousin (D:Vetter sense 1, no label, but dated in feel); Base is "süddeutsch, sonst veraltet" (D:Cousine); Geschwisterkind is "landschaftlich, sonst veraltet" (D:Cousin). Don't use these. Genitive des Cousins / der Cousine. |
| great-grandparents (second) | Cousin 2. Grades | Cousine 2. Grades | Cousin/Cousine 2. Grades | WP-V ("Cousins, Cousinen 2. Grades = … Enkelkinder von Geschwistern der Großeltern"); RzD | high | Spelled out: "zweiten Grades". |
| (third…tenth) | Cousin 3. Grades … Cousin 10. Grades | Cousine 3. Grades … | Cousin/Cousine N. Grades | RzD table ("Cousins/Cousinen k. Grades … Ur(k-1)großeltern") | high | |
| 11+ | Cousin 11. Grades … | Cousine 11. Grades … | same | (pattern) | high | No change in form. |

**Avoid "Großcousin/Großcousine".** Sources disagree on what it means: Duden (per secondary sources; the entry wasn't directly fetchable) gives second cousin, Wiktionary gives a parent's cousin (regional), and the colloquial pages in POP report use for the parent's cousin and the cousin's child. WP-V also flags "Kleincousin" as wrong.

### Removed cousins: competing conventions → use the descriptive pattern

German has **no "removed"**. There are two documented systems, and neither is safe for general readers:
1. **Genealogical "N. Grades" extension of Onkel/Neffe** (WP-V and RzD): Onkel/Tante 2. Grades = parent's first cousin; Neffe/Nichte 2. Grades = first cousin's child; Großonkel/Großtante 2. Grades = grandparent's first cousin; Großneffe 2. Grades = first cousin's grandchild; generally *Onkel k. Grades* = parent of a *Cousin k. Grades*. RzD itself notes: "Hier gibt es aber keinen klaren Konsens, sodass man abweichende Nummerierungen findet."
2. **Colloquial usage:** "Cousin 2. Grades" and "Großcousin" are widely (mis)used for a parent's cousin or a cousin's child (POP). So a reader may take "Onkel 2. Grades" or "Cousin 2. Grades" to mean something else.

(RzD also has "Cousin 1. Grades, eine Generation verschoben", a technical paraphrase only.)

**Recommended: name through the person of the other's generation**, as the Greek locale does: `<relative of the same generation as one person> <genitive of the other person's ancestor or descendant>`.
- If the named person is in an **older** generation: `[cousin/sibling term of the named person's sex] + [genitive of the viewer's ancestor, |up−down| generations up, by that ancestor's sex]`.
- If the named person is in a **younger** generation: `[descendant term, |up−down| generations, of the named person's sex] + [genitive of the viewer's sibling/cousin, by that person's sex]`.

| Example | masculine | feminine | unknown (named person) | unknown (intermediate person) | conf. |
|---|---|---|---|---|---|
| parent's first cousin (up 3, down 2) | Cousin des Vaters / Cousin der Mutter | Cousine des Vaters / Cousine der Mutter | Cousin/Cousine der Mutter | Cousin eines Elternteils | high (grammar and naturalness) |
| first cousin's child (up 2, down 3) | Sohn des Cousins / Sohn der Cousine | Tochter des Cousins / Tochter der Cousine | Kind des Cousins | Sohn des Cousins/der Cousine | high |
| grandparent's second cousin (up 5, down 3) | Cousin 2. Grades des Großvaters | Cousine 2. Grades der Großmutter | Cousin/Cousine 2. Grades der Großmutter | Cousin 2. Grades eines Großelternteils (or: des Großvaters/der Großmutter) | high |
| more: grandparent's brother (if not using Großonkel) | Bruder der Großmutter | Schwester des Großvaters | Bruder/Schwester des Großvaters | | high |
| more: first cousin's grandchild (up 2, down 4) | Enkel des Cousins | Enkelin der Cousine | Enkelkind des Cousins | | high |

**Unknown sex, both people:** compose the slash forms independently: "Cousin/Cousine des Vaters/der Mutter". This is grammatical but heavy. Consider "eines Elternteils" / "eines Großelternteils" for the unknown ancestor (as in WP-V). Note: the Greek code's `of` (genitive) mode maps directly onto the German genitive.

## 6. Named relations by marriage

| Relation | masculine | feminine | unknown | source | conf. | notes |
|---|---|---|---|---|---|---|
| spouse | Ehemann | Ehefrau | **Ehemann/Ehefrau** (alt.: Ehepartner) | D:Ehepartner | high (m/f); medium (unknown) | "Ehepartner" is the usual word on forms, but it is a generic masculine (Duden notes it is "nicht immer eindeutig"). "Ehegatte" is legal (BGB) and stiff. "Mann/Frau" is colloquial ("die Frau meines Cousins"), fine but less precise. Genitive des Ehemanns / der Ehefrau. |
| parent-in-law | Schwiegervater | Schwiegermutter | Schwiegervater/Schwiegermutter | WP-V (Schwieger- section) | high | "Schwiegerelternteil" exists but is stiff. Archaic: Schwäher. |
| child-in-law | Schwiegersohn | Schwiegertochter | **Schwiegerkind** | D:Schwiegerkind ("meist im Plural") | high | Archaic: Eidam, Schnur. |
| sibling-in-law (both spouse's sibling **and** sibling's spouse) | Schwager | Schwägerin | Schwager/Schwägerin | D:Schwager ("Ehemann einer Schwester oder eines Bruders; Bruder des Ehemanns oder der Ehefrau"); WP-V | high | The same word covers both, as the library expects. |
| co-parent-in-law (child's spouse's parent) | Gegenschwiegervater | Gegenschwiegermutter | Gegenschwiegervater/Gegenschwiegermutter | D:Gegenschwiegervater, D:Gegenschwiegermutter (both **"landschaftlich"**); WP-V ("Gegenschwieger(eltern)") | medium | Regional and not known to every reader. **Descriptive alternative** (always understood): "Schwiegervater des Sohnes / der Tochter / des Kindes", where the child's sex is `sexes[1]`; this mirrors English "child's father-in-law". Recommend the descriptive form unless a native speaker says Gegenschwieger- is widely known. |
| co-sibling-in-law (men married to sisters / women married to brothers) | Schwippschwager | Schwippschwägerin | Schwippschwager/Schwippschwägerin | D:Schwippschwager ("umgangssprachlich"); WKT-Schw sense 2 ("Ehemann eines Geschwisters des eigenen Ehepartners") | medium | Colloquial label, but it is the only word. Many speakers just say "Schwager". The German word also covers mixed-sex pairs and the sibling's spouse's sibling, which the library doesn't name (it returns null). Austria: "Schwiegerschwager" (WP-V). |
| uncle/aunt by marriage (aunt's husband; spouse's uncle) | angeheirateter Onkel | angeheiratete Tante | angeheirateter Onkel/angeheiratete Tante | D:angeheiratet (examples "ein angeheirateter Onkel", "eine angeheiratete Tante") | high for aunt's husband; **medium for spouse's uncle** | "angeheiratet" = "durch Heirat Mitglied einer Familie geworden". That fits the aunt's husband exactly. For the spouse's uncle it is the *viewer* who married in; speakers do say "angeheirateter Onkel" or just "Onkel" (WP-V: children of Schwäger "werden allgemein ebenfalls als Neffen und Nichten bezeichnet"), but a careful speaker might prefer "Onkel des Ehemanns". The alternative word order "Onkel (angeheiratet)" mirrors Greek «θείος (από γάμο)» and keeps the noun first. |
| nephew/niece by marriage (nephew's wife; spouse's nephew) | angeheirateter Neffe | angeheiratete Nichte | angeheirateter Neffe/angeheiratete Nichte | D:angeheiratet; WP-V | medium | Same caveat. Genitive des angeheirateten Neffen. |
| step-parent | Stiefvater | Stiefmutter | **Stiefelternteil** | WP-V ("Stiefeltern … Pluralform von Stiefelternteil") | high | |
| step-child | Stiefsohn | Stieftochter | **Stiefkind** | WP-V (Stief- compounds) | high | |

## 7. Composed relations by marriage (no word of their own)

**Spouse of a blood relative:** `[Ehemann|Ehefrau] + [genitive of the relative, by the relative's sex]`. The spouse's sex picks the head noun, and the relative's sex picks the article and noun.
- "**Ehefrau des Cousins**" (wife of a male first cousin); "**Ehemann der Cousine 2. Grades**".
- Nested: "**Ehefrau des Cousins des Vaters**" (wife of the father's cousin); "Ehemann der Enkelin des Bruders".
- Unknown spouse sex: "Ehemann/Ehefrau des Cousins". Unknown relative sex: "Ehefrau des Cousins/der Cousine".

**Blood relative of one's spouse:** `[relative's name, by its own sex] + [des Ehemanns | der Ehefrau]`. The spouse's sex (`sexes[1]`) shows up only in the final genitive.
- "**Cousin der Ehefrau**", "**Cousine des Ehemanns**".
- Nested: "**Cousin des Vaters der Ehefrau**" (the wife's father's cousin); "Tochter des Cousins des Ehemanns".
- Unknown spouse sex: "Cousin des Ehemanns/der Ehefrau".

Confidence: high (grammar); medium (that "Ehefrau/Ehemann" reads better than the colloquial "Frau/Mann" here).

## 8. Chain step words

| Move | male | female | unknown | conf. |
|---|---|---|---|---|
| up (parent) | Vater | Mutter | Elternteil | high |
| down (child) | Sohn | Tochter | Kind | high |
| spouse | Ehemann | Ehefrau | Ehemann/Ehefrau (or Ehepartner, see §6) | high / medium |

## 9. Sentences

**Legal source:** BGB §§ 1589–1590 (Germany), checked against gesetze-im-internet.de.
- § 1589 (1): "Personen, deren eine von der anderen abstammt, sind in **gerader Linie** verwandt. Personen, die nicht in gerader Linie verwandt sind, aber von derselben dritten Person abstammen, sind in der **Seitenlinie** verwandt. Der **Grad** der Verwandtschaft bestimmt sich nach der Zahl der sie vermittelnden Geburten." (Abs. 2 is repealed.)
- § 1590 (1): "Die Verwandten eines Ehegatten sind mit dem anderen Ehegatten **verschwägert**. Die Linie und der Grad der **Schwägerschaft** bestimmen sich nach der Linie und dem Grade der sie vermittelnden Verwandtschaft." (2): Schwägerschaft continues after the marriage is dissolved.
- Statutory phrasing to copy: § 41 Nr. 3 ZPO, "in der Seitenlinie bis zum dritten Grad verwandt oder bis zum zweiten Grad verschwägert".
- Switzerland: ZGB Art. 20 (Verwandtschaft; same "Zahl der sie vermittelnden Geburten") and Art. 21 (Schwägerschaft), confirmed via search snippets only (https://lawbrary.ch/law/art/ZGB-v2022.07-en-art-20): medium. Austria (ABGB): not verified.
- The project's rules agree with the BGB: affinity applies only one marriage away; spouses aren't verschwägert with each other (WP-V: "Die Eheschließung begründet keinerlei Verwandtschaft oder Schwägerschaft zwischen den Ehegatten"); and there is no affinity across two marriages.

| Sentence | String (placeholders) | conf. | notes |
|---|---|---|---|
| blood, direct | `Verwandt in gerader Linie im {n}. Grad` | high | e.g. "Verwandt in gerader Linie im 2. Grad". |
| blood, collateral | `Verwandt in der Seitenlinie im {n}. Grad` | high | Legally, "verwandt" means blood only. For lay clarity: `Blutsverwandt in der Seitenlinie im {n}. Grad` (medium). |
| affinity, direct | `Verschwägert in gerader Linie im {n}. Grad` | high | |
| affinity, collateral | `Verschwägert in der Seitenlinie im {n}. Grad` | high | Matches the brief's example. Noun-style alternative mirroring Greek: `Schwägerschaft in der Seitenlinie, {n}. Grad` / `Verwandtschaft in der Seitenlinie, {n}. Grad`. |
| ordinal | `{n}.` (digit + period), read "im dritten Grad" | high | Spelled-out alternative: ersten, zweiten, dritten… Grad (dative after "im"). |
| through marriages (1) | `Verbunden über die Ehe von {A} und {B}.` | medium | Not "verwandt" (blood in the BGB) and not "verschwägert" (no legal affinity across several marriages). The English "related through" has no exact neutral German verb, so "verbunden" is my choice and a native speaker should check it. |
| through marriages (n) | `Verbunden über die Ehen von {A} und {B}; {C} und {D}.` | medium | |
| common ancestor (1) | `Gemeinsamer Vorfahr: {A}` | medium | The API passes names only, so a single woman gets a generic masculine. Correct would be `Gemeinsame Vorfahrin: {A}` (D:Vorfahrin). |
| common ancestors (2+) | `Gemeinsame Vorfahren: {A} und {B}` | high | 3+ names: German prefers "{A}, {B} und {C}". |

**Watch out:** the two "Grad" systems collide. A second cousin is "Cousin 2. Grades" but legally "in der Seitenlinie im 6. Grad verwandt" (RzD: "Der 2. Grad bezieht sich nicht auf den juristischen Verwandtschaftsgrad"). Both strings can appear on the same screen. A first cousin is legally 4th degree.

## 10. Open questions / risks (ranked)

1. **Removed cousins and the word "Grad".** I recommend descriptive names ("Cousin des Vaters", "Sohn der Cousine") over the genealogical "Onkel/Tante 2. Grades" and "Neffe/Nichte 2. Grades" system (WP-V and RzD, with "kein klarer Konsens"), and avoiding "Großcousin" (contradictory definitions). A native speaker should confirm that "Cousin 2. Grades" reads as *second cousin* (same generation) to general readers, since colloquially it's also used for removed cousins. They should also check whether showing it next to the legal "im 6. Grad" confuses.
2. **Distant ancestors and descendants beyond Urururgroß-/Urururenkel.** "Vorfahr/Nachkomme N. Grades" is my proposal (unambiguous through § 1589) but not attested as a set phrase. "N. Generation" is ambiguous (Ahnentafel counts the proband as I), and "n-facher Urgroßvater" is ambiguous. "Nachkommin" is rare. This needs a decision.
3. **Regional or colloquial words for named marriage relations.** Gegenschwiegervater/-mutter is "landschaftlich" (I recommend the descriptive "Schwiegervater des Sohnes/der Tochter"). Schwippschwager is "umgangssprachlich" (but the only word). "angeheirateter Onkel" fits the aunt's husband better than the spouse's uncle.
4. **Unknown-sex spouse:** "Ehemann/Ehefrau" (project rule) vs. "Ehepartner" (natural on forms, but a generic masculine). Also "Großvater/Großmutter" vs. "Großelternteil" for an unknown-sex grandparent.
5. **`commonAncestors` with one woman:** the API carries no sex, so "Gemeinsamer Vorfahr: {Anna}" is a generic masculine. Consider passing sexes, or use a sex-free heading.
6. **"Verbunden über die Ehe(n) von …"** is my own wording, so its naturalness needs checking.
7. **de-CH / de-AT:** Swiss spelling writes **ss for ß** in every term (Grossvater, Grossonkel, Urgrossmutter, Grosskind for Enkel). Austria: Schwiegerschwager for Schwippschwager. One "de" locale may not suit Swiss users. Check whether this should be `de-CH` handling.
8. **Half vs. step:** Duden lists Stiefbruder as a colloquial synonym of Halbbruder. The library should only ever output "Halb-" for half-siblings (done above). Mention it in the docs, because users may expect "Stief-".
