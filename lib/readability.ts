function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;
  const stripped = w.replace(/e$/, "");
  const matches = stripped.match(/[aeiou]+/g);
  return Math.max(1, matches ? matches.length : 1);
}

export interface ReadabilityResult {
  fleschReadingEase: number;
  fleschKincaidGrade: number;
  readingTimeMin: number;
  wordCount: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
  ease: string;
}

export function computeReadability(text: string): ReadabilityResult {
  const raw = text.trim();
  if (!raw) {
    return {
      fleschReadingEase: 0,
      fleschKincaidGrade: 0,
      readingTimeMin: 0,
      wordCount: 0,
      sentenceCount: 0,
      avgWordsPerSentence: 0,
      ease: "N/A",
    };
  }

  const sentences = raw.match(/[^.!?]+[.!?]+/g) ?? [raw];
  const words = raw.trim().split(/\s+/).filter((w) => w.length > 0);
  const syllables = words.reduce((s, w) => s + countSyllables(w), 0);

  const sc = Math.max(1, sentences.length);
  const wc = Math.max(1, words.length);

  const asl = wc / sc; // avg sentence length (words)
  const asw = syllables / wc; // avg syllables per word

  const fre = Math.round(
    Math.max(0, Math.min(100, 206.835 - 1.015 * asl - 84.6 * asw))
  );
  const fk = Math.max(
    0,
    Math.round((0.39 * asl + 11.8 * asw - 15.59) * 10) / 10
  );
  const readingTimeMin = Math.max(1, Math.ceil(wc / 200));

  let ease: string;
  if (fre >= 90) ease = "Very Easy";
  else if (fre >= 80) ease = "Easy";
  else if (fre >= 70) ease = "Fairly Easy";
  else if (fre >= 60) ease = "Standard";
  else if (fre >= 50) ease = "Fairly Difficult";
  else if (fre >= 30) ease = "Difficult";
  else ease = "Very Difficult";

  return {
    fleschReadingEase: fre,
    fleschKincaidGrade: fk,
    readingTimeMin,
    wordCount: wc,
    sentenceCount: sc,
    avgWordsPerSentence: Math.round(asl * 10) / 10,
    ease,
  };
}
