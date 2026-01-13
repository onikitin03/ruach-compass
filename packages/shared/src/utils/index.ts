// ==========================================
// Shared Utilities
// ==========================================

import { v4 as uuidv4 } from 'uuid';

// Generate UUID (with fallback for React Native which lacks crypto.getRandomValues)
export const generateId = (): string => {
  try {
    return uuidv4();
  } catch {
    // Fallback for environments without crypto.getRandomValues (React Native)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
};

// Get current ISO date string (YYYY-MM-DD)
export const getISODate = (date: Date = new Date()): string => {
  return date.toISOString().split('T')[0];
};

// Get current ISO datetime string
export const getISODateTime = (date: Date = new Date()): string => {
  return date.toISOString();
};

// Parse JSON safely with fallback
export const safeParseJSON = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
};

// Extract JSON from AI response (handles markdown code blocks)
export const extractJSON = (text: string): string => {
  // Try to find JSON in code blocks first
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Try to find JSON object directly
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  return text;
};

// Clamp number to range
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

// Simple text safety check (client-side pre-filter)
export const containsSafetyKeywords = (text: string): boolean => {
  const lowered = text.toLowerCase();
  const keywords = [
    'убить себя', 'покончить', 'суицид', 'не хочу жить',
    'хочу умереть', 'конец всему'
  ];
  return keywords.some(keyword => lowered.includes(keyword));
};

// Format duration in Russian
export const formatDurationRu = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds} сек`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) {
    return `${minutes} мин`;
  }
  return `${minutes} мин ${remainingSeconds} сек`;
};

// Determine quest difficulty based on state
export const determineQuestDifficulty = (energy: number, stress: number): 'easy' | 'medium' | 'hard' => {
  const score = energy - stress;
  if (score <= -3) return 'easy';
  if (score >= 3) return 'hard';
  return 'medium';
};

// Rate limiter helper
export class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return this.requests.length < this.maxRequests;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  getWaitTime(): number {
    if (this.canMakeRequest()) return 0;
    const oldestRequest = this.requests[0];
    return this.windowMs - (Date.now() - oldestRequest);
  }
}
