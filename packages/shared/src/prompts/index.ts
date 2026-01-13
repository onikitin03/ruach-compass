// ==========================================
// Prompt Templates Index
// ==========================================

export * from './templates/quest-generation';
export * from './templates/script-generation';
export * from './templates/reset-protocol';
export * from './templates/safety';

// Prompt version registry for tracking
export const PROMPT_VERSIONS = {
  questGeneration: '1.0.0',
  scriptGeneration: '1.0.0',
  resetProtocol: '1.0.0',
  safety: '1.0.0'
} as const;
