import { getRandomPhrase } from '../data/phrases';

export function generatePhrase(): string {
  return getRandomPhrase();
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
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}