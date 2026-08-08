export type TargetLang = "en" | "zh-Hant-HK" | "zh-Hans-CN";

export const LANG_LABELS: Record<TargetLang, string> = {
  en: "English",
  "zh-Hant-HK": "繁體中文",
  "zh-Hans-CN": "简体中文",
};

export const LANG_INSTRUCTIONS: Record<TargetLang, string> = {
  en: "English",
  "zh-Hant-HK":
    "Traditional Chinese as written in Hong Kong (zh-Hant-HK). Use Hong Kong vocabulary, not Mainland or Taiwan terms.",
  "zh-Hans-CN":
    "Simplified Chinese as written in Mainland China (zh-Hans-CN). Use Mainland vocabulary.",
};

const TRANSLATION_MODEL =
  process.env.ENOSIS_TRANSLATION_MODEL ||
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free";

export interface TranslationResult {
  translated: string;
  source_lang: string;
  target_lang: TargetLang;
}

export async function translateText(
  text: string,
  target: TargetLang
): Promise<TranslationResult | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || !text.trim()) return null;

  const instruction = LANG_INSTRUCTIONS[target];
  const system = `You are a trade document translator. Translate the user's text into ${instruction}. Keep numbers, codes, HS codes, units, and company names unchanged. Return only the translation, no commentary, no quotes, no markdown.`;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://enosis.jonathansimpson.co",
        "X-Title": "Enosis Demo",
      },
      body: JSON.stringify({
        model: TRANSLATION_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: text.slice(0, 4000) },
        ],
        temperature: 0.1,
        max_tokens: 1500,
      }),
    });

    if (!res.ok) {
      console.error("[enosis-translate] API error:", res.status);
      return null;
    }

    const data = await res.json();
    const translated: string =
      data?.choices?.[0]?.message?.content?.trim() || "";
    if (!translated) return null;

    return { translated, source_lang: "auto", target_lang: target };
  } catch (err) {
    console.error("[enosis-translate] failed:", err);
    return null;
  }
}
