import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function humanizeText(
  text: string,
  level: number
): Promise<string> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: `You are an expert text rewriter who makes AI-generated content sound authentically human.
Rewrite the given text to sound natural and human-written. Vary sentence lengths, use contractions, add occasional filler phrases, break predictable patterns, use active voice, and inject personality. Match the original meaning but make it feel authentically written by a person.
Level ${level}/10 intensity: at level 10, make heavy structural changes with significant rewording, different paragraph structures, and strong personality injection; at level 1, make only subtle tweaks like adding contractions and minor phrasing adjustments.
Return ONLY the rewritten text, no explanations or meta-commentary.`,
    messages: [
      {
        role: "user",
        content: text,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }
  return content.text;
}

export interface DetectionResult {
  score: number;
  signals: string[];
  verdict:
    | "Human"
    | "Likely Human"
    | "Mixed"
    | "Likely AI"
    | "AI Generated";
}

export async function detectAI(text: string): Promise<DetectionResult> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: `You are an AI content detection expert. Analyze the given text and determine the likelihood it was AI-generated.
Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{ "score": number (0-100, where 100 = definitely AI), "signals": string[] (list of 3-6 detected AI patterns or human signals), "verdict": "Human" | "Likely Human" | "Mixed" | "Likely AI" | "AI Generated" }`,
    messages: [
      {
        role: "user",
        content: text,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  const jsonText = content.text.trim();
  const result = JSON.parse(jsonText) as DetectionResult;
  return result;
}
