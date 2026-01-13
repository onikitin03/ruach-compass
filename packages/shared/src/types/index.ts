// ==========================================
// RUACH COMPASS - Core Types
// ==========================================

// Ruach State - internal state assessment
export type RuachState =
  | 'calm'      // Спокоен
  | 'tense'     // Напряжён
  | 'triggered' // Триггернут
  | 'focused'   // Сфокусирован
  | 'drained';  // Истощён

export const RUACH_STATE_RU: Record<RuachState, string> = {
  calm: 'Спокоен',
  tense: 'Напряжён',
  triggered: 'Триггернут',
  focused: 'Сфокусирован',
  drained: 'Истощён'
};

// Trigger types
export type TriggerType =
  | 'jealousy'    // Ревность
  | 'uncertainty' // Неизвестность
  | 'anger'       // Злость
  | 'shame'       // Стыд
  | 'loneliness'  // Одиночество
  | 'overwhelm';  // Перегруз

export const TRIGGER_TYPE_RU: Record<TriggerType, string> = {
  jealousy: 'Ревность',
  uncertainty: 'Неизвестность / тревога',
  anger: 'Злость',
  shame: 'Стыд',
  loneliness: 'Одиночество',
  overwhelm: 'Перегруз'
};

// Quest categories
export type QuestCategory =
  | 'micro'    // 5-15 min micro-action
  | 'medium'   // 30-60 min task
  | 'courage'  // discomfort zone stretch
  | 'creation' // build something
  | 'body';    // physical activity

export const QUEST_CATEGORY_RU: Record<QuestCategory, string> = {
  micro: 'Микро-действие',
  medium: 'Задача дня',
  courage: 'Зона смелости',
  creation: 'Творение',
  body: 'Тело'
};

// Quest type
export type QuestType = 'main' | 'side';

// Focus area for daily check-in
export type FocusArea = 'work' | 'relationship' | 'body' | 'creation';

export const FOCUS_AREA_RU: Record<FocusArea, string> = {
  work: 'Работа',
  relationship: 'Отношения',
  body: 'Тело',
  creation: 'Творчество'
};

// Tone preferences
export type TonePreference = 'warm' | 'direct' | 'philosophical';

export const TONE_PREFERENCE_RU: Record<TonePreference, string> = {
  warm: 'Тёплый и поддерживающий',
  direct: 'Прямой и чёткий',
  philosophical: 'Философский и глубокий'
};

// User values (multi-select)
export type UserValue =
  | 'dignity'        // Достоинство
  | 'honesty'        // Честность
  | 'actions'        // Действия > слова
  | 'meaning'        // Духовный смысл
  | 'independence'   // Независимость
  | 'growth'         // Рост
  | 'boundaries';    // Границы

export const USER_VALUE_RU: Record<UserValue, string> = {
  dignity: 'Достоинство',
  honesty: 'Честность',
  actions: 'Действия важнее слов',
  meaning: 'Духовный смысл',
  independence: 'Независимость',
  growth: 'Постоянный рост',
  boundaries: 'Здоровые границы'
};

// Scenario types for relationship scripts
export type ScenarioType =
  | 'provocation'    // Она провоцирует
  | 'accusation'     // Она обвиняет
  | 'coldness'       // Она уходит в холод
  | 'drama'          // Она устраивает драму
  | 'comparison'     // Она сравнивает с другими
  | 'silence'        // Она игнорирует
  | 'blame'          // Она обвиняет в контроле
  | 'testing'        // Она тестирует
  | 'manipulation'   // Манипуляция чувством вины
  | 'escalation';    // Эскалация конфликта

export const SCENARIO_TYPE_RU: Record<ScenarioType, string> = {
  provocation: 'Она провоцирует / подкалывает',
  accusation: 'Она обвиняет',
  coldness: 'Она уходит в холод',
  drama: 'Она устраивает драму',
  comparison: 'Она сравнивает с другими',
  silence: 'Она игнорирует / молчит',
  blame: 'Она говорит "ты контролируешь"',
  testing: 'Она тестирует реакцию',
  manipulation: 'Манипуляция чувством вины',
  escalation: 'Эскалация конфликта'
};

// ==========================================
// Data Models
// ==========================================

export interface UserProfile {
  id: string;
  language: 'ru';
  values: UserValue[];
  triggers: TriggerType[];
  preferredTone: TonePreference;
  trustAnchorWord: string; // Default: "ДОВЕРИЕ"
  boundariesStyle: 'firm' | 'gentle';
  createdAt: string;
  updatedAt: string;
}

export interface DailyState {
  id: string;
  date: string; // ISO date
  energy: number; // 1-10
  stress: number; // 1-10
  sleepHours: number;
  focus: FocusArea;
  relationshipIntensity?: number; // 1-10
  workIntensity?: number; // 1-10
  notes?: string;
  createdAt: string;
}

export interface Quest {
  id: string;
  date: string;
  type: QuestType;
  category: QuestCategory;
  titleRu: string;
  whyRu: string;
  stepsRu: string[];
  failSafeRu: string; // Low energy version
  done: boolean;
  outcomeNote?: string;
  helpedRating?: number; // 1-5
  createdAt: string;
  completedAt?: string;
}

export interface ScriptVariants {
  shortRu: string;      // Короткий ответ
  neutralRu: string;    // Нейтральный ответ
  boundaryRu: string;   // Граница
  exitRu: string;       // План выхода
}

export interface ConversationScript {
  id: string;
  scenarioType: ScenarioType;
  contextSummary?: string;
  variants: ScriptVariants;
  toneNotesRu: string;
  safetyFlags: string[];
  generatedAt: string;
}

export interface MemorySignals {
  userId: string;
  whatWorked: Record<string, number>;   // category -> count
  whatFailed: Record<string, number>;   // category -> count
  preferredQuestTypes: QuestCategory[];
  preferredTimes: string[];             // e.g., ["morning", "evening"]
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  mode: 'quick' | 'deep';
  eventRu: string;
  feelingRu: string;
  choiceRu: string;
  deepReflectionRu?: string;
  insightsRu?: string[];
  createdAt: string;
}

// ==========================================
// API Request/Response Types
// ==========================================

export interface QuestGenerationRequest {
  dailyState: DailyState;
  userProfile: Partial<UserProfile>;
  memorySignals?: Partial<MemorySignals>;
}

export interface QuestGenerationResponse {
  stateAssessment: {
    ruachState: RuachState;
    notesRu: string;
  };
  quests: Array<{
    type: QuestType;
    category: QuestCategory;
    titleRu: string;
    whyRu: string;
    stepsRu: string[];
    failSafeRu: string;
  }>;
  safetyFlags: string[];
  followupsRu: string[];
}

export interface ScriptGenerationRequest {
  scenarioType: ScenarioType;
  contextSummary?: string;
  userProfile: Partial<UserProfile>;
}

export interface ScriptGenerationResponse {
  scenario: ScenarioType;
  variants: ScriptVariants;
  toneNotesRu: string;
  safetyFlags: string[];
}

export interface ResetProtocolStep {
  type: 'label' | 'breath' | 'reframe' | 'action' | 'anchor';
  titleRu: string;
  contentRu: string;
  durationSeconds?: number;
}

export interface ResetProtocolResponse {
  trigger: TriggerType;
  steps: ResetProtocolStep[];
  trustAnchorRu: string;
}

// ==========================================
// Safety Types
// ==========================================

export type SafetyFlag =
  | 'self_harm_risk'
  | 'crisis_detected'
  | 'substance_mention'
  | 'severe_distress'
  | 'none';

export interface SafetyCheckResult {
  flags: SafetyFlag[];
  requiresIntervention: boolean;
  crisisResourcesNeeded: boolean;
  messageRu?: string;
}

// ==========================================
// Kabbalah Concepts (for reference)
// ==========================================

export interface KabbalahConcept {
  hebrewName: string;
  russianName: string;
  practicalMeaning: string;
}

export const KABBALAH_CONCEPTS: KabbalahConcept[] = [
  { hebrewName: 'Kli', russianName: 'Сосуд (кли)', practicalMeaning: 'Способность принять реальность без разрушения' },
  { hebrewName: 'Or', russianName: 'Свет (ор)', practicalMeaning: 'Энергия, ясность, любовь' },
  { hebrewName: 'Masach', russianName: 'Экран (масах)', practicalMeaning: 'Граница, фильтр намерения' },
  { hebrewName: 'Tzimtzum', russianName: 'Сжатие (цимцум)', practicalMeaning: 'Пауза перед реакцией' },
  { hebrewName: 'Tikkun', russianName: 'Исправление (тикун)', practicalMeaning: 'Направление роста, не наказание' },
  { hebrewName: 'Klipot', russianName: 'Скорлупы (клипот)', practicalMeaning: 'Эго-защиты, одержимость, параноидные петли' },
  { hebrewName: 'Bitachon', russianName: 'Доверие (битахон)', practicalMeaning: 'Я действую правильно; результат не в моём контроле' }
];
