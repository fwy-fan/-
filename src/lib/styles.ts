import { z } from "zod";

/**
 * Style data shared by the UI and the prompts.
 *
 * Inclusivity rules this app follows:
 * - Colour advice comes from the skin tone visible in the photo (depth on the
 *   10-point Monk Skin Tone scale, plus undertone), never from guessing a
 *   person's race or ethnicity. The customer can correct the detected tone.
 * - Regional taste is something the customer *chooses* (where they live or
 *   which trends they like), not something inferred from their appearance.
 * - Style direction (feminine / masculine / neutral) is the customer's choice
 *   and is independent of gender.
 */

export const STYLE_DIRECTIONS = ["feminine", "masculine", "neutral"] as const;
export type StyleDirection = (typeof STYLE_DIRECTIONS)[number];

export const STYLE_DIRECTION_GUIDE: Record<StyleDirection, string> = {
  feminine:
    "Open to the full range of decorative nail art: colour, French tips, chrome, florals, gems, gradients, longer shapes.",
  masculine:
    "Men's nail care and men's nail art. Default to short, clean, well-groomed nails (short squoval or square, or natural round). Good options: a clear or matte protective coat, buffed natural shine, sheer tinted neutrals, deep solid colours (black, navy, forest green, oxblood, gunmetal, charcoal), matte finishes, a single accent nail, thin graphic lines, minimal geometric or monogram details. Avoid long or extreme shapes and heavy rhinestones unless the customer asks for them. Never treat painted nails on men as a novelty.",
  neutral:
    "Gender-neutral, understated style: short to medium length, natural shapes, tonal neutrals, soft minimal art and clean finishes that suit anyone.",
};

export const OCCASIONS = [
  "everyday",
  "work",
  "wedding",
  "party",
  "date",
  "holiday",
  "festival",
  "sport",
] as const;
export type Occasion = (typeof OCCASIONS)[number];

export const LENGTHS = ["natural", "short", "medium", "long", "any"] as const;
export type LengthPref = (typeof LENGTHS)[number];

/**
 * Monk Skin Tone scale swatches (Google, CC BY 4.0) used so the customer can
 * confirm or correct the tone the model detects.
 */
export const MONK_SCALE = [
  "#f6ede4",
  "#f3e7db",
  "#f7ead0",
  "#eadaba",
  "#d7bd96",
  "#a07e56",
  "#825c43",
  "#604134",
  "#3a312a",
  "#292420",
] as const;

export interface Region {
  code: string;
  zh: string;
  en: string;
  /** Trend notes given to the model. Kept in English for consistent prompting. */
  trends: string;
}

export const REGIONS: Region[] = [
  {
    code: "GLOBAL",
    zh: "全球流行",
    en: "Global trends",
    trends:
      "Current international trends: glazed/chrome finishes, soft milky neutrals, micro French, aura gradients, minimalist line art.",
  },
  {
    code: "CN",
    zh: "中国",
    en: "China",
    trends:
      "Popular: 'ice-transparent' (冰透) jelly nails, cat-eye magnetic gel, milky nude, rose/peach blush, Chinese-red for New Year and weddings, gold leaf, delicate 3D pearls, guochao (national-trend) motifs like plum blossom and auspicious clouds. Red and gold are lucky; avoid all-white or all-black sets for celebrations.",
  },
  {
    code: "HK_TW",
    zh: "港澳台",
    en: "Hong Kong / Macau / Taiwan",
    trends:
      "Popular: Japanese-influenced gel art, sheer jelly tones, cute character accents, cat-eye, soft gradients, office-friendly nudes.",
  },
  {
    code: "JP",
    zh: "日本",
    en: "Japan",
    trends:
      "Popular: intricate Japanese gel art, one-colour 'one-hon' gel, sheer seasonal palettes (sakura pink in spring, deep momiji tones in autumn), nuance/abstract art, mirror and magnet nails, short to medium almond. Understated designs for office workers.",
  },
  {
    code: "KR",
    zh: "韩国",
    en: "South Korea",
    trends:
      "Popular: syrup/jelly nails, glass nails, blush cheek-style gradients, 'pearl glazed', mini-charms, soft pastel and milk tones, short rounded shapes, clean 'clean-girl' looks.",
  },
  {
    code: "SEA",
    zh: "东南亚（泰国/越南/印尼/马来/菲律宾/新加坡）",
    en: "Southeast Asia",
    trends:
      "Popular: bright tropical colours, nude and milky bases for heat and humidity, chrome, floral and fruit art, short practical lengths. For Muslim customers who pray, breathable / water-permeable polish or press-ons may be preferred.",
  },
  {
    code: "IN",
    zh: "印度/南亚",
    en: "India / South Asia",
    trends:
      "Popular: bridal designs with gold, maroon, red and mehndi-inspired line art, jewel tones (emerald, ruby, sapphire), embellishments for festivals like Diwali and weddings. Keep designs complementary to henna on the hands.",
  },
  {
    code: "MENA",
    zh: "中东/北非",
    en: "Middle East / North Africa",
    trends:
      "Popular: elegant nudes, deep burgundy, gold accents, marble, luxurious embellishment for weddings and Eid. Many customers prefer breathable / halal (water-permeable) polish so they can pray; offer it as an option.",
  },
  {
    code: "US",
    zh: "美国",
    en: "United States",
    trends:
      "Popular: long coffin and almond acrylics, chrome and glazed-donut finishes, bold expressive art, airbrush, 3D charms, French with coloured tips; also short 'quiet luxury' neutrals. Strong nail-art culture in Black American communities: long sculpted shapes, gold, bling, freestyle art.",
  },
  {
    code: "CA",
    zh: "加拿大",
    en: "Canada",
    trends:
      "Popular: practical short-medium lengths, seasonal palettes (deep tones for long winters), glazed finishes, minimal French.",
  },
  {
    code: "LATAM",
    zh: "拉丁美洲（巴西/墨西哥等）",
    en: "Latin America",
    trends:
      "Popular: Brazilian clean cuticle work with glossy colour, bright corals and reds, 'francesinha' French variants, long almond and stiletto in Mexico, festive colours and florals, gold accents.",
  },
  {
    code: "UK",
    zh: "英国/爱尔兰",
    en: "UK / Ireland",
    trends:
      "Popular: BIAB builder-gel natural nails, milky pinks, chrome, short square and squoval, tasteful seasonal art, darker autumn/winter shades.",
  },
  {
    code: "FR",
    zh: "法国",
    en: "France",
    trends:
      "Popular: effortless French chic — short natural nails, classic red, sheer nudes, micro French, very little embellishment.",
  },
  {
    code: "EU",
    zh: "欧洲其他国家",
    en: "Rest of Europe",
    trends:
      "Popular: minimalist Scandinavian neutrals, Italian classic reds and burgundy, German/Dutch practical short nails, Spanish bold colour for summer, Eastern European elaborate gel art and long almond.",
  },
  {
    code: "RU",
    zh: "俄罗斯/东欧",
    en: "Russia / Eastern Europe",
    trends:
      "Popular: precise 'Russian manicure' cuticle work, long almond and square gel, elaborate hand-painted art, rhinestones, velvet/cat-eye and ombré.",
  },
  {
    code: "WAF",
    zh: "西非（尼日利亚/加纳等）",
    en: "West Africa",
    trends:
      "Popular: bold long acrylics, vivid colours (gold, emerald, cobalt, orange, hot pink), Ankara-print and wax-print inspired patterns, gold foil, bling. High-contrast colours look striking on deeper skin tones.",
  },
  {
    code: "EAF",
    zh: "东非（肯尼亚等）",
    en: "East Africa",
    trends:
      "Popular: bright colours, beadwork-inspired patterns (Maasai reds, blues, whites), medium almond, glossy solid shades.",
  },
  {
    code: "ZA",
    zh: "南非",
    en: "South Africa",
    trends:
      "Popular: long acrylic and gel extensions, nude-on-deep-skin shades tailored to the wearer, ombré, glitter, geometric Ndebele-inspired art.",
  },
  {
    code: "OCE",
    zh: "澳大利亚/新西兰",
    en: "Australia / New Zealand",
    trends:
      "Popular: beachy pastels, short practical shapes, sheer neutrals, summer brights, chrome.",
  },
];

export function findRegion(code: string | undefined) {
  return REGIONS.find((r) => r.code === code) ?? REGIONS[0];
}

export const preferencesSchema = z.object({
  styleDirection: z.enum(STYLE_DIRECTIONS).default("neutral"),
  region: z.string().max(16).default("GLOBAL"),
  occasion: z.enum(OCCASIONS).default("everyday"),
  length: z.enum(LENGTHS).default("any"),
  /** 1–10 on the Monk scale when the customer corrects the detected tone. */
  skinToneOverride: z.number().int().min(1).max(10).nullable().default(null),
  locale: z.enum(["zh", "en"]).default("zh"),
});
export type Preferences = z.infer<typeof preferencesSchema>;

/** Text block describing the customer's choices, shared by every prompt. */
export function describePreferences(p: Preferences) {
  const region = findRegion(p.region);
  return [
    `Style direction (chosen by the customer): ${p.styleDirection}. ${STYLE_DIRECTION_GUIDE[p.styleDirection]}`,
    `Regional taste (chosen by the customer): ${region.en}. ${region.trends}`,
    `Occasion: ${p.occasion}.`,
    `Preferred length: ${p.length}.`,
    p.skinToneOverride
      ? `The customer says their skin tone is ${p.skinToneOverride} on the Monk Skin Tone scale (1 = lightest, 10 = deepest). Trust this over your own estimate.`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}
