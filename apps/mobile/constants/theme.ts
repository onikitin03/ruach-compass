// ==========================================
// Ruach Compass Theme Constants
// ==========================================

export const Colors = {
  // Primary palette - deep, masculine, calm
  primary: '#4a90d9',      // Trust blue
  primaryDark: '#2d5a87',
  primaryLight: '#7eb3ed',

  // Background
  background: '#0f0f1a',   // Deep night
  backgroundLight: '#1a1a2e',
  backgroundCard: '#252542',

  // Text
  text: '#e8e8f0',
  textSecondary: '#9898b0',
  textMuted: '#606080',

  // Accent colors for states
  calm: '#4ade80',         // Green - calm
  tense: '#fbbf24',        // Yellow - tense
  triggered: '#f87171',    // Red - triggered
  focused: '#60a5fa',      // Blue - focused
  drained: '#a78bfa',      // Purple - drained

  // Functional
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Trust anchor
  trustGold: '#d4a853',

  // Borders
  border: '#3a3a5a',
  borderLight: '#4a4a6a',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  title: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Ruach state colors mapping
export const RuachStateColors: Record<string, string> = {
  calm: Colors.calm,
  tense: Colors.tense,
  triggered: Colors.triggered,
  focused: Colors.focused,
  drained: Colors.drained,
};

// Quest category colors
export const QuestCategoryColors: Record<string, string> = {
  micro: '#60a5fa',
  medium: '#4ade80',
  courage: '#f87171',
  creation: '#a78bfa',
  body: '#fbbf24',
};
