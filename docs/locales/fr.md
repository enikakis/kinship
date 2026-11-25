# French (fr)

**Experimental.** The terms below come from the sources in the research that follows; they await a
native speaker's review. The "Rulings" and "Calls made while implementing" sections are what
`src/locales/fr.ts` implements; where the rulings and the research disagree, the rulings win. The
research's open questions (§10) stay as the list for reviewers.

## Rulings

These are the project's cross-language rulings as they apply to French.

1. **Other-generation relatives beyond the standard words** are named through the person of the
   other's generation, as in Greek: «cousin germain du père», «fils de la cousine germaine»,
   «cousin issu de germain du grand-père», «frère de l'arrière-arrière-grand-père»,
   «arrière-arrière-petit-fils du frère». The standard words are kept where they exist: oncle,
   grand-oncle, arrière-grand-oncle; neveu, petit-neveu, arrière-petit-neveu (and the feminines).
   Never «oncle / neveu à la mode de Bretagne», «grand-cousin», «petit-cousin».
2. **Cousins of the same generation:** «cousin germain / cousine germaine» (1st), «cousin issu de
   germain / cousine issue de germain» (2nd), then «cousin / cousine au troisième degré» …
   «au dixième degré», then «au 11e degré»: the dictionary sense, equal to the English Nth cousin.
3. **Direct line beyond the named words:** the named words go up to «arrière-arrière-grand-père /
   arrière-arrière-grand-mère» and down to «arrière-arrière-petit-fils / arrière-arrière-petite-fille»
   (4 generations); from 5 generations on, «ascendant / ascendante au 5e degré» and «descendant /
   descendante au 5e degré» (the civil degree in the direct line equals the number of generations).
4. **Unknown sex:** both full forms joined by "/" («frère/sœur», «grand-père/grand-mère»,
   «cousin germain/cousine germaine», «cousin/cousine au troisième degré», in the genitive «du
   cousin germain/de la cousine germaine»), except for the neutral words **parent**, **enfant**,
   **conjoint**. «parent» is used only on its own, never inside a longer name, where it would read
   as "a relative": «cousin germain du père/de la mère». The singular «grand-parent»,
   «petit-enfant», «beau-parent» are not used. Spouse words when the sex is known: **époux /
   épouse** (not mari / femme), in names and in chain steps alike.
5. **Named relations by marriage with no standard word** use a descriptive form:
   - co-parent-in-law (one's child's spouse's parent): «père de l'épouse du fils», «mère de l'époux
     de la fille», by the sexes of one's child and the child's spouse; with an unknown sex, both
     forms, never «parent» at the head («père/mère du conjoint de l'enfant», «père/mère de
     l'épouse du fils»);
   - co-sibling-in-law (men married to sisters, women married to brothers): «époux de la
     belle-sœur», «épouse du beau-frère» (the research's TLFi sense «Époux de la belle-sœur»).

   beau-père / belle-mère / beau-fils / belle-fille are used in both their senses, in-law and step,
   as French speakers do: parent-in-law and step-parent «beau-père / belle-mère»; child-in-law
   «gendre / belle-fille»; step-child «beau-fils / belle-fille»; sibling-in-law «beau-frère /
   belle-sœur»; «oncle / tante par alliance», «neveu / nièce par alliance».
6. **Composed relations by marriage** use the precise descriptive form, mirroring English: «épouse
   d'un cousin germain», «époux d'une cousine germaine du père» (spouse of a relative, with the
   indefinite article); «cousin germain de l'époux», «fils du cousin germain de l'épouse»,
   «petit-fils/petite-fille du conjoint» (relative of one's spouse).
8. **Sentences:** «Ancêtre commun : A» / «Ancêtres communs : A et B» («A, B et C» for three or
   more), always in the generic masculine; «Liés par le mariage de A et B.» / «Liés par les mariages
   de A et B ; C et D.»; the legal degree «Parenté par le sang / par alliance en ligne directe /
   collatérale, au 1er / 2e / 3e degré». French typography: a no-break space (U+00A0) before «:»
   and «;», pinned in the tests.
9. **Experimental:** `src/locales/fr.ts` starts with a doc comment saying so, pointing here.

(Ruling 7 is for Spanish only.)

**Erratum to the research below (§5):** its example «arrière-petite-fille du cousin issu de germain»
is the case (3,6); (3,5) is «petite-fille du cousin issu de germain».

## Calls made while implementing

Choices the rulings leave open; the research or the nearest ruling decided them.

1. **Neutral words for an unknown sex:** only parent, enfant, conjoint. The research's singular
   «grand-parent», «petit-enfant», «arrière-grand-parent», «beau-parent» are not used: they become
   «grand-père/grand-mère», «petit-fils/petite-fille», «beau-père/belle-mère».
2. **«parent» only on its own.** Inside a longer name the unknown parent is «du père/de la mère».
   Neutral words take the masculine article: «de l'enfant», «d'un enfant», «du conjoint».
3. **Co-sibling-in-law:** «époux de la belle-sœur» / «épouse du beau-frère» (the TLFi sense). The
   research's own table cell says plain «beau-frère / belle-sœur», which a reviewer may prefer.
4. **Co-parent-in-law of unknown sex:** «père/mère du conjoint de l'enfant»; mixed cases follow
   the same pattern («père/mère de l'épouse du fils»), as ruling 5 says.
5. **Unknown sex with an invariable tail:** «cousin/cousine au quatrième degré», «ascendant/
   ascendante au 5e degré»; in the genitive «du cousin/de la cousine au troisième degré».
6. **Indefinite article with unknown sex:** «époux d'un cousin germain/d'une cousine germaine».
7. **Three or more common ancestors:** «A, B et C» (research §9).
8. **Cousins** from the 5th to the 10th in words as the research's pattern says; from the 11th, in
   figures («au 11e degré»).
9. **Uncles past arrière-grand-oncle** (up ≥ 5) and **nephews past arrière-petit-neveu** (down ≥ 5)
   are named through the person of the other's generation, as the research's "beyond" rows do.

## For native reviewers

The research's open questions (§10, below) are the list. Particular points: the co-sibling-in-law
form (call 3), and the erratum above.

---

# French (fr) kinship vocabulary — research for `@enikakis99/kinship`

Scope: metropolitan standard French. Québec usage noted where the OQLF is the source. Every term has a source. Confidence means how sure I am that the term is right *and* that a general reader understands it. No native-speaker review yet (see §10).

## Sources (short keys used in tables)

| Key | Source |
|---|---|
| TLFi:x | CNRTL / Trésor de la langue française informatisé, `https://www.cnrtl.fr/definition/x` (entries checked: cousin, beau-frère, beau-père, belle-fille, beau-fils, bru, marâtre, demi-frère, grand-oncle, oncle, neveu) |
| LAR:x | Larousse, `https://www.larousse.fr/dictionnaires/francais/x` (checked: cousin, bru, petit-neveu, arrière-petit-neveu, arrière-grand-oncle, arrière-grand-père) |
| AF9:cousin | Dictionnaire de l'Académie française, 9th ed., «cousin» `https://dictionnaire-academie.fr/article/A9C4682` |
| WP:Cousinage | `https://fr.wikipedia.org/wiki/Cousinage` |
| OQLF:aïeul | `https://vitrinelinguistique.oqlf.gouv.qc.ca/23917/...sens-de-aieuls-et-aieux` |
| OQLF:beaux-parents | `https://vitrinelinguistique.oqlf.gouv.qc.ca/fiche-gdt/fiche/26559098/beaux-parents` |
| OQLF:grand-parent | `https://vitrinelinguistique.oqlf.gouv.qc.ca/fiche-gdt/fiche/8361691/grand-parent` |
| OQLF:quasi-frère | `https://vitrinelinguistique.oqlf.gouv.qc.ca/fiche-gdt/fiche/18075329/quasi-frere` |
| OQLF:ordinal | `https://vitrinelinguistique.oqlf.gouv.qc.ca/24271/...abreviation-de-ladjectif-numeral-ordinal` |
| LAR-ES:consuegro | Larousse español-francés, `https://www.larousse.fr/dictionnaires/espagnol-francais/consuegro/175759` («mis consuegros: les beaux-parents de mon fils/ma fille») |
| CC 741–745 | Code civil, Livre III, Titre I, Ch. III, Section 1, Paragraphe 2 «Des degrés» (arts. 741–745), `https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006070721/LEGISCTA000006165763`; art. 743: `.../codes/article_lc/LEGIARTI000020616255` |
| CC1804 | Original 1804 text (arts. 735–738, same wording, renumbered 741–743 by loi 2001-1135): `https://fr.wikisource.org/wiki/Code_civil_des_Français_1804/Livre_III,_Titre_I` |
| SGQ | Société généalogique de Québec, aide-mémoire 2025, `https://sgq.qc.ca/client_file/upload/L-Ancetre/Protocole-et-aide/2025_Aide_memoire_LAncetre_mars-2025-final.pdf` |
| Sosa | Generation numbering: Heredis `https://help.heredis.com/wp-content/uploads/kalins-pdf/singles/numerotation-genealogique.pdf`; Geneawiki «Numérotation» |
| GW:degrés | Geneawiki «Degrés de parenté» `https://fr.geneawiki.com/wiki/Degrés_de_parenté` (civil vs canon counting; seen via search snippet, page 403 to fetch) |

## 0. Grammar the locale needs (applies to every section)

- **Unknown sex.** French has natural neutral words only for *parent*, *enfant*, *grand-parent*, *petit-enfant*, *arrière-grand-parent*, *arrière-petit-enfant*, *conjoint*, *ancêtre* (epicene). Everything else uses the project rule `masc/fém`: «frère/sœur», «oncle/tante», «cousin germain/cousine germaine». (French «adelphe» for "sibling" is a recent neologism; «germain» is legal-only; «fratrie» is collective. Don't use them.)
- **"of" (genitive) = de + definite article**, contracted and elided:
  - masculine, consonant: **du** (du père, du cousin germain, du petit-fils)
  - feminine, consonant: **de la** (de la mère, de la cousine germaine, de la petite-fille)
  - any sex, vowel-initial: **de l'** (de l'oncle, de l'arrière-grand-père, de l'arrière-petite-fille, de l'enfant, de l'épouse, de l'époux, de l'ancêtre). Every *arrière-* word elides: the locale must test the first letter, not the sex.
  - unknown sex: both full genitives joined by "/": «du cousin germain/de la cousine germaine», «du père/de la mère». Prefer «du père/de la mère» over «du parent» (*parent* also means "a relative").
- **The head noun takes no article** in a name: «cousin germain du père» (cf. Greek «πρώτος εξάδελφος του πατέρα», English "father's first cousin"). Chains nest left-to-right: «fils de la cousine germaine du père».
- **Agreement inside cousin terms:** «cousin germain / cousine germaine»; «cousin issu de germain / cousine issue de germain» (*issu* agrees; *germain* there is a noun and doesn't); «cousin / cousine au troisième degré» (the ordinal qualifies *degré* → invariable).
- **Hyphens** are part of the words: grand-père, petit-fils, arrière-grand-mère, arrière-arrière-grand-père, petite-fille ("granddaughter"; without hyphen «petite fille» = "little girl").
- **Ordinals in figures:** 1er (premier), 2e, 3e, 11e — never «2ème», «3ème» (OQLF:ordinal; Académie «Dire, ne pas dire» gives 1er/1re, 2d/2de or 2e, then 3e…). In running text, spell out up to *dixième* where the pattern below says so.
- **Typography:** French puts a no-break space before «:» and «;» (U+00A0, or U+202F narrow). Tests should pin which one.

## 1. Direct line, up

| Term | masculine | feminine | unknown | source | conf. | notes |
|---|---|---|---|---|---|---|
| parent | père | mère | parent | TLFi, everyday | high | *parent* also = "relative"; OK as a standalone name, avoid it inside genitives («du père/de la mère») |
| grandparent | grand-père | grand-mère | grand-parent | LAR:grand-père; OQLF:grand-parent | high (m/f); medium (unknown) | singular *grand-parent* is attested (OQLF: official/legal usage) but less common than the plural; fallback «grand-père/grand-mère» |
| great-grandparent | arrière-grand-père | arrière-grand-mère | arrière-grand-parent | LAR:arrière-grand-père; AF9; Wiktionary «arrière-grand-parent» | high / medium | literary/legal synonym *bisaïeul(e)* — don't use (OQLF:aïeul) |
| great-great-grandparent | arrière-arrière-grand-père | arrière-arrière-grand-mère | arrière-arrière-grand-parent | SGQ; Wiktionary «arrière-arrière-grand-mère»; WP genealogy tables | high (m/f); medium (unknown) | = *trisaïeul(e)* (rare; one glossary even shifts it by a generation — avoid) |
| 3rd great-grandparent (up = 5) | arrière-arrière-arrière-grand-père | …-grand-mère | — | attested in genealogy tables (= *quadrisaïeul*) | medium | correct but unwieldy; see pattern below |
| **pattern up ≥ 5** | ascendant au 5e degré | ascendante au 5e degré | ascendant/ascendante au 5e degré | CC 743 ("en ligne directe, on compte autant de degrés qu'il y a de générations") | medium | **Recommended switch: words through up = 4, then «ascendant au Ne degré»** (N = up). It is unambiguous because the direct-line civil degree = number of generations. Do **not** use «ancêtre à la Ne génération»: in French genealogy (Sosa numbering) the person is generation 1, parents generation 2, so "6e génération" means up = 5 for some readers and up = 6 for others (Sosa). Alternative wording: «ancêtre au 5e degré» (ancêtre is epicene, so unknown sex = same word) — less legal, also fine. |

Genitive: du père / de la mère; du grand-père / de la grand-mère; de l'arrière-grand-père / de l'arrière-grand-mère; de l'arrière-arrière-grand-père…; de l'ascendant / de l'ascendante au 5e degré.

## 2. Direct line, down

| Term | masculine | feminine | unknown | source | conf. | notes |
|---|---|---|---|---|---|---|
| child | fils | fille | enfant | TLFi, everyday | high | *fils* same in genitive: «du fils» |
| grandchild | petit-fils | petite-fille | petit-enfant | LAR, everyday | high / medium | singular *petit-enfant* is used but the plural dominates |
| great-grandchild | arrière-petit-fils | arrière-petite-fille | arrière-petit-enfant | LAR | high / medium | |
| great-great-grandchild | arrière-arrière-petit-fils | arrière-arrière-petite-fille | arrière-arrière-petit-enfant | analogous to §1; genealogy usage | medium | |
| **pattern down ≥ 5** | descendant au 5e degré | descendante au 5e degré | descendant/descendante au 5e degré | CC 743 | medium | same reasoning as §1 |

Genitive: du fils / de la fille / de l'enfant; du petit-fils / de la petite-fille / du petit-enfant; de l'arrière-petit-fils / de l'arrière-petite-fille / de l'arrière-petit-enfant.

## 3. Siblings

| Term | masculine | feminine | unknown | source | conf. | notes |
|---|---|---|---|---|---|---|
| sibling | frère | sœur | frère/sœur | everyday | high | write «sœur» with the œ ligature, not "soeur" |
| half-sibling | demi-frère | demi-sœur | demi-frère/demi-sœur | TLFi:demi-frère («Frère par le père ou la mère seulement») | high | paternal/maternal: *frère consanguin* / *frère utérin* (legal) — not needed. Colloquially *demi-frère* is misused for a step-sibling; the correct term for that is *quasi-frère* (OQLF:quasi-frère). Our usage (shared one parent) is the correct one. |

## 4. Uncles/aunts, nephews/nieces

| Term (up, down) | masculine | feminine | unknown | source | conf. | notes |
|---|---|---|---|---|---|---|
| uncle/aunt (2,1) | oncle | tante | oncle/tante | TLFi:oncle | high | |
| great-uncle (3,1) | grand-oncle | grand-tante | grand-oncle/grand-tante | TLFi:grand-oncle («Frère du grand-père ou de la grand-mère») | high | |
| great-great-uncle (4,1) | arrière-grand-oncle | arrière-grand-tante | arrière-grand-oncle/arrière-grand-tante | LAR:arrière-grand-oncle («Frère de l'arrière-grand-père ou de l'arrière-grand-mère») | high (m); medium (f, listed but not defined on the page) | |
| beyond (up ≥ 5, down 1) | frère de l'arrière-arrière-grand-père | sœur de l'arrière-arrière-grand-mère | … | descriptive pattern (§5) | medium | named through the person of the other's generation, as in Greek |
| nephew/niece (1,2) | neveu | nièce | neveu/nièce | TLFi:neveu | high | |
| great-nephew (1,3) | petit-neveu | petite-nièce | petit-neveu/petite-nièce | LAR:petit-neveu («Fils, fille du neveu ou de la nièce») | high | *arrière-neveu* is an older synonym — don't use |
| great-great-nephew (1,4) | arrière-petit-neveu | arrière-petite-nièce | arrière-petit-neveu/arrière-petite-nièce | LAR:arrière-petit-neveu | high | |
| beyond (up 1, down ≥ 5) | arrière-arrière-petit-fils du frère | arrière-arrière-petite-fille de la sœur | … | descriptive | medium | |

Genitive: de l'oncle / de la tante; du grand-oncle / de la grand-tante; de l'arrière-grand-oncle / de l'arrière-grand-tante; du neveu / de la nièce; du petit-neveu / de la petite-nièce; de l'arrière-petit-neveu / de l'arrière-petite-nièce.

Note: the uncle prefix is **grand-**, the nephew prefix is **petit-** (not symmetrical like English "great-").

## 5. Cousins

### Same generation (up = down = n+1)

| n | masculine | feminine | unknown | source | conf. | notes |
|---|---|---|---|---|---|---|
| 1st | cousin germain | cousine germaine | cousin germain/cousine germaine | TLFi:cousin, AF9, LAR:cousin | high | plain «cousin» alone is also everyday for 1st cousins, but is vague |
| 2nd | cousin issu de germain | cousine issue de germain | cousin issu de germain/cousine issue de germain | TLFi («Cousins issus de germains, ou au deuxième degré»); AF9 («cousins à la deuxième génération»); WP:Cousinage | high (correct); medium (general reader knows it) | also called «cousin au deuxième degré» (TLFi) and loosely «petit-cousin» / «cousin à la mode de Bretagne» — ambiguous, don't use |
| 3rd–10th | cousin au troisième degré … cousin au dixième degré | cousine au troisième degré … | cousin/cousine au troisième degré | TLFi («Cousins au troisième, quatrième... degré»); AF9 («Cousins au troisième degré… cousins à la troisième… génération»); LAR:cousin | **medium — see risk** | ordinals spelled: troisième, quatrième, cinquième, sixième, septième, huitième, neuvième, dixième; ordinal invariable (agrees with *degré*) |
| 11th+ | cousin au 11e degré | cousine au 11e degré | cousin/cousine au 11e degré | same | medium | figures with «e» |

**Risk — three conflicting meanings of "cousin au Ne degré":**
1. Popular / dictionary (TLFi, AF9): numbered like English cousins (germain = 1st, issu de germain = 2nd, «au troisième degré» = 3rd cousin). This is the recommended reading.
2. Canon-law counting (used by some genealogists): cousins germains «au 2e degré», issus de germain «au 3e degré» (GW:degrés).
3. Civil-law counting (CC 743): cousins germains are «au 4e degré», issus de germain «au 6e». The library *also* prints this legal degree, so «cousine au troisième degré» could sit next to «Parenté … au 8e degré».
Alternative with no clash: the Académie's synonym «cousin à la troisième génération» (correct, less familiar). Another: «petit-cousin» (LAR: «cousins au troisième… degré»; WP: *petit-cousin* = *issu d'issu de germain*) — but widely used loosely for any distant cousin; **don't use**.

### Removed cousins (different generations)

There is **no single standard term**; conventions compete:
- «oncle / neveu à la mode de Bretagne» — TLFi:neveu: neveu à la mode de Bretagne = «fils d'un cousin germain». But AF9 and LAR define «cousin à la mode de Bretagne» as a distant relative whose kinship is hard to establish (ironic), and WP:Cousinage uses it for *issus de germain*. **Don't use.**
- «grand-cousin» (a parent's cousin) / «arrière-grand-cousin» (two generations) — WP:Cousinage; not in the major dictionaries checked. **Don't use.**
- «cousin germain éloigné au 1er degré» — WP recommendation; technical. **Don't use.**
- «petit-cousin» — also used for a cousin's child. **Don't use.**

**Recommended: name through the person of the other's generation**, exactly as `el.ts` does (`kin(...)` + genitive ancestor, or descendant + genitive `kin(...)`):

| Case (up, down) | masculine named person | feminine named person | unknown sex | conf. |
|---|---|---|---|---|
| a parent's first cousin (3,2) | cousin germain du père | cousine germaine de la mère | cousin germain/cousine germaine du père; with unknown parent too: «… du père/de la mère» | high (grammar), medium (no native review) |
| a first cousin's child (2,3) | fils du cousin germain / fils de la cousine germaine | fille du cousin germain / fille de la cousine germaine | enfant du cousin germain; enfant du cousin germain/de la cousine germaine | same |
| a grandparent's second cousin (5,3) | cousin issu de germain du grand-père | cousine issue de germain de la grand-mère | cousin issu de germain/cousine issue de germain de la grand-mère | same; «issu de germain de la…» stacks two *de* — acceptable but heavy, native to confirm |

More: (4,2) «cousin germain du grand-père»; (2,4) «petit-fils de la cousine germaine»; (6,3) «cousin issu de germain de l'arrière-grand-mère»; (3,5) «arrière-petite-fille du cousin issu de germain»; (5,2) «cousin germain de l'arrière-grand-père».

## 6. Named relations by marriage

| Kind | masculine | feminine | unknown | source | conf. | notes |
|---|---|---|---|---|---|---|
| spouse | mari | femme | conjoint | everyday; LAR | high | formal: *époux / épouse*. *conjoint* = neutral (also covers PACS/partners colloquially). *femme* also means "woman" — fine in a name, ambiguous in a bare label (see §8) |
| parent-in-law | beau-père | belle-mère | beau-parent | TLFi:beau-père sense A («Père de l'autre conjoint»); OQLF:beaux-parents (singular *beau-parent* "rare") | high (m/f); medium (unknown; fallback «beau-père/belle-mère») | **same words as step-parent** |
| child-in-law | gendre | belle-fille | gendre/belle-fille | TLFi:belle-fille A («L'épouse d'un fils»); TLFi:beau-fils B («Rare. Gendre.») | high | *bru* = LAR «vieilli» — don't use. Use *gendre*, not *beau-fils* (rare in this sense, and = stepson) |
| sibling-in-law (spouse's sibling; sibling's spouse) | beau-frère | belle-sœur | beau-frère/belle-sœur | TLFi:beau-frère A «Frère de l'autre conjoint», B «Époux de la sœur» | high | same word for both directions |
| co-parent-in-law (child's spouse's parent) | **no word**: beau-père du fils / beau-père de la fille | belle-mère du fils / belle-mère de la fille | beau-père/belle-mère de l'enfant | LAR-ES:consuegro («les beaux-parents de mon fils/ma fille»); no French single word found | medium | sex of the child = `sexes[1]`; unknown child → «de l'enfant» or «du fils/de la fille». Alternative through the child-in-law: «père du gendre», «mère de la belle-fille» (but *belle-fille* = also stepdaughter). Both are ambiguous in some way; recommend the Larousse pattern. |
| co-sibling-in-law (men married to sisters / women married to brothers) | beau-frère | belle-sœur | — (only same sex) | TLFi:beau-frère, extended sense «Époux de la belle-sœur» | medium | no dedicated standard word; same as English. Regional words not found in standard dictionaries. |
| uncle/aunt by marriage (aunt's husband; spouse's uncle) | oncle par alliance | tante par alliance | oncle/tante par alliance | TLFi:oncle («Oncle par alliance: Conjoint de la sœur du père ou de la mère») | high | in speech people just say «oncle»; spouse's uncle also «oncle par alliance» (natural, not separately sourced) |
| nephew/niece by marriage | neveu par alliance | nièce par alliance | neveu/nièce par alliance | TLFi:neveu («Neveu par alliance. Fils du beau-frère ou de la belle-sœur») | high | TLFi's definition is the SUDD case; UDDS (niece's husband) by the same pattern, medium |
| step-parent | beau-père | belle-mère | beau-parent | TLFi:beau-père sense B («Celui avec lequel la mère s'est remariée») | high | **same word as parent-in-law** (see §10 #2). *parâtre / marâtre*: archaic/literary, *marâtre* pejorative (TLFi:marâtre) — never use |
| step-child | beau-fils | belle-fille | beau-fils/belle-fille | TLFi:beau-fils A («fils que l'autre conjoint a eu d'un précédent lit»), TLFi:belle-fille B («La fille du conjoint») | high | *belle-fille* = also daughter-in-law |

Unambiguous descriptive alternatives if the project wants them (chain sexes are available): step-parent «mari de la mère» / «femme du père»; step-child «fils du mari» / «fille de la femme»; parent-in-law «père du mari» etc. These are what speakers say when they need to disambiguate.

## 7. Composed relations by marriage (no own word)

**Spouse of a blood relative** — `${spouse} ${genitive(relative)}`:
- «femme du cousin germain», «mari de la cousine issue de germain», «femme du petit-fils», «mari de l'arrière-petite-fille», «femme du cousin germain du père».
- Unknown sex of the spouse: «conjoint du cousin germain». Unknown sex of the relative: «femme du cousin germain/de la cousine germaine».
- The sex of the spouse shows only in the head noun (mari/femme/conjoint); the relative's sex shows in the article and agreement (du cousin germain / de la cousine germaine).

**Blood relative of one's spouse** — `${relative} ${du mari | de la femme | du conjoint}`:
- «cousin germain du mari», «cousine issue de germain de la femme», «grand-oncle du mari», «arrière-grand-mère de la femme».
- Unknown sex of the spouse: «… du conjoint». The relative's own sex is in the head noun.
- If the project picks *époux/épouse* for spouse: «… de l'époux / de l'épouse» (elision!).

## 8. Chain step words

| move | male | female | unknown | conf. | notes |
|---|---|---|---|---|---|
| up (parent) | père | mère | parent | high | |
| down (child) | fils | fille | enfant | high | |
| spouse | époux | épouse | conjoint | high | Recommend *époux/épouse* here (not *mari/femme*) because a bare label «femme : Marie» can read as "woman: Marie". Using mari/femme in names (§6–7) and époux/épouse in step lines is a deliberate split; or use époux/épouse everywhere (slightly formal but never wrong). Owner/native to decide (§10 #4). |

## 9. Sentences

**Legal degree** (mirror of `degree()`):

`Parenté ${kind === "affinity" ? "par alliance" : "par le sang"} en ligne ${line === "direct" ? "directe" : "collatérale"}, au ${ordinal} degré`

- ordinal: `1er` for 1, else `${n}e` («2e», «3e», «11e»). Degree is masculine → «1er», never «1re».
- Examples: «Parenté par le sang en ligne collatérale, au 3e degré» (uncle); «Parenté par le sang en ligne directe, au 1er degré» (parent); «Parenté par alliance en ligne directe, au 1er degré» (parent-in-law); «Parenté par alliance en ligne collatérale, au 2e degré» (sibling-in-law).
- Legal source: **Code civil arts. 741–745** (Légifrance section «Des degrés»): 741 «La proximité de parenté s'établit par le nombre de générations ; chaque génération s'appelle un degré.» 742 defines *ligne directe* / *ligne collatérale* («…personnes qui ne descendent pas les unes des autres, mais qui descendent d'un auteur commun»). 743 counts direct line by generations and collateral line «depuis l'un des parents jusques et non compris l'auteur commun» (siblings 2e, uncle–nephew 3e, cousins germains 4e). 744–745 are succession rules (745: collaterals do not inherit beyond the 6th degree). Wording verified against the 1804 original (arts. 735–738, CC1804) and the Légifrance search result for art. 743; Légifrance itself returned 403 to my fetch, so 744–745 wording is from secondary sources (medium).
- Affinity: the Code civil uses *alliance / alliés* (art. 161: marriage prohibited between «les alliés dans la même ligne»; Code de l'organisation judiciaire L111-6: «parent ou allié … jusqu'au quatrième degré inclusivement»). It does **not** define affinity degrees itself; the rule that an *allié* is in the same degree as the spouse's blood relative is doctrinal (not verified in a primary text here — medium). The jurist's term is «alliance»; «parenté par alliance» is the everyday phrase and is what the brief suggests. Strict alternative: «Alliance en ligne collatérale, au 3e degré».
- «par le sang» is everyday, not in the Code (which just says «parenté»); dropping it («Parenté en ligne collatérale, au 3e degré») is also correct. Keeping it mirrors English/Greek.

**Through marriages:**
- one: `Liés par le mariage de ${A} et ${B}.`
- several: `Liés par les mariages de ${A} et ${B} ; ${C} et ${D}.` (no-break space before «;»).
- *Liés* is masculine plural (generic) — grammatically fine for any pair; «Liées» only if both are women, which would need the sexes. Sex-free alternative: «Par le mariage de A et B.» Formal French often repeats *de* («de A et de B»); both are accepted.

**Common ancestors:**
- one: `Ancêtre commun : ${A}`; two+: `Ancêtres communs : ${A} et ${B}` (no-break space before «:»). For 3+ names French uses «A, B et C», not «A et B et C».
- *ancêtre* is epicene but «commun» would be «commune» for a single woman: «Ancêtre commune : Marie» (medium — native to confirm; masculine as generic is also accepted). The locale API gets names only, not sexes, so either always masculine or the API must pass sexes.

## 10. Open questions / risks (ranked)

1. **3rd+ cousins: «cousin au troisième degré» collides with the legal degree the library prints** (and with canon-law counting where *issu de germain* = 3e degré). Recommended: keep the dictionary sense (= English 3rd cousin), or use the Académie's «à la troisième génération». Native/owner must choose; this is the most likely "wrong term shipped".
2. **beau-père / belle-mère / belle-fille / beau-fils are each two relations** (in-law and step). French speakers accept this, but the report will give the same name for different chains. Decide: plain words (natural), or descriptive disambiguation («mari de la mère», «père du mari»), or a parenthesis like Greek «(από γάμο)».
3. **Ancestors/descendants beyond great-great:** «ascendant/descendant au Ne degré» is unambiguous but legalistic; «ancêtre à la Ne génération» is friendlier but off by one for Sosa-trained genealogists. Native to confirm; also whether to keep «arrière-arrière-arrière-grand-père» for up = 5.
4. **mari/femme vs époux/épouse** (names vs step lines) and **«conjoint»** for unknown sex.
5. **Co-parent-in-law**: no word; «beau-père du fils» (Larousse) is itself ambiguous (stepfather of the son). Alternative «père du gendre». Needs a native call.
6. **Agreement in sentences**: «Liés/Liées», «Ancêtre commun/commune» need sexes the API doesn't pass.
7. **Heavy nested genitives** («cousine issue de germain de la grand-mère du mari») — grammatical, but a native should read a few long outputs.
8. **Typography**: which no-break space (U+00A0 vs U+202F) before «:» and «;» — pin in tests.
9. **Unknown-sex neutral words** *grand-parent*, *petit-enfant*, *arrière-grand-parent*, *beau-parent* in the singular are attested but less common; fallback is the slash form.
10. Québec French: same core terms; the OQLF sources above are Québec-based and agree with France on everything used here.
