import type { KinshipLocale } from "../locale";
import { el } from "./el";
import { en } from "./en";

/** Every built-in locale, so tests can run over all of them. */
export const LOCALES: readonly KinshipLocale[] = [el, en];
