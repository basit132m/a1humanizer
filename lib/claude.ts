// Pollinations AI — 100% free, no API key required
// https://text.pollinations.ai

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")   // **bold**
    .replace(/\*(.+?)\*/g, "$1")        // *italic*
    .replace(/__(.+?)__/g, "$1")        // __bold__
    .replace(/_(.+?)_/g, "$1")          // _italic_
    .replace(/~~(.+?)~~/g, "$1")        // ~~strikethrough~~
    .replace(/#{1,6}\s+/g, "")          // ## headers
    .replace(/\[(.+?)\]\(.+?\)/g, "$1") // [links](url)
    .replace(/`(.+?)`/g, "$1")          // `code`
    .replace(/^\s*[-*+]\s+/gm, "")      // bullet points
    .replace(/^\s*\d+\.\s+/gm, "")      // numbered lists
    .replace(/—/g, "-")            // em-dash → hyphen
    .replace(/–/g, "-")            // en-dash → hyphen
    .replace(/​/g, "")             // zero-width spaces
    .replace(/\n{3,}/g, "\n\n")         // max 2 newlines
    .trim();
}

export type StylePreset =
  | "humanize"
  | "academic"
  | "professional"
  | "casual"
  | "creative"
  | "technical";

export type TonePreset =
  | "auto"
  | "conversational"
  | "journalistic"
  | "persuasive"
  | "storytelling"
  | "analytical"
  | "formal";

export type PurposePreset =
  | "general"
  | "essay"
  | "article"
  | "email"
  | "marketing"
  | "report"
  | "story"
  | "social";

const STYLE_DESCRIPTIONS: Record<StylePreset, string> = {
  humanize: "Natural, authentic human voice — conversational where appropriate, personal and relatable",
  academic: "Scholarly but readable — clear argumentation, appropriate academic terminology, not robotic",
  professional: "Business-grade writing — clear, confident, concise, polished without being stiff",
  casual: "Relaxed and friendly — everyday language, informal phrasing, like texting a smart friend",
  creative: "Expressive and varied — engaging narrative style, vivid descriptions, interesting rhythm",
  technical: "Precise and clear — technical terminology preserved, accurate, structured for experts",
};

const TONE_DESCRIPTIONS: Record<TonePreset, string> = {
  auto: "Match the tone of the original text naturally",
  conversational: "Warm and direct, like talking to someone face-to-face",
  journalistic: "Objective, fact-focused, clear reporting style",
  persuasive: "Compelling and emotionally engaging, builds toward a call to action",
  storytelling: "Narrative-driven, descriptive, draws the reader in",
  analytical: "Logical, evidence-based, structured reasoning",
  formal: "Professional and dignified, traditional register",
};

const PURPOSE_DESCRIPTIONS: Record<PurposePreset, string> = {
  general: "No specific context — just sound human",
  essay: "Academic essay with clear thesis and structured argument",
  article: "Engaging article or blog post meant for online readers",
  email: "Professional or friendly email communication",
  marketing: "Persuasive marketing copy that converts",
  report: "Business or research report — informative and structured",
  story: "Creative writing — narrative and character-driven",
  social: "Social media post — punchy, concise, shareable",
};

const LEVEL_INSTRUCTIONS: Record<number, string> = {
  1: "Make minimal changes only: fix 2-3 obvious AI phrases, add a contraction or two. Preserve structure entirely.",
  2: "Light touch: remove AI stock phrases, soften formal vocabulary, add natural flow in 10-15% of sentences.",
  3: "Mild rework: replace formal collocations, vary 2-3 sentence structures, add a contraction or casual aside.",
  4: "Moderate: restructure 20-30% of sentences, replace formal vocabulary, improve rhythm significantly.",
  5: "Balanced: rewrite roughly half the sentences for natural flow, add personality, vary length and rhythm.",
  6: "Natural: rewrite most sentences, inject first-person perspective where appropriate, add rhetorical touches.",
  7: "Strong: transform writing style throughout, inject strong personality, restructure paragraphs as needed.",
  8: "Heavy: aggressively rewrite for authenticity — parenthetical asides, self-corrections, deliberate imperfection.",
  9: "Intense: completely reimagine the expression — burstiness engineering, first-person voice, unexpected word choices.",
  10: "Maximum: total transformation — maintain only the core meaning; every technique active; make it unmistakably human.",
};

async function pollinationsChat(
  systemPrompt: string,
  userMessage: string,
  seed?: number
): Promise<string> {
  const response = await fetch("https://text.pollinations.ai/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      model: "openai",
      private: true,
      seed: seed ?? Math.floor(Math.random() * 999999),
    }),
  });

  if (!response.ok) {
    throw new Error(`Pollinations API error: ${response.status}`);
  }

  return await response.text();
}

export async function humanizeText(
  text: string,
  level: number,
  style: StylePreset = "humanize",
  tone: TonePreset = "auto",
  purpose: PurposePreset = "general"
): Promise<string> {
  const levelInstruction = LEVEL_INSTRUCTIONS[level] ?? LEVEL_INSTRUCTIONS[5];

  const system = `You are a real human being who just read the text given to you. Now you are rewriting it to explain it naturally to another person — like you're talking to a friend, colleague, or reader. You genuinely understand what was said, and now you're putting it in your own words.

Style: ${STYLE_DESCRIPTIONS[style]}
Tone: ${TONE_DESCRIPTIONS[tone]}
Purpose: ${PURPOSE_DESCRIPTIONS[purpose]}
Intensity: Level ${level}/10 — ${levelInstruction}

YOUR MINDSET WHILE WRITING:
- You READ the original. You UNDERSTOOD it. Now you are TELLING someone about it in your own voice.
- Write like you are genuinely communicating, not just swapping words around
- Address the reader naturally — use "you", "you'll find", "what you get here"
- Show genuine reaction: "what makes this special is...", "the interesting part is...", "honestly...", "the thing is..."
- Let your personality come through — a real person wrote this, not a machine
- If something is impressive, sound impressed. If something is interesting, sound interested.
- Keep the energy consistent from first sentence to last — don't let the final sentence drag or run long
- Use the rhythm of natural speech — some sentences are short. Others are longer and build on the point you're making.

ACCURACY AND WORD CHOICE:
- Use only real, correct English words — do NOT invent words, mishear words, or use near-homophone substitutions
- If you choose a casual or colloquial phrase, make sure it is an actual phrase that real people say: "grab a proper coffee" not "poster coffee", "kicked back" not "knacked out"
- When in doubt about a casual phrase, use plain clear English instead — clarity beats forced casualness
- Keep all factual details (names, dates, places, numbers) exactly as they appear in the original

CRITICAL FORMATTING RULES:
- Plain text ONLY — NO bold, NO asterisks (*), NO underscores, NO em-dashes (—)
- NO markdown, NO bullet points, NO headers
- Normal paragraphs only, like a human typing in a text editor

NEVER use these robotic AI phrases:
"Furthermore" | "Moreover" | "Additionally" | "In conclusion" | "In summary" | "It is worth noting" | "It is important to note" | "It should be noted" | "It goes without saying" | "Without a doubt" | "It is clear that" | "This demonstrates" | "Plays a crucial role" | "Paradigm shift" | "Deep dive" | "Synergy" | "Delve into" | "Holistic approach" | "Utilize" | "Facilitate" | "Streamline" | "This is a testament to" | "In today's world"

NATURAL LANGUAGE TECHNIQUES:
- Use contractions freely: don't, can't, won't, it's, I've, you'd, we're, that's, what's
- Replace stiff collocations: "in order to" -> "to", "due to the fact that" -> "because", "a large number of" -> "plenty of", "has the ability to" -> "can"
- Add natural connectors: "and honestly", "what's cool is", "the thing that stands out", "beyond that", "what really works here"
- Vary your sentence rhythm — short punch. Then a longer sentence that develops the thought more fully and gives the reader more to work with.
- One idea per sentence usually, but let ideas flow into each other naturally
- End strong — your last sentence should feel like a satisfying close, not a trailing afterthought

Return ONLY the rewritten plain text. No explanations. No "Here is the rewritten version:". Just the text itself.`;

  const result = await pollinationsChat(system, text);
  return stripMarkdown(result.trim());
}

export interface DetectionResult {
  score: number;
  signals: string[];
  verdict: "Human" | "Likely Human" | "Mixed" | "Likely AI" | "AI Generated";
}

export async function detectAI(text: string): Promise<DetectionResult> {
  const system = `You are an AI content detection expert. Analyze the text for AI-generation signals.

Look for:
- Repetitive sentence structures and predictable rhythm
- Stock AI phrases (furthermore, moreover, it is worth noting, etc.)
- Excessive hedging or formal vocabulary
- Lack of personal voice or authentic imperfections
- Uniform sentence length (low burstiness)
- Passive voice overuse
- Generic transitions and template endings
- Contractions and colloquialisms (indicate human writing)

You MUST respond with ONLY a valid JSON object — no markdown, no extra text, just raw JSON:
{"score": <number 0-100>, "signals": ["signal1","signal2","signal3","signal4"], "verdict": "<Human|Likely Human|Mixed|Likely AI|AI Generated>"}

Where score 0 = definitely human, 100 = definitely AI.`;

  const raw = await pollinationsChat(system, text);

  // Extract JSON from response — handle cases where model adds extra text
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse detection result");
  }

  return JSON.parse(jsonMatch[0]) as DetectionResult;
}
