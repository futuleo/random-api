export const LOCALES = ["en", "fi", "sv", "ru", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  fi: "Suomi",
  sv: "Svenska",
  ru: "Русский",
  es: "Español",
};

export function isLocale(value: unknown): value is Locale {
  return LOCALES.some((locale) => locale === value);
}

export function parseLocale(value: unknown): Locale {
  if (value === undefined) return "en";
  if (!isLocale(value))
    throw new TypeError("Locale must be en, fi, sv, ru or es.");
  return value;
}

export const NAME_WORDS: Record<
  Locale,
  { first: readonly string[]; last: readonly string[] }
> = {
  en: {
    first: ["Alex", "Jordan", "Taylor", "Casey", "Morgan", "Robin"],
    last: ["Reed", "Parker", "Brooks", "Hayes", "Lane", "Wells"],
  },
  fi: {
    first: ["Aino", "Eero", "Emilia", "Onni", "Sofia", "Väinö"],
    last: ["Korhonen", "Virtanen", "Laine", "Mäkinen", "Nieminen", "Lehtonen"],
  },
  sv: {
    first: ["Alva", "Elsa", "Erik", "Linnea", "Noah", "Oscar"],
    last: ["Andersson", "Johansson", "Nilsson", "Sjöberg", "Lindström", "Berg"],
  },
  ru: {
    first: ["Алексей", "Анна", "Елена", "Михаил", "Никита", "София"],
    last: ["Волков", "Орлов", "Соколов", "Морозов", "Лебедев", "Попов"],
  },
  es: {
    first: ["Lucía", "Martín", "Carmen", "Hugo", "Elena", "Mateo"],
    last: ["García", "López", "Martínez", "Navarro", "Sánchez", "Ruiz"],
  },
};

export const TEXT_PREFIX: Record<Locale, string> = {
  en: "synthetic",
  fi: "testiteksti",
  sv: "testtext",
  ru: "тестовый_текст",
  es: "texto_de_prueba",
};
