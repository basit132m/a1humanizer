import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
  1: "Make minimal changes only: fix 2–3 obvious AI phrases, add a contraction or two. Preserve structure entirely.",
  2: "Light touch: remove AI stock phrases, soften formal vocabulary, add natural flow in 10–15% of sentences.",
  3: "Mild rework: replace formal collocations, vary 2–3 sentence structures, add a contraction or casual aside.",
  4: "Moderate: restructure 20–30% of sentences, replace formal vocabulary, improve rhythm significantly.",
  5: "Balanced: rewrite roughly half the sentences for natural flow, add personality, vary length and rhythm.",
  6: "Natural: rewrite most sentences, inject first-person perspective where appropriate, add rhetorical touches.",
  7: "Strong: transform writing style throughout, inject strong personality, restructure paragraphs as needed.",
  8: "Heavy: aggressively rewrite for authenticity — parenthetical asides, self-corrections, deliberate imperfection.",
  9: "Intense: completely reimagine the expression — burstiness engineering, first-person voice, unexpected word choices.",
  10: "Maximum: total transformation — maintain only the core meaning; every technique active; make it unmistakably human.",
};

export async function humanizeText(
  text: string,
  level: number,
  style: StylePreset = "humanize",
  tone: TonePreset = "auto",
  purpose: PurposePreset = "general"
): Promise<string> {
  const levelInstruction = LEVEL_INSTRUCTIONS[level] ?? LEVEL_INSTRUCTIONS[5];

  const system = `You are an expert human writer who rewrites AI-generated text so it passes any detection test and reads as authentically human.

<style>${STYLE_DESCRIPTIONS[style]}</style>
<tone>${TONE_DESCRIPTIONS[tone]}</tone>
<purpose>${PURPOSE_DESCRIPTIONS[purpose]}</purpose>
<intensity>Level ${level}/10 — ${levelInstruction}</intensity>

<forbidden>
NEVER use these AI-signature phrases — delete or replace them entirely:
"Furthermore" | "Moreover" | "Additionally" | "In conclusion" | "In summary" | "To summarize" | "It is worth noting" | "It is important to note" | "It should be noted" | "It goes without saying" | "Needless to say" | "As previously mentioned" | "Without a doubt" | "It is clear that" | "It is evident that" | "This demonstrates" | "Plays a crucial role" | "Plays a vital role" | "Paradigm shift" | "Deep dive" | "Synergy" | "Delve into" | "Holistic approach" | "Leverage" (as verb) | "Utilize" (use "use") | "Facilitate" (use "help/allow") | "Streamline" | "Robust" | "Innovative solution" | "This is a testament to" | "In today's world" | "In today's fast-paced"
</forbidden>

<techniques>
- Vary sentence lengths dramatically: mix short sentences (4–8 words) with longer ones (20–30 words) — this burstiness is the #1 human signal
- Use contractions naturally: don't, can't, won't, it's, I've, you'd, we're, they're
- Prefer active voice; passive voice is fine occasionally but not as default
- Replace vague generalities with concrete specifics ("many" → "three major")
- Allow natural thought development: occasional parenthetical aside, a rhetorical question, a brief self-correction
- Replace formal collocations: "in order to" → "to", "due to the fact that" → "because", "a large number of" → "plenty of", "has the ability to" → "can"
- Inject personality appropriate to the style — academic can still be interesting, technical can still be clear
- Deliberate minor imperfection (level 7+): a mid-sentence realization, an informal aside in parentheses
- Do NOT over-edit text that is already natural — preserve what works
</techniques>

Return ONLY the rewritten text. No explanations, no preamble, no "Here is the rewritten version:". Preserve the original language — do NOT translate.`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    system,
    messages: [{ role: "user", content: text }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");
  return content.text;
}

export interface DetectionResult {
  score: number;
  signals: string[];
  verdict: "Human" | "Likely Human" | "Mixed" | "Likely AI" | "AI Generated";
}

export async function detectAI(text: string): Promise<DetectionResult> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: `You are an expert AI content forensics analyst. Analyze the text for AI-generation signals.

<task>
Determine the probability this text was AI-generated. Look for:
- Repetitive sentence structures and predictable rhythm
- Stock AI phrases (furthermore, moreover, it is worth noting, etc.)
- Excessive hedging or formal vocabulary
- Lack of personal anecdotes, imperfections, or authentic voice
- Uniform sentence length (low burstiness)
- Passive voice overuse
- Generic transitions and template endings
- Contractions and colloquialisms (indicate human writing)
</task>

Return ONLY valid JSON — no markdown, no explanation:
{"score": number (0-100, 100=definitely AI), "signals": string[] (4-7 specific observations), "verdict": "Human"|"Likely Human"|"Mixed"|"Likely AI"|"AI Generated"}`,
    messages: [{ role: "user", content: text }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  const raw = content.text.trim().replace(/^```json?\s*/i, "").replace(/\s*```$/i, "");
  return JSON.parse(raw) as DetectionResult;
}
