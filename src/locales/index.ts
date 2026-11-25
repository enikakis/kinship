import type { KinshipLocale } from "../locale";
import { de } from "./de";
import { el } from "./el";
import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";

/** Every built-in locale, so tests can run over all of them. */
export const LOCALES: readonly KinshipLocale[] = [el, en, fr, de, es];
