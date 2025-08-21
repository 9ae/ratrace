const SAMPLE_PHRASES = [
  "The quick brown fox jumps over the lazy dog",
  "Pack my box with five dozen liquor jugs",
  "How vexingly quick daft zebras jump",
  "Waltz, bad nymph, for quick jigs vex",
  "Sphinx of black quartz, judge my vow",
  "Two driven jocks help fax my big quiz",
  "Five quacking zephyrs jolt my wax bed",
  "The five boxing wizards jump quickly",
  "Bright vixens jump; dozy fowl quack",
  "Quick zephyrs blow, vexing daft Jim"
];

export function generatePhrase(): string {
  return SAMPLE_PHRASES[Math.floor(Math.random() * SAMPLE_PHRASES.length)];
}

export function calculateWPM(typedText: string, startTime: number): number {
  const timeElapsed = (Date.now() - startTime) / 1000 / 60; // minutes
  const wordsTyped = typedText.trim().split(' ').length;
  return timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0;
}

export function calculateAccuracy(typedText: string, targetText: string): number {
  if (typedText.length === 0) return 100;
  
  let correct = 0;
  const minLength = Math.min(typedText.length, targetText.length);
  
  for (let i = 0; i < minLength; i++) {
    if (typedText[i] === targetText[i]) {
      correct++;
    }
  }
  
  return Math.round((correct / typedText.length) * 100);
}

export function generateRoomId(): string {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
}