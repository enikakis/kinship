# Spanish (es)

**Experimental.** The terms below come from the sources in the research that follows; they await a
native speaker's review. The "Rulings" and "Calls made while implementing" sections are what
`src/locales/es.ts` implements; where the rulings and the research disagree, the rulings win. The
research's open questions (§10) stay as the list for reviewers.

## Rulings

These are the project's cross-language rulings as they apply to Spanish.

1. **Other-generation relatives beyond the standard words** are named through the person of the
   other's generation, as in Greek, with «de» and the article (contracted «del»): «primo hermano
   del padre», «prima hermana de la madre», «hijo de la prima hermana», «primo segundo del
   abuelo», «hermano del tatarabuelo», «tataranieto del hermano». The standard words are kept
   where they exist: tío, tío abuelo, tío bisabuelo; sobrino, sobrino nieto, sobrino bisnieto (and
   the feminines, each word agreeing: «tía abuela», «sobrina bisnieta»). Never «tío segundo»,
   «sobrino segundo», «tío tatarabuelo», «primo hermano una vez removido».
2. **Cousins of the same generation:** «primo hermano / prima hermana» (1st), then «primo segundo
   / prima segunda», «primo tercero / prima tercera» … «primo décimo / prima décima»: the ordinal
   after the noun, in its full form (never «primo tercer»), agreeing with the sex. From the 11th,
   in figures: «primo 11.º / prima 11.ª». Never «primo de segundo grado».
3. **Direct line beyond the named words:** the named words go up to «tatarabuelo / tatarabuela»
   and down to «tataranieto / tataranieta» (4 generations); from 5 generations on, «ascendiente de
   quinto grado» and «descendiente de quinto grado» (the civil degree in the direct line equals the
   number of generations), with the ordinal shortened before «grado» as in the degree sentence
   (ruling 8). Never trastatarabuelo, chozno, «cuarto abuelo», «cuarto nieto».
4. **Unknown sex:** both full forms joined by "/" («hermano/hermana», «abuelo/abuela», «primo
   tercero/prima tercera», in the genitive «del primo hermano/de la prima hermana», with the
   indefinite article «un primo hermano/una prima hermana»), except for the neutral word
   **cónyuge** («del cónyuge»). «ascendiente» and «descendiente» are common gender too, so an
   unknown sex takes the generic masculine article: «del ascendiente de quinto grado». Spouse words
   when the sex is known: **esposo / esposa** (not marido / mujer), in names and in chain steps
   alike.
5. **Named relations by marriage:** a word exists for each, so it is used: co-parent-in-law
   «consuegro / consuegra», co-sibling-in-law «concuñado / concuñada» (not the regional concuño);
   and «suegro / suegra», «yerno / nuera», «cuñado / cuñada», «tío político / tía política»,
   «sobrino político / sobrina política», «padrastro / madrastra», «hijastro / hijastra».
6. **Composed relations by marriage** use the precise descriptive form, mirroring English: «esposa
   de un primo hermano», «esposo de una prima hermana del padre», «cónyuge de un primo hermano»
   (spouse of a relative, with the indefinite article, which never contracts); «primo hermano del
   esposo», «hijo del primo hermano de la esposa», «nieto/nieta del cónyuge» (relative of one's
   spouse). Not «primo político».
7. **Half-siblings:** «medio hermano / media hermana» (the agreeing form of the DLE lemma).
8. **Sentences:** «Antepasado común: A» / «Antepasados comunes: A y B» («A, B y C» for three or
   more), always in the generic masculine; «y» stays «y» (names are opaque, so no «e» before an
   i-sound). «Parentesco a través del matrimonio de A y B.» / «Parentesco a través de los
   matrimonios de A y B; C y D.» (research §9). The legal degree, Código Civil arts. 915–919:
   «Parentesco por consanguinidad / afinidad en línea recta / colateral, de tercer grado», the
   ordinal in words, shortened before «grado» (primer, tercer, decimotercer) up to «vigésimo»,
   then in figures («de 21.er grado», «de 22.º grado»). Chain lines: «padre: Nombre».
9. **Experimental:** `src/locales/es.ts` starts with a doc comment saying so, pointing here.

## Calls made while implementing

Choices the rulings leave open; the research or the nearest ruling decided them.

1. **The great-great-uncle and great-great-nephew are the last standard words** («tío bisabuelo»,
   «sobrino bisnieto»); further out the relation is described («hermano del tatarabuelo»,
   «tataranieto del hermano»). Not the research's low-medium «tío tatarabuelo» / «sobrino
   tataranieto». This matches French and German.
2. **«ascendiente» and «descendiente» are common-gender words**, with only the article differing; an
   unknown sex takes the generic masculine article, as «cónyuge» does («del ascendiente de quinto
   grado»).
3. **The ordinal before «grado»** in the direct-line words is shortened as in the degree sentence
   («decimotercer grado»); from 21, figures with the RAE abbreviations: «.er» where the word would
   be primer/tercer (21, 23, 31…), «.º» otherwise. The research's §9 fallback «de grado {n}» is not
   used.
4. **Cousins in words up to the tenth, then «primo 11.º / prima 11.ª»** (research §5).
5. **The unknown relative after «de un»:** «esposo de un primo hermano/una prima hermana», the «de»
   outside the slash form (research §7); with «del» each half keeps its own «de» («del primo
   hermano/de la prima hermana»), as «del» is a contraction.
6. **The wording of the marriage sentence** follows research §9: «Parentesco a través del
   matrimonio de A y B.» / «… de los matrimonios de A y B; C y D.».
7. **«y» is never changed to «e»** before an i-sound (ruling 8: names are opaque).

## For native reviewers

Besides the research's open questions (§10, below):

- The core leaves mixed-sex «concuñado» pairs (a man and a woman each married to a sibling of the
  other) unnamed, although the DLE's «concuñado» covers them.

---

# Spanish (es) kinship vocabulary: research for `@enikakis99/kinship`

Scope: pan-Hispanic standard Spanish. Spain-vs-Latin-America differences are flagged **[ES]** / **[AM]**.

**How the sources were checked.** `dle.rae.es`, `rae.es/dpd` and `fundeu.es` refuse automated fetches (Cloudflare or robots). So the DLE/DPD wording below was confirmed from (a) search-engine excerpts of the official pages, (b) Wiktionary entries that cite the DLE sub-entry by name (`{{R:es:DRAE|tío, a segundo, da}}` and similar), and (c) secondhand quotes of #RAEconsultas. The Spanish Civil Code was read **verbatim from BOE**. Wherever I could not read the DLE page itself I say so; a native speaker should spot-check those terms (see §10).

Key sources (cited by tag in the tables):
- **[CC]** Código Civil (Spain), consolidated text, BOE-A-1889-4763: https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763. Read verbatim: arts. 47, 175, 176, 681, 682, 915–920, 949–951.
- **[DLE]** RAE, *Diccionario de la lengua española*, 23rd ed. (online update): https://dle.rae.es/<lemma>. Sub-entries confirmed via Wiktionary citations: *tío, a abuelo, la*; *tío, a segundo, da*; *primo, ma segundo, da*; *sobrino, na nieto, ta*; *medio, dia hermano, na*.
- **[DPD]** RAE, *Diccionario panhispánico de dudas*: https://www.rae.es/dpd/hermano, https://www.rae.es/dpd/medio, https://www.rae.es/dpd/y
- **[OBS]** RAE, Observatorio de palabras, *choznieto*: https://www.rae.es/observatorio-de-palabras/choznieto-choznieta
- **[TDHLE]** RAE, *Diccionario histórico*, *concuño*: https://www.rae.es/tdhle/concuño
- **[RAEc]** #RAEconsultas answers (on X, quoted secondhand), e.g. https://x.com/RAEinforma/status/1534822074409267200 (medio hermano)
- **[FU]** Fundéu, *trastatarabuelo* (2010), cited by en.wiktionary: https://www.fundeu.es/consulta/trastatarabuelo-1811/ (I could not fetch it myself)
- **[WPA]** es.wikipedia, *Anexo:Nomenclatura de parentesco en español*: https://es.wikipedia.org/wiki/Anexo:Nomenclatura_de_parentesco_en_español. Tagged "needs more references", so it is weak and used only for the systematic extensions.
- **[WPP]** es.wikipedia, *Parentesco*: https://es.wikipedia.org/wiki/Parentesco
- **[WKes]/[WKen]** es./en.wiktionary entries for the lemma
- **[OCU]** OCU (Spanish consumers' organisation), "Mis parientes, mis derechos": https://www.ocu.org/consumo-familia/derechos-consumidor/informe/parentesco-repercusiones-legales
- **[UDEP]** Castellano Actual, Univ. de Piura, "media o medio": https://www.udep.edu.pe/castellanoactual/duda-resuelta-media-o-medio/

## 0. Cross-cutting grammar (read first)

| Topic | Rule | Source | Conf. |
|---|---|---|---|
| Gender | Nearly every kin noun inflects: *-o → -a* (tío/tía, primo/prima, nieto/nieta). Adjectives inside the name agree: *primo hermano / prima hermana*, *primo segundo / prima segunda*, *tío político / tía política*, *tío abuelo / tía abuela*, *sobrino nieto / sobrina nieta*. | DLE | high |
| Unknown sex | Spanish has no general neutral form; masculine is the generic only in the **plural** (*los tíos* = uncles and aunts). For a singular unknown sex, use both full forms joined by "/": *tío/tía*, *primo segundo/prima segunda*. Each half keeps its own agreement. **Real neutral words exist** for a few slots: **cónyuge** (spouse, common gender: *el/la cónyuge*), *progenitor* (parent; formal/legal, so not recommended), *descendiente*, *ascendiente* (both common gender). Don't use inclusive-language forms (*primx*, *prime*): they are not standard. | DLE *cónyuge*; DPD | high |
| "of" (genitive) | Use *de* + definite article. **de + el → del** (obligatory contraction); no contraction with *la, los, las, un, una*. So: *del padre*, *de la madre*, *del primo hermano*, *de la prima segunda*, *de un primo*, *de una tía abuela*. The definite article with no possessive means "one's own" (the DLE defines this way: *tío* = "hermano del padre o de la madre"). Avoid *su padre*, because *su* is ambiguous (his/her/your). | DLE definitions; RAE grammar | high |
| Unknown sex, genitive | *del padre/de la madre*, *del primo hermano/de la prima hermana*. Spouse of unknown sex: **del cónyuge** (no slash needed). | — | high |
| Ordinal position | Kinship ordinals come **after** the noun and are never shortened there: *primo **tercero*** (not *\*primo tercer*), *prima tercera*, *tío segundo*. Before the noun they mean birth or sequence order (*segundo primo* = "the second of my cousins"), so **never put the ordinal first**. | DLE *primo segundo*; [WPA] | high |
| Apocope (shortening) | *primero → primer*, *tercero → tercer* only **before** a masculine singular noun: *primer grado*, *tercer grado*, *decimotercer grado*. This matters for the legal-degree sentence (§9), not for cousin names. | DPD *primero*, *tercero* (general rule) | high |
| Written ordinals | Abbreviations: *1.º, 2.º, 4.º* (m.), *1.ª, 2.ª* (f.), shortened forms *1.er, 3.er*. Always a period before the superscript letter. | RAE *Ortografía* 2010 | high |
| "and" in name lists | **y → e** before a word starting with the sound /i/ (written *i-*, *hi-*): *Juan e Inés*, *Ana e Hilario*, *Pedro e Isabel*. It stays *y* before the diphthongs *hia-, hie-, hio-, hiu-* (*y Hierónimo*) and before *y-* (*y Yolanda*). This affects `throughMarriages` and `commonAncestors` (§9). (*o → u* before /o/ only matters if "or" is ever used.) | DPD *y* | high |

## 1. Direct line, up

| Gen | masculine | feminine | unknown | source | conf. | notes |
|---|---|---|---|---|---|---|
| 1 | padre | madre | padre/madre | DLE | high | *progenitor/progenitora* is formal/legal; *papá/mamá* are colloquial. Genitive: *del padre / de la madre*. |
| 2 | abuelo | abuela | abuelo/abuela | DLE | high | |
| 3 | bisabuelo | bisabuela | bisabuelo/bisabuela | DLE | high | Old synonym *trasabuelo* is obsolete. |
| 4 | tatarabuelo | tatarabuela | tatarabuelo/tatarabuela | DLE; WKes | high | Also *rebisabuelo* (rare) and *tercer abuelo* (genealogical; legal dictionaries define tatarabuelo as "el tercero de los abuelos"). |
| 5 | trastatarabuelo / **cuarto abuelo** | trastatarabuela / **cuarta abuela** | …/… | FU (via WKen); forum and genealogy usage | **low–medium** | *trastatarabuelo* is **not in the DLE** (not found in any DLE excerpt). Fundéu reportedly accepts it, and it is widely used colloquially. *chozno* is sometimes used for this ancestor, **but the DLE's *chozno* is the descendant** (§2): **do not use** *chozno* for ancestors. |
| N ≥ 5 | **(N−1).º abuelo**: *cuarto abuelo, quinto abuelo, sexto abuelo…* | *cuarta abuela, quinta abuela…* | *quinto abuelo/quinta abuela* | genealogical convention: abuelo = 1st, bisabuelo = 2nd, tatarabuelo = 3rd; DLE's own *bichozno* = "quinto nieto" uses the same counting | medium | **Off by one from English:** Spanish *cuarto abuelo* = English *3rd great-grandfather* (5 generations up). Ordinal **before** *abuelo* here (that is the convention). A lay reader may misread it as "fourth grandparent". Greek-style alternative: *antepasado de 6.ª generación* (clear, not idiomatic; no source). See §10 Q2. |

**Recommendation:** words through *tatarabuelo* (4). From 5 up, use *cuarto abuelo, quinto abuelo…* with the ordinal in words up to *décimo*, then *11.º abuelo*. Genitive: *del cuarto abuelo / de la cuarta abuela*. Don't ship *chozno* or *pentabuelo/hexabuelo* (pop-quiz inventions, unsourced).

## 2. Direct line, down

| Gen | masculine | feminine | unknown | source | conf. | notes |
|---|---|---|---|---|---|---|
| 1 | hijo | hija | hijo/hija | DLE | high | Plural *hijos* = children (generic masculine). |
| 2 | nieto | nieta | nieto/nieta | DLE | high | |
| 3 | bisnieto | bisnieta | bisnieto/bisnieta | DLE; WKes | high | *biznieto* is an accepted variant. Prefer *bisnieto*. |
| 4 | tataranieto | tataranieta | tataranieto/tataranieta | DLE; WKes | high | *rebisnieto* is sent to *tataranieto* in the DLE. |
| 5 | chozno / **cuarto nieto** | chozna / cuarta nieta | … | DLE *chozno* ("hijo del tataranieto"); *cuadrinieto* (marked obsolete), *chuznieto* (Ecuador), *choznieto* (Am., OBS) | medium (term exists) / **low** (understood by readers) | Most readers won't know *chozno*. |
| 6 | bichozno / quinto nieto | — | — | DLE *bichozno* "quinto nieto, o sea hijo del cuadrinieto" (search excerpt) | low | Obscure. |
| N ≥ 5 | **(N−1).º nieto**: *cuarto nieto, quinto nieto…* | *cuarta nieta…* | *cuarto nieto/cuarta nieta* | DLE (*bichozno* definition) | medium | Same counting and same misreading risk as §1 ("fourth grandchild"). Alternative: *descendiente de 5.ª generación*. |

**Recommendation:** words through *tataranieto* (4); then the same pattern as ancestors (*cuarto nieto*…), or both directions Greek-style (see §10 Q2). Genitive: *del bisnieto / de la bisnieta*, unknown *del bisnieto/de la bisnieta*.

## 3. Siblings

| Term | masculine | feminine | unknown | source | conf. | notes |
|---|---|---|---|---|---|---|
| sibling | hermano | hermana | hermano/hermana | DLE | high | No neutral singular. Plural *hermanos* is generic. Legal: *hermano de doble vínculo* (CC art. 920). |
| half-sibling | **medio hermano** | **media hermana** (or *medio hermana*) | medio hermano/media hermana | DLE sub-entry *medio, dia hermano, na*; DPD *hermano*, *medio*; RAEc; CC arts. 949–951 (*medio hermanos*) | high (term) / medium (feminine form) | DPD accepts **two analyses**: *medio* as an unchanging adverb (*medio hermana*, *medio hermanos*, joined spelling *mediohermana*), "the most widespread in educated language", or as an adjective that agrees (*media hermana*, *medios hermanos*), widespread in Mexico, Central America and the River Plate. The CC writes *medio hermanos*. The DLE lemma *medio, dia hermano, na* supports *media hermana*. See §10 Q4. |
| (not used) | hermanastro | hermanastra | — | DLE, DPD *hermanastro* | high | Strictly a **stepsibling** (child of one's step-parent). DPD notes it is also used for half-sibling. **Don't use it for half-siblings**, because it would be read as a step-relation. |
| paternal/maternal half | hermano de padre / hermano de madre; legal: *de vínculo sencillo* | hermana de padre / de madre | — | DLE (*hermano de padre*); CC art. 950 ("por parte de padre… por la de la madre") | medium | Not needed (the project doesn't distinguish). |

## 4. Uncle/aunt, nephew/niece

| Relation (up, down) | masculine | feminine | unknown | source | conf. | notes |
|---|---|---|---|---|---|---|
| uncle (2,1) | tío | tía | tío/tía | DLE; CC art. 918 ("tío, hermano de su padre o madre") | high | *tío carnal* (DLE) means blood uncle when contrasting with *político/segundo*. **[ES]** colloquial *tío* = "guy", but no clash in a kinship label. |
| great-uncle (3,1) | tío abuelo | tía abuela | tío abuelo/tía abuela | DLE *tío, a abuelo, la* ("hermano o hermana de uno de los abuelos") | high | Spelled **without a hyphen** (WPA's *tío-abuelo* is non-standard). Plural *tíos abuelos*. |
| great-great-uncle (4,1) | tío bisabuelo | tía bisabuela | tío bisabuelo/tía bisabuela | WPA; genealogy usage | medium | Not in DLE; built the same way and transparent to readers. |
| (5,1) | tío tatarabuelo | tía tatarabuela | … | WKes *tatarabuelo* (phrase); WPA | low–medium | Rare. |
| beyond (6+,1) | descriptive: *hermano del cuarto abuelo* | *hermana de la cuarta abuela* | *hermano/hermana del cuarto abuelo/de la cuarta abuela* | project rule | — | |
| nephew (1,2) | sobrino | sobrina | sobrino/sobrina | DLE | high | |
| great-nephew (1,3) | sobrino nieto | sobrina nieta | sobrino nieto/sobrina nieta | DLE *sobrino, na nieto, ta* | high | No hyphen. Plural *sobrinos nietos*. |
| (1,4) | sobrino bisnieto | sobrina bisnieta | … | WPA | medium | Transparent. |
| (1,5) | sobrino tataranieto | sobrina tataranieta | … | WPA | low–medium | |
| beyond | descriptive: *cuarto nieto del hermano* / *cuarta nieta de la hermana* | | | project rule | — | |

Pattern: *tío* + the generation word of the ancestor whose sibling this is (abuelo, bisabuelo, tatarabuelo); *sobrino* + the descendant word (nieto, bisnieto, tataranieto). Both words agree in gender.

## 5. Cousins

### Same generation (n-th cousins)

| Degree | masculine | feminine | unknown | source | conf. | notes |
|---|---|---|---|---|---|---|
| 1st | **primo hermano** | **prima hermana** | primo hermano/prima hermana | DLE (*primo hermano* = "hijo del tío carnal"); CC art. 918; WKes | high | Synonym *primo carnal* (DLE; mostly [ES]). In everyday speech plain *primo/prima* = first cousin in all countries. Use *primo hermano* so it contrasts with *primo segundo* (English uses "first cousin" too). |
| 2nd | primo segundo | prima segunda | primo segundo/prima segunda | DLE *primo, ma segundo, da* ("hijo del tío segundo de una persona") | high | |
| 3rd | primo tercero | prima tercera | primo tercero/prima tercera | WPA; WKen hyponyms | medium | **Not *tercer*** (comes after the noun). |
| 4th–10th | primo cuarto, quinto, sexto, séptimo, octavo, noveno, décimo | prima cuarta, quinta, sexta, séptima, octava, novena, décima | both | regular ordinals | medium | *séptimo* (also *sétimo*, accepted, rarer). |
| 11th+ | primo undécimo, duodécimo, decimotercero… | prima undécima, duodécima, decimotercera… | | RAE ordinals | low (no one says these) | Easier fallback: *primo 11.º / prima 11.ª*. Practically never reached. |

**Never write *primo de segundo grado* / *primo en segundo grado*.** People do say it to mean *primo segundo*, but it clashes with the legal degree (a *primo hermano* is legally 4th degree, CC art. 918). The library prints both, so it would contradict itself.

### Removed cousins: there are dictionary terms for some cases, competing usage, and the descriptive form recommended

**Systematic convention** (DLE for the first two rows; RAEc and WPA for the rest): the older generation is a *tío*, the younger a *sobrino*, and the ordinal gives the cousin degree of the parent's (or own) generation:

| Relation | Term | Source | conf. |
|---|---|---|---|
| parent's first cousin (3,2) | **tío segundo / tía segunda** | DLE *tío, a segundo, da* ("primo o prima del padre o de la madre") | high (exists) |
| first cousin's child (2,3) | **sobrino segundo / sobrina segunda** | RAEc ("el hijo del primo es «sobrino» o «sobrino segundo»"); DLE *sobrino* (excerpt via forum) | medium-high |
| parent's 2nd cousin (4,3) | tío tercero / tía tercera | WPA | low |
| grandparent's 1st cousin (4,2) | tío abuelo segundo | WPA | low |
| first cousin's grandchild (2,4) | sobrino nieto segundo | RAEc (secondhand) | low–medium |
| grandparent's 2nd cousin (5,3) | tío abuelo tercero | WPA only | low |

**Competing usage / risks:** (a) Many speakers just say *tío*/*sobrino* or *primo* for all of these. In **[AM]** (Mexico especially) a cousin's child is also called *primo segundo* (spanishdict.com answers 219694, a translation forum, anecdotal). (b) Some translators use the calque *primo hermano una vez removido* (seen in a Mexican newspaper column). It is **not idiomatic; don't use it.** (c) *sobrino segundo* is easily read as "second nephew" (tusclases.pe).

**Recommendation (matches the project rule):** use the descriptive "person of the other's generation" pattern for every removed cousin. Optionally keep **tío segundo / sobrino segundo** for (3,2)/(2,3), since they are in the dictionary, just as Greek keeps θείος/ανιψιός (owner decision; §10 Q1). Don't ship *tío tercero*, *tío abuelo segundo/tercero* or *sobrino nieto segundo*.

**Descriptive pattern** (same as Greek `bloodName`):
- If up > down: `kin(down)` + ` ` + `de+article ancestor(up−down)`, where kin(n) = *hermano* (n=1) or *primo {ordinal n−1}*.
- If up < down: `descendant(down−up)` + ` ` + `de+article kin(up)`.
- The head noun agrees with the named person's sex. The article and noun of the *of*-part agree with that intermediate person's sex. With an unknown sex, each part gets "/" separately.

Worked examples:

| Relation | male / female named person | unknown named person | unknown intermediate |
|---|---|---|---|
| parent's first cousin (3,2) | *primo hermano del padre*; *prima hermana de la madre*; *prima hermana del padre* | *primo hermano/prima hermana de la madre* | *primo hermano del padre/de la madre* |
| first cousin's child (2,3) | *hijo del primo hermano*; *hija de la prima hermana*; *hijo de la prima hermana* | *hijo/hija del primo hermano* | *hija del primo hermano/de la prima hermana* |
| grandparent's second cousin (5,3) | *primo segundo del abuelo*; *prima segunda de la abuela* | *primo segundo/prima segunda del abuelo* | *prima segunda del abuelo/de la abuela* |
| more | *primo hermano del bisabuelo* (4,2); *nieto de la prima segunda* (3,5); *hermana del cuarto abuelo* | | |

Note: *del abuelo* is ambiguous between the paternal and maternal grandfather, just as "the grandfather" is in English. That is acceptable.

## 6. Named relations by marriage

| Relation | masculine | feminine | unknown | source | conf. | notes |
|---|---|---|---|---|---|---|
| spouse | **esposo** | **esposa** | **cónyuge** | DLE *esposo*, *cónyuge* | high | *marido / mujer* are very common **[ES]** and fine everywhere, but *mujer* is ambiguous ("woman"). *esposo/esposa* is pan-Hispanic. *cónyuge* is a real neutral word (common gender), with genitive *del cónyuge*. |
| parent-in-law | suegro | suegra | suegro/suegra | DLE | high | Also *padre político / madre política* (DLE *político*: "padre político (suegro)"). |
| child-in-law | yerno | nuera | yerno/nuera | DLE | high | Also *hijo político / hija política*. *yerna* is heard colloquially in **[AM]** (Mexico): don't use it. |
| sibling-in-law | cuñado | cuñada | cuñado/cuñada | DLE *cuñado*; DLE *político* ("hermano político (cuñado)") | high | **The same word for both** the spouse's sibling and the sibling's spouse. Also *hermano político*. **[ES]** colloquial *cuñado* = know-it-all (harmless here). |
| co-parent-in-law | **consuegro** | **consuegra** | consuegro/consuegra | DLE *consuegro*; WKes ("padre del cónyuge con respecto al padre del otro cónyuge") | high | Everyday word in all countries. Not kin in law (WPP, OCU). *compadre* is a different (godparent) tie: don't use it. |
| co-sibling-in-law | **concuñado** | **concuñada** | concuñado/concuñada | DLE *concuñado*; RAEc; TDHLE *concuño* ("cónyuge de una persona respecto del cónyuge de otra persona hermana de aquella") | high | Covers two men married to sisters, two women married to brothers, and mixed pairs. **[AM]** **concuño/concuña** in Mexico, Central America, Cuba, Dominican Republic and Bolivia (DLE marks it regional; also regional in Spain). The DLE also gives a second sense (the sibling of one's *cuñado*). Not kin in law (WPP, OCU). |
| uncle/aunt by marriage | **tío político** | **tía política** | tío político/tía política | WPA; DLE *político* (affinity sense); DLE *tío* ("cónyuge del tío de una persona") | high | Covers **both** an aunt's husband and a spouse's uncle. Note the DLE lists the uncle's spouse simply as *tío*. In everyday speech an aunt's husband is just *tío*. |
| nephew/niece by marriage | **sobrino político** | **sobrina política** | sobrino político/sobrina política | WPA; DLE *político* | high | Both directions (a nephew's wife; a spouse's nephew). |
| step-parent | padrastro | madrastra | padrastro/madrastra | DLE | high | A slightly negative tone (fairy tales). Many people prefer "la pareja de mi madre", but that is the standard term. |
| step-child | hijastro | hijastra | hijastro/hijastra | DLE | high | Same tone note. |

*político/política* is productive in Spanish: *abuelo político*, *primo político*, *sobrino nieto político*, all both directions (WPA; DLE *político*). It is the idiomatic short label for most of §7, but it **hides the direction and the spouse** (*prima política* = a cousin's wife **or** the husband's cousin). See §7 and §10 Q3.

## 7. Composed relations by marriage

**Spouse of a blood relative** (`spouseOfRelative`): `{esposo|esposa|cónyuge}` + ` de ` + `un|una` + relative name. The indefinite article agrees with the **relative's** sex (unknown: give both, *un primo hermano/una prima hermana*). The head noun follows the named person's sex. Contractions: *de un / de una* never contract. With a Greek-style descriptive relative the inner *de+article* stays: *esposa de un primo hermano del padre*.
- *esposa de un primo hermano* (the wife of a first cousin)
- *esposo de una prima segunda* (the husband of a second cousin)
- *esposo de una tía abuela*. Unknown spouse: *cónyuge de un primo hermano del padre*.
- Definite-article alternative: *esposa del primo hermano*. That reads as one specific person; it is fine in speech but reads as a definite claim in a label. The indefinite mirrors English "of a".
- Idiomatic short alternative: *prima política*, *tía abuela política* (loses the direction).

**Blood relative of one's spouse** (`relativeOfSpouse`): relative name + ` ` + `del esposo | de la esposa | del cónyuge`. The spouse's sex shows **only** in *del esposo* / *de la esposa*. Unknown spouse sex: **del cónyuge** (better than *del esposo/de la esposa*).
- *primo hermano del esposo* (the husband's first cousin)
- *tía abuela de la esposa* (the wife's great-aunt)
- *prima segunda del cónyuge*. Named person of unknown sex: *primo hermano/prima hermana de la esposa*.
- Descriptive relatives chain on: *hijo del primo hermano de la esposa*.
- [ES] colloquial: *del marido / de la mujer*. Not recommended, for the reason in §6.

## 8. Chain step words

| move | male | female | unknown | conf. |
|---|---|---|---|---|
| up (parent) | padre | madre | padre/madre | high |
| down (child) | hijo | hija | hijo/hija | high |
| spouse | esposo | esposa | cónyuge | high |

Used as `padre: Nombre`, `hija: Nombre`, `esposa: Nombre` (lower-case, as English does).

## 9. Sentences

**Legal source:** CC (Spain) **arts. 915–919** (verified verbatim on BOE):
- 915: degree = generation.
- 916: *línea directa o colateral*.
- 917: *línea recta*, ascending/descending.
- 918: counting. *"el hermano dista dos grados del hermano, tres del tío… cuatro del primo hermano"*.
- 919: the counting applies in all matters.
- Art. 920 defines *doble vínculo*.

**Affinity (afinidad) is used but not defined or counted** in the Spanish CC (arts. 175, 176, 681, 682 use "*en tercer grado por consanguinidad o afinidad*", "*cuarto grado de consanguinidad o segundo de afinidad*"). Doctrine counts it by "mirror" (the same degree as the spouse has to the relative, OCU). Concuñados and consuegros are **not** kin (WPP, OCU). This matches the project's rules. Argentina's CCyC art. 536 states the mirror rule expressly. Spouses have no degree.

| Sentence | Exact string | notes | conf. |
|---|---|---|---|
| degree | `Parentesco por {consanguinidad\|afinidad} en línea {recta\|colateral}, de {ordinal} grado` | Ordinal in words **with apocope** before *grado*: *primer, segundo, tercer, cuarto, quinto, sexto, séptimo, octavo, noveno, décimo*; then *undécimo, duodécimo, decimotercer, decimocuarto … decimonoveno, vigésimo*. For >20, the numeric fallback *de grado {n}*. The legal phrasing is *en tercer grado por consanguinidad* (CC art. 176), so an alternative is `Parentesco en {ordinal} grado por {consanguinidad\|afinidad}, línea {recta\|colateral}`. *recta* is preferred over *directa* (the CC uses both; *recta* is more frequent, as in arts. 47, 917). | high (words) / medium (word order) |
| examples | *Parentesco por consanguinidad en línea colateral, de cuarto grado*; *Parentesco por afinidad en línea recta, de primer grado*; *Parentesco por afinidad en línea colateral, de tercer grado* | | |
| through marriages | 1 couple: `Parentesco a través del matrimonio de {A} y {B}.` Several: `Parentesco a través de los matrimonios de {A} y {B}; {C} y {D}.` | A noun phrase avoids participle agreement (*emparentados/emparentadas*). Apply **y → e** before /i/: *de Juan e Inés*. | medium-high |
| common ancestors | 1: `Antepasado común: {A}`. 2+: `Antepasados comunes: {A} y {B}` | The interface passes no sex. *Antepasado* is masculine-generic, slightly off for a single woman. A neutral option is **`Ascendiente común` / `Ascendientes comunes`** (common gender, legal-flavoured). The legal term is *tronco común* (CC 916, 918), too technical. Apply y → e. | medium |

## 10. Open questions and risks (ranked)

1. **Removed cousins: dictionary term or descriptive?** The DLE has *tío segundo* (parent's first cousin) and the RAE uses *sobrino segundo* (first cousin's child), but ordinary speakers often say just *tío/primo/sobrino*, and in Mexico *primo segundo* is also heard for a cousin's child. The recommendation is descriptive everywhere (*primo hermano del padre*, *hijo de la prima hermana*), optionally keeping *tío segundo/sobrino segundo*. A native speaker (ideally one from Spain and one from Mexico) should pick.
2. **Ancestors and descendants beyond 4 generations.** *trastatarabuelo* is not in the DLE. *chozno* means opposite things in the DLE (descendant) and popular use (ancestor). The genealogical *cuarto/quinto abuelo* is off by one from English "Nth great-" and can be misread as birth order. Pick one: *cuarto abuelo…* or Greek-style *antepasado/descendiente de N.ª generación*. I could not find an authoritative style guide for either.
3. **Composed relations by marriage:** descriptive (*esposa de un primo hermano*, *primo hermano del esposo*) or the idiomatic *primo político*? The descriptive form is precise and keeps the spouse's sex; *político* is what people say. Also: indefinite *de un primo* or definite *del primo*?
4. **Half-sibling feminine:** *media hermana* (DLE lemma; Mexico, Central America, River Plate) or *medio hermana* (DPD: the more widespread educated usage; the CC writes *medio hermanos*)? Both are correct. Pick one for consistency.
5. **DLE wording not read first-hand** for *tío*, *sobrino segundo*, *cuñado*, *concuñado*, *chozno*, *bichozno*, *político*. They were confirmed via Wiktionary DLE citations and search excerpts only. Spot-check on dle.rae.es before shipping.
6. **Legal-degree sentence:** word order (*de cuarto grado* at the end, or *en cuarto grado por consanguinidad*) and the >20 fallback. Never let any label say *primo de N grado* (it clashes with the legal degree).
7. **commonAncestors gender:** *Antepasado común: María* uses the masculine generic. Consider *Ascendiente común*, or pass the sex to the locale.
8. **Regional labels:** *concuñado* vs *concuño* (the DLE lists both, *concuño* regional) and *esposo* vs *marido* ([ES]). Recommend the pan-Hispanic *concuñado* and *esposo* and document the variants. The locale code `es` doesn't distinguish `es-ES`/`es-MX`.
9. **step-relations' tone:** *padrastro/madrastra/hijastro* are standard but slightly negative. Acceptable in a genealogy tool. Confirm.
