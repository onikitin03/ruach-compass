import { z } from 'zod';

// ==========================================
// RUACH COMPASS - Zod Schemas
// ==========================================

// Enums as Zod schemas
export const RuachStateSchema = z.enum(['calm', 'tense', 'triggered', 'focused', 'drained']);

export const TriggerTypeSchema = z.enum([
  'jealousy', 'uncertainty', 'anger', 'shame', 'loneliness', 'overwhelm'
]);

export const QuestCategorySchema = z.enum(['micro', 'medium', 'courage', 'creation', 'body']);

export const QuestTypeSchema = z.enum(['main', 'side']);

export const FocusAreaSchema = z.enum(['work', 'relationship', 'body', 'creation']);

export const TonePreferenceSchema = z.enum(['warm', 'direct', 'philosophical']);

export const UserValueSchema = z.enum([
  'dignity', 'honesty', 'actions', 'meaning', 'independence', 'growth', 'boundaries'
]);

export const ScenarioTypeSchema = z.enum([
  'provocation', 'accusation', 'coldness', 'drama', 'comparison',
  'silence', 'blame', 'testing', 'manipulation', 'escalation'
]);

export const SafetyFlagSchema = z.enum([
  'self_harm_risk', 'crisis_detected', 'substance_mention', 'severe_distress', 'none'
]);

// ==========================================
// Data Model Schemas
// ==========================================

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  language: z.literal('ru'),
  values: z.array(UserValueSchema).min(1),
  triggers: z.array(TriggerTypeSchema),
  preferredTone: TonePreferenceSchema,
  trustAnchorWord: z.string().min(1).default('ДОВЕРИЕ'),
  boundariesStyle: z.enum(['firm', 'gentle']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const DailyStateSchema = z.object({
  id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // ISO date
  energy: z.number().min(1).max(10),
  stress: z.number().min(1).max(10),
  sleepHours: z.number().min(0).max(24),
  focus: FocusAreaSchema,
  relationshipIntensity: z.number().min(1).max(10).optional(),
  workIntensity: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
  createdAt: z.string().datetime()
});

export const QuestSchema = z.object({
  id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: QuestTypeSchema,
  category: QuestCategorySchema,
  titleRu: z.string().min(1),
  whyRu: z.string().min(1),
  stepsRu: z.array(z.string()).min(1),
  failSafeRu: z.string().min(1),
  done: z.boolean().default(false),
  outcomeNote: z.string().optional(),
  helpedRating: z.number().min(1).max(5).optional(),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().optional()
});

export const ScriptVariantsSchema = z.object({
  shortRu: z.string().min(1),
  neutralRu: z.string().min(1),
  boundaryRu: z.string().min(1),
  exitRu: z.string().min(1)
});

export const ConversationScriptSchema = z.object({
  id: z.string().uuid(),
  scenarioType: ScenarioTypeSchema,
  contextSummary: z.string().optional(),
  variants: ScriptVariantsSchema,
  toneNotesRu: z.string(),
  safetyFlags: z.array(z.string()),
  generatedAt: z.string().datetime()
});

export const JournalEntrySchema = z.object({
  id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mode: z.enum(['quick', 'deep']),
  eventRu: z.string().min(1),
  feelingRu: z.string().min(1),
  choiceRu: z.string().min(1),
  deepReflectionRu: z.string().optional(),
  insightsRu: z.array(z.string()).optional(),
  createdAt: z.string().datetime()
});

// ==========================================
// API Request Schemas
// ==========================================

export const QuestGenerationRequestSchema = z.object({
  dailyState: DailyStateSchema.partial().extend({
    energy: z.number().min(1).max(10),
    stress: z.number().min(1).max(10),
    focus: FocusAreaSchema
  }),
  userProfile: UserProfileSchema.partial(),
  memorySignals: z.object({
    whatWorked: z.record(z.string(), z.number()).optional(),
    whatFailed: z.record(z.string(), z.number()).optional(),
    preferredQuestTypes: z.array(QuestCategorySchema).optional()
  }).optional()
});

export const ScriptGenerationRequestSchema = z.object({
  scenarioType: ScenarioTypeSchema,
  contextSummary: z.string().optional(),
  userProfile: UserProfileSchema.partial()
});

// ==========================================
// API Response Schemas (for parsing AI output)
// ==========================================

export const QuestGenerationResponseSchema = z.object({
  stateAssessment: z.object({
    ruachState: RuachStateSchema,
    notesRu: z.string()
  }),
  quests: z.array(z.object({
    type: QuestTypeSchema,
    category: QuestCategorySchema,
    titleRu: z.string(),
    whyRu: z.string(),
    stepsRu: z.array(z.string()),
    failSafeRu: z.string()
  })).min(1),
  safetyFlags: z.array(z.string()),
  followupsRu: z.array(z.string())
});

export const ScriptGenerationResponseSchema = z.object({
  scenario: ScenarioTypeSchema,
  variants: ScriptVariantsSchema,
  toneNotesRu: z.string(),
  safetyFlags: z.array(z.string())
});

export const ResetProtocolStepSchema = z.object({
  type: z.enum(['label', 'breath', 'reframe', 'action', 'anchor']),
  titleRu: z.string(),
  contentRu: z.string(),
  durationSeconds: z.number().optional()
});

export const ResetProtocolResponseSchema = z.object({
  trigger: TriggerTypeSchema,
  steps: z.array(ResetProtocolStepSchema).min(1),
  trustAnchorRu: z.string()
});

// ==========================================
// Safety Schema
// ==========================================

export const SafetyCheckResultSchema = z.object({
  flags: z.array(SafetyFlagSchema),
  requiresIntervention: z.boolean(),
  crisisResourcesNeeded: z.boolean(),
  messageRu: z.string().optional()
});

// ==========================================
// Type exports from schemas
// ==========================================

export type RuachStateSchemaType = z.infer<typeof RuachStateSchema>;
export type DailyStateSchemaType = z.infer<typeof DailyStateSchema>;
export type QuestSchemaType = z.infer<typeof QuestSchema>;
export type QuestGenerationRequestSchemaType = z.infer<typeof QuestGenerationRequestSchema>;
export type QuestGenerationResponseSchemaType = z.infer<typeof QuestGenerationResponseSchema>;
export type ScriptGenerationRequestSchemaType = z.infer<typeof ScriptGenerationRequestSchema>;
export type ScriptGenerationResponseSchemaType = z.infer<typeof ScriptGenerationResponseSchema>;
