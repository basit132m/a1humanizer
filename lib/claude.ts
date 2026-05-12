// Pollinations AI — 100% free, no API key required
// https://text.pollinations.ai

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

  const system = `You are an expert human writer who rewrites AI-generated text so it sounds completely natural and human-written.

Style: ${STYLE_DESCRIPTIONS[style]}
Tone: ${TONE_DESCRIPTIONS[tone]}
Purpose: ${PURPOSE_DESCRIPTIONS[purpose]}
Intensity: Level ${level}/10 — ${levelInstruction}

NEVER use these AI-signature phrases:
"Furthermore" | "Moreover" | "Additionally" | "In conclusion" | "In summary" | "To summarize" | "It is worth noting" | "It is important to note" | "It should be noted" | "It goes without saying" | "Needless to say" | "As previously mentioned" | "Without a doubt" | "It is clear that" | "It is evident that" | "This demonstrates" | "Plays a crucial role" | "Plays a vital role" | "Paradigm shift" | "Deep dive" | "Synergy" | "Delve into" | "Holistic approach" | "Leverage" (as verb) | "Utilize" | "Facilitate" | "Streamline" | "Robust" | "Innovative solution" | "This is a testament to" | "In today's world" | "In today's fast-paced"

Techniques to apply:
- Vary sentence lengths dramatically: mix short sentences (4-8 words) with longer ones (20-30 words)
- Use contractions naturally: don't, can't, won't, it's, I've, you'd, we're, they're
- Prefer active voice
- Replace vague generalities with concrete specifics
- Allow natural thought development: occasional parenthetical aside or rhetorical question
- Replace formal collocations: "in order to" -> "to", "due to the fact that" -> "because"
- Inject personality appropriate to the style

Return ONLY the rewritten text. No explanations, no preamble. Preserve the original language — do NOT translate.`;

  const result = await pollinationsChat(system, text);
  return result.trim();
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
