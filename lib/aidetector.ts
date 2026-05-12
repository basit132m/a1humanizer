// Local pattern-based AI detection — all client-safe, no API needed

export const AI_PHRASE_LIST = [
  "furthermore",
  "moreover",
  "additionally",
  "in conclusion",
  "in summary",
  "to summarize",
  "it is worth noting",
  "it is important to note",
  "it should be noted",
  "it goes without saying",
  "needless to say",
  "as previously mentioned",
  "without a doubt",
  "it is clear that",
  "it is evident that",
  "this demonstrates",
  "this illustrates",
  "plays a crucial role",
  "plays a vital role",
  "plays a key role",
  "paradigm shift",
  "deep dive",
  "synergy",
  "delve into",
  "holistic approach",
  "leverage" ,
  "utilize",
  "facilitate",
  "streamline",
  "robust solution",
  "innovative solution",
  "it's crucial to",
  "this is a testament to",
  "in today's world",
  "in the modern era",
  "in today's fast-paced",
  "whether you are",
  "at the end of the day",
  "the bottom line is",
  "as we can see",
  "it is undeniable",
  "in light of",
  "underscores the importance",
  "highlights the importance",
  "emphasizes the importance",
];

const HEDGING_WORDS = [
  "may ", "might ", "could ", "possibly", "perhaps",
  "it seems", "appears to", "tend to", "generally speaking",
  "in most cases", "typically", "often",
];

const TRANSITION_WORDS = [
  "furthermore", "moreover", "additionally", "however", "therefore",
  "consequently", "nevertheless", "nonetheless", "in contrast",
  "on the other hand", "as a result", "thus", "hence",
];

const TEMPLATE_STARTS = [
  "in conclusion", "in summary", "to summarize", "to conclude",
  "in this", "this essay", "this article", "this paper",
  "as mentioned", "as discussed", "as stated", "as noted",
  "it is important", "it is crucial", "it is essential",
];

export interface SentenceScore {
  text: string;
  label: "human" | "maybe" | "ai";
  score: number;
  reasons: string[];
}

export interface LocalDetectionMetrics {
  burstiness: number;          // 0-100: higher = more human-like variation
  vocabularyDiversity: number; // 0-100: unique word ratio
  passiveVoiceRatio: number;   // 0-100: higher = more passive = more AI-like
  aiPhraseDensity: number;     // 0-100: higher = more AI phrases found
  hedgingRatio: number;        // 0-100: higher = more hedging = more AI-like
  transitionRatio: number;     // 0-100: higher = more transitions = more AI-like
  sentenceStartDiversity: number; // 0-100: higher = more diverse starts = more human
  contractionRatio: number;    // 0-100: higher = more contractions = more human
  avgSentenceLength: number;   // raw words per sentence
  repeatedTrigramRatio: number; // 0-100: higher = more repeated = more AI-like
  foundPhrases: string[];
  sentenceScores: SentenceScore[];
  overallLocalScore: number;   // 0-100: overall AI likelihood
}

function getSentences(text: string): string[] {
  return (text.match(/[^.!?]+[.!?]+/g) ?? [text]).map((s) => s.trim()).filter(Boolean);
}

function getWords(text: string): string[] {
  return text.toLowerCase().replace(/[^\w\s']/g, "").split(/\s+/).filter((w) => w.length > 0);
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((s, x) => s + (x - mean) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

export function analyzeText(text: string): LocalDetectionMetrics {
  const sentences = getSentences(text);
  const words = getWords(text);
  const lower = text.toLowerCase();

  if (words.length < 10) {
    return {
      burstiness: 50, vocabularyDiversity: 50, passiveVoiceRatio: 0,
      aiPhraseDensity: 0, hedgingRatio: 0, transitionRatio: 0,
      sentenceStartDiversity: 50, contractionRatio: 50,
      avgSentenceLength: 0, repeatedTrigramRatio: 0,
      foundPhrases: [], sentenceScores: [], overallLocalScore: 50,
    };
  }

  // 1. Burstiness — sentence length std dev (higher std = more human)
  const sentLengths = sentences.map((s) => getWords(s).length);
  const burstinessRaw = stdDev(sentLengths);
  const burstiness = Math.round(Math.min(100, burstinessRaw * 6)); // normalize

  // 2. Vocabulary diversity
  const uniqueWords = new Set(words).size;
  const vocabDiversity = Math.round((uniqueWords / words.length) * 100);

  // 3. Passive voice
  const passiveMatches = (text.match(/\b(is|are|was|were|been|be)\s+\w+(ed|en)\b/gi) ?? []).length;
  const passiveVoiceRatio = Math.round(Math.min(100, (passiveMatches / sentences.length) * 50));

  // 4. AI phrase density
  const foundPhrases: string[] = [];
  for (const phrase of AI_PHRASE_LIST) {
    if (lower.includes(phrase)) foundPhrases.push(phrase);
  }
  const aiPhraseDensity = Math.round(Math.min(100, (foundPhrases.length / (words.length / 100)) * 20));

  // 5. Hedging ratio
  let hedgeCount = 0;
  for (const h of HEDGING_WORDS) {
    const re = new RegExp(h.trim(), "gi");
    hedgeCount += (text.match(re) ?? []).length;
  }
  const hedgingRatio = Math.round(Math.min(100, (hedgeCount / sentences.length) * 30));

  // 6. Transition word ratio
  let transCount = 0;
  for (const t of TRANSITION_WORDS) {
    const re = new RegExp(`\\b${t}\\b`, "gi");
    transCount += (text.match(re) ?? []).length;
  }
  const transitionRatio = Math.round(Math.min(100, (transCount / sentences.length) * 40));

  // 7. Sentence start diversity
  const starts = sentences.map((s) => getWords(s)[0] ?? "").filter(Boolean);
  const uniqueStarts = new Set(starts).size;
  const sentenceStartDiversity = Math.round((uniqueStarts / Math.max(1, starts.length)) * 100);

  // 8. Contraction ratio
  const contractionMatches = (text.match(/\b\w+n't\b|\bI'm\b|\bI've\b|\bI'd\b|\bI'll\b|\bwe're\b|\bthey're\b|\bit's\b|\bhe's\b|\bshe's\b|\bthat's\b|\bwon't\b|\bcan't\b|\bisn't\b|\baren't\b|\bwasn't\b|\bweren't\b/gi) ?? []).length;
  const contractionRatio = Math.round(Math.min(100, (contractionMatches / (words.length / 10)) * 30));

  // 9. Avg sentence length
  const avgSentenceLength = Math.round((words.length / sentences.length) * 10) / 10;

  // 10. Repeated trigram ratio
  const trigrams: Record<string, number> = {};
  for (let i = 0; i < words.length - 2; i++) {
    const tg = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
    trigrams[tg] = (trigrams[tg] ?? 0) + 1;
  }
  const repeatedTrigrams = Object.values(trigrams).filter((c) => c > 1).length;
  const repeatedTrigramRatio = Math.round(
    Math.min(100, (repeatedTrigrams / Math.max(1, Object.keys(trigrams).length)) * 100)
  );

  // Per-sentence scoring
  const sentenceScores: SentenceScore[] = sentences.map((s) => {
    const sl = s.toLowerCase();
    let score = 0;
    const reasons: string[] = [];

    // AI phrases in sentence
    const phraseHits = AI_PHRASE_LIST.filter((p) => sl.includes(p));
    if (phraseHits.length > 0) {
      score += phraseHits.length * 25;
      reasons.push(`AI phrase: "${phraseHits[0]}"`);
    }

    // Passive voice
    if (/\b(is|are|was|were|been|be)\s+\w+(ed|en)\b/i.test(s)) {
      score += 15;
      reasons.push("Passive voice");
    }

    // Very long sentence
    const wc = getWords(s).length;
    if (wc > 35) { score += 20; reasons.push("Very long sentence"); }
    else if (wc > 25) { score += 10; }

    // Template start
    const firstWords = sl.trim().slice(0, 30);
    if (TEMPLATE_STARTS.some((ts) => firstWords.startsWith(ts))) {
      score += 25;
      reasons.push("Template sentence start");
    }

    // Hedging
    if (HEDGING_WORDS.some((h) => sl.includes(h.trim()))) {
      score += 10;
      reasons.push("Hedging language");
    }

    const clampedScore = Math.min(100, score);
    return {
      text: s,
      score: clampedScore,
      label: clampedScore >= 40 ? "ai" : clampedScore >= 20 ? "maybe" : "human",
      reasons,
    };
  });

  // Overall local score (weighted combination)
  // AI indicators (high = more AI): passiveVoice, aiPhraseDensity, hedging, transition, repeatedTrigrams, longSentences
  // Human indicators (high = more human): burstiness, vocabDiversity, contractions, sentenceStartDiversity
  const aiScore = Math.round(
    passiveVoiceRatio * 0.10 +
    aiPhraseDensity * 0.30 +
    hedgingRatio * 0.10 +
    transitionRatio * 0.10 +
    repeatedTrigramRatio * 0.10 +
    Math.max(0, (avgSentenceLength - 15) * 2) * 0.10 + // long sentences → AI
    Math.max(0, 100 - burstiness) * 0.10 +
    Math.max(0, 100 - vocabDiversity) * 0.05 +
    Math.max(0, 100 - sentenceStartDiversity) * 0.05 +
    Math.max(0, 100 - contractionRatio) * 0.10
  );

  return {
    burstiness,
    vocabularyDiversity: vocabDiversity,
    passiveVoiceRatio,
    aiPhraseDensity,
    hedgingRatio,
    transitionRatio,
    sentenceStartDiversity,
    contractionRatio,
    avgSentenceLength,
    repeatedTrigramRatio,
    foundPhrases,
    sentenceScores,
    overallLocalScore: Math.min(100, Math.max(0, aiScore)),
  };
}
