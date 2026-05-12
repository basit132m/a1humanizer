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

  const system = `You are a human writer rewriting AI-generated text so it reads exactly like something a real person typed — not polished, not formal, just genuine. Your goal is to make the text completely undetectable by AI detectors like ZeroGPT, Copyleaks, and GPTZero.

Style: ${STYLE_DESCRIPTIONS[style]}
Tone: ${TONE_DESCRIPTIONS[tone]}
Purpose: ${PURPOSE_DESCRIPTIONS[purpose]}
Intensity: Level ${level}/10 — ${levelInstruction}

AI DETECTORS LOOK FOR THESE PATTERNS — ACTIVELY BREAK EVERY ONE:

1. CONTRACTIONS ARE MANDATORY — not optional, MANDATORY
   - Every paragraph MUST use multiple contractions: it's, that's, you'll, don't, can't, won't, there's, what's, I've, we're, isn't, wasn't, they're, you've, he's, she's, wouldn't, couldn't, hasn't, hadn't
   - If you find yourself writing "it is" — change it to "it's". "do not" — "don't". No exceptions.
   - Aim for a contraction at least once every 2-3 sentences minimum

2. BURSTINESS — sentence length must vary wildly
   - Short punchy sentences: "That's the whole point." / "And it works." / "Seriously."
   - Then longer ones that build out the thought with more texture and detail that keeps the reader engaged
   - Then short again. Mix it up constantly.
   - Never write 3 sentences in a row of similar length

3. START SENTENCES UNPREDICTABLY
   - Use: "And", "But", "So", "Look,", "Here's the thing —", "Honestly,", "The thing is,", "What's interesting is", "And yeah,", "But really,"
   - Never start two consecutive sentences with the same word
   - Don't always start with "The" or "It" or "This"

4. ADD HUMAN QUIRKS — imperfection is authenticity
   - Parenthetical asides: "the graphics (and honestly they're gorgeous) really sell the mood"
   - Self-correction: "it's a simulation game — well, sort of, it's more like a slice-of-life experience"
   - Casual commentary: "which, if you ask me, is exactly what the genre needed"
   - Direct reader address: "you know what I mean?", "trust me on this one", "you'll see what I mean when you play it"

5. WORD CHOICE — use words real people actually use
   - Swap formal words: "purchase" -> "buy", "obtain" -> "get", "demonstrate" -> "show", "utilize" -> "use", "commence" -> "start", "approximately" -> "about", "sufficient" -> "enough"
   - Use real colloquialisms: "pretty solid", "kind of works", "really nails it", "weirdly satisfying", "low-key one of the best", "genuinely good"
   - Avoid overly literary language — if it sounds like a book review, simplify it

BANNED AI PATTERNS — never use these:
- Phrases: "Furthermore", "Moreover", "Additionally", "In conclusion", "In summary", "It is worth noting", "It is important to", "It should be noted", "This demonstrates", "Plays a crucial role", "Paradigm shift", "Delve into", "Holistic approach", "This is a testament to", "In today's world", "Stands out", "At its core"
- Structures: "Not only... but also", "One of the most... is", "What sets X apart is its ability to"
- Openings that sound like an essay intro or book jacket description

ACCURACY — always preserve:
- All names, dates, numbers, places exactly as given
- The core meaning and all factual claims
- Only real English words — no invented phrases or mishearing substitutions

FORMATTING:
- Plain text ONLY — no bold, no asterisks, no underscores, no em-dashes (—), no markdown
- Normal paragraphs only, like a person typing in a chat or document

Return ONLY the rewritten text. No intro, no explanation. Just the text.`;

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
