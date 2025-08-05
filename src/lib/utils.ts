export {};
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Map UI dropdown language values to Google Translate codes
const LANGUAGE_CODE_MAP: Record<string, string> = {
  Afrikaans: "af",
  Albanian: "sq",
  Amharic: "am",
  Arabic: "ar",
  Armenian: "hy",
  Azerbaijani: "az",
  Basque: "eu",
  Belarusian: "be",
  Bengali: "bn",
  Bosnian: "bs",
  Bulgarian: "bg",
  Catalan: "ca",
  Cebuano: "ceb",
  Chichewa: "ny",
  "Chinese (Simplified)": "zh-CN",
  "Chinese (Traditional)": "zh-TW",
  Corsican: "co",
  Croatian: "hr",
  Czech: "cs",
  Danish: "da",
  Dutch: "nl",
  English: "en",
  Esperanto: "eo",
  Estonian: "et",
  Filipino: "tl",
  Finnish: "fi",
  French: "fr",
  Frisian: "fy",
  Galician: "gl",
  Georgian: "ka",
  German: "de",
  Greek: "el",
  Gujarati: "gu",
  "Haitian Creole": "ht",
  Hausa: "ha",
  Hawaiian: "haw",
  Hebrew: "iw",
  Hindi: "hi",
  Hmong: "hmn",
  Hungarian: "hu",
  Icelandic: "is",
  Igbo: "ig",
  Indonesian: "id",
  Irish: "ga",
  Italian: "it",
  Japanese: "ja",
  Javanese: "jw",
  Kannada: "kn",
  Kazakh: "kk",
  Khmer: "km",
  Kinyarwanda: "rw",
  Korean: "ko",
  "Kurdish (Kurmanji)": "ku",
  Kyrgyz: "ky",
  Lao: "lo",
  Latin: "la",
  Latvian: "lv",
  Lithuanian: "lt",
  Luxembourgish: "lb",
  Macedonian: "mk",
  Malagasy: "mg",
  Malay: "ms",
  Malayalam: "ml",
  Maltese: "mt",
  Maori: "mi",
  Marathi: "mr",
  Mongolian: "mn",
  "Myanmar (Burmese)": "my",
  Nepali: "ne",
  Norwegian: "no",
  "Odia (Oriya)": "or",
  Pashto: "ps",
  Persian: "fa",
  Polish: "pl",
  Portuguese: "pt",
  Punjabi: "pa",
  Romanian: "ro",
  Russian: "ru",
  Samoan: "sm",
  Scots: "gd",
  Serbian: "sr",
  Sesotho: "st",
  Shona: "sn",
  Sindhi: "sd",
  Sinhala: "si",
  Slovak: "sk",
  Slovenian: "sl",
  Somali: "so",
  Spanish: "es",
  Sundanese: "su",
  Swahili: "sw",
  Swedish: "sv",
  Tajik: "tg",
  Tamil: "ta",
  Tatar: "tt",
  Telugu: "te",
  Thai: "th",
  Turkish: "tr",
  Turkmen: "tk",
  Ukrainian: "uk",
  Urdu: "ur",
  Uyghur: "ug",
  Uzbek: "uz",
  Vietnamese: "vi",
  Welsh: "cy",
  Xhosa: "xh",
  Yiddish: "yi",
  Yoruba: "yo",
  Zulu: "zu",
};

// Build a reverse map for code -> code
const CODE_TO_CODE: Record<string, string> = {};
for (const [label, code] of Object.entries(LANGUAGE_CODE_MAP)) {
  CODE_TO_CODE[code] = code;
}

export function normalizeLanguage(input: string): string {
  if (!input) return "en";
  // Remove parenthesis and trim
  const base = input.split("(")[0].trim();
  // Try label
  if (LANGUAGE_CODE_MAP[base]) return LANGUAGE_CODE_MAP[base];
  if (LANGUAGE_CODE_MAP[input]) return LANGUAGE_CODE_MAP[input];
  // Try code
  if (CODE_TO_CODE[base]) return CODE_TO_CODE[base];
  if (CODE_TO_CODE[input]) return CODE_TO_CODE[input];
  // Try direct match (for codes like 'fr', 'es', etc.)
  if (Object.values(LANGUAGE_CODE_MAP).includes(input)) return input;
  return "en";
}

/**
 * Translate text to a target language using Google Translate API (demo only).
 * @param text The text to translate
 * @param targetLanguage The target language (e.g., 'Bengali', 'Hindi', 'French')
 * @returns The translated text
 */
export async function translateText(
  text: string,
  targetLanguage: string
): Promise<string> {
  const target = normalizeLanguage(targetLanguage);
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(
    target
  )}&dt=t&q=${encodeURIComponent(text)}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (
      Array.isArray(data) &&
      Array.isArray(data[0]) &&
      Array.isArray(data[0][0])
    ) {
      return data[0].map((item: any) => item[0]).join("");
    }
    return text;
  } catch (e) {
    console.error("Translation error:", e);
    return text;
  }
}
