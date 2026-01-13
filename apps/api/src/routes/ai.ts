// ==========================================
// AI Routes - Quest, Script, Reset generation
// ==========================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getGeminiService } from '../services/gemini';
import { aiLimiter, deviceLimiter } from '../middleware/rateLimit';
import {
  QuestGenerationRequestSchema,
  ScriptGenerationRequestSchema,
  TriggerTypeSchema,
  QUEST_GENERATION_SYSTEM_PROMPT,
  buildQuestGenerationUserPrompt,
  SCRIPT_GENERATION_SYSTEM_PROMPT,
  buildScriptGenerationUserPrompt,
  RESET_PROTOCOL_SYSTEM_PROMPT,
  buildResetProtocolUserPrompt,
  FALLBACK_RESET_PROTOCOLS,
  SAFETY_CHECK_SYSTEM_PROMPT,
  buildSafetyCheckPrompt,
  SAFETY_INTERVENTION_MESSAGE_RU,
  containsSafetyKeywords,
  PROMPT_VERSIONS,
  type TriggerType
} from '@ruach/shared';

const router = Router();

// Apply rate limiters
router.use(aiLimiter);
router.use(deviceLimiter(20, 60 * 1000)); // 20 requests per minute per device

// ==========================================
// POST /ai/quests - Generate daily quests
// ==========================================
router.post('/quests', async (req: Request, res: Response) => {
  try {
    // Validate request
    const validationResult = QuestGenerationRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: validationResult.error.errors
      });
    }

    const { dailyState, userProfile, memorySignals } = validationResult.data;

    // Check for safety keywords in notes
    if (dailyState.notes && containsSafetyKeywords(dailyState.notes)) {
      // Run full safety check
      const gemini = getGeminiService();
      const safetyResult = await gemini.checkSafety(
        SAFETY_CHECK_SYSTEM_PROMPT,
        buildSafetyCheckPrompt(dailyState.notes)
      );

      if (safetyResult.success && safetyResult.data.requiresIntervention) {
        return res.json({
          stateAssessment: {
            ruachState: 'triggered',
            notesRu: SAFETY_INTERVENTION_MESSAGE_RU
          },
          quests: [],
          safetyFlags: safetyResult.data.flags,
          followupsRu: [],
          intervention: true
        });
      }
    }

    // Generate quests
    const gemini = getGeminiService();
    const userPrompt = buildQuestGenerationUserPrompt({
      energy: dailyState.energy,
      stress: dailyState.stress,
      sleepHours: dailyState.sleepHours || 7,
      focus: dailyState.focus,
      relationshipIntensity: dailyState.relationshipIntensity,
      workIntensity: dailyState.workIntensity,
      notes: dailyState.notes,
      preferredCategories: memorySignals?.preferredQuestTypes,
      whatWorked: memorySignals?.whatWorked
    });

    const result = await gemini.generateQuests(
      QUEST_GENERATION_SYSTEM_PROMPT,
      userPrompt
    );

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to generate quests',
        errorRu: 'Не удалось сгенерировать квесты. Попробуй позже.'
      });
    }

    return res.json({
      ...result.data,
      promptVersion: PROMPT_VERSIONS.questGeneration
    });

  } catch (error) {
    console.error('Quest generation error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      errorRu: 'Внутренняя ошибка. Попробуй позже.'
    });
  }
});

// ==========================================
// POST /ai/script - Generate conversation scripts
// ==========================================
router.post('/script', async (req: Request, res: Response) => {
  try {
    // Validate request
    const validationResult = ScriptGenerationRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: validationResult.error.errors
      });
    }

    const { scenarioType, contextSummary, userProfile } = validationResult.data;

    // Generate script
    const gemini = getGeminiService();
    const userPrompt = buildScriptGenerationUserPrompt({
      scenarioType,
      contextSummary,
      boundariesStyle: userProfile.boundariesStyle
    });

    const result = await gemini.generateScript(
      SCRIPT_GENERATION_SYSTEM_PROMPT,
      userPrompt
    );

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to generate script',
        errorRu: 'Не удалось сгенерировать скрипт. Попробуй позже.'
      });
    }

    return res.json({
      ...result.data,
      promptVersion: PROMPT_VERSIONS.scriptGeneration
    });

  } catch (error) {
    console.error('Script generation error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      errorRu: 'Внутренняя ошибка. Попробуй позже.'
    });
  }
});

// ==========================================
// POST /ai/reset - Generate reset protocol
// ==========================================
const ResetRequestSchema = z.object({
  trigger: TriggerTypeSchema,
  contextSummary: z.string().optional(),
  useFallback: z.boolean().optional()
});

router.post('/reset', async (req: Request, res: Response) => {
  try {
    const validationResult = ResetRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: validationResult.error.errors
      });
    }

    const { trigger, contextSummary, useFallback } = validationResult.data;

    // Use fallback if requested or if offline mode needed
    if (useFallback) {
      const fallbackProtocol = FALLBACK_RESET_PROTOCOLS[trigger as TriggerType];
      return res.json({
        trigger,
        steps: fallbackProtocol,
        trustAnchorRu: 'ДОВЕРИЕ. Я делаю правильно — результат не в моём контроле.',
        source: 'fallback'
      });
    }

    // Generate with AI
    const gemini = getGeminiService();
    const userPrompt = buildResetProtocolUserPrompt({
      trigger,
      currentContext: contextSummary
    });

    const result = await gemini.generateResetProtocol(
      RESET_PROTOCOL_SYSTEM_PROMPT,
      userPrompt
    );

    if (!result.success) {
      // Fallback to pre-built protocol on error
      const fallbackProtocol = FALLBACK_RESET_PROTOCOLS[trigger as TriggerType];
      return res.json({
        trigger,
        steps: fallbackProtocol,
        trustAnchorRu: 'ДОВЕРИЕ. Я делаю правильно — результат не в моём контроле.',
        source: 'fallback'
      });
    }

    return res.json({
      ...result.data,
      source: 'ai',
      promptVersion: PROMPT_VERSIONS.resetProtocol
    });

  } catch (error) {
    console.error('Reset protocol error:', error);
    // Always return fallback on error
    const trigger = req.body.trigger || 'overwhelm';
    const fallbackProtocol = FALLBACK_RESET_PROTOCOLS[trigger as TriggerType] ||
      FALLBACK_RESET_PROTOCOLS.overwhelm;

    return res.json({
      trigger,
      steps: fallbackProtocol,
      trustAnchorRu: 'ДОВЕРИЕ. Я делаю правильно — результат не в моём контроле.',
      source: 'fallback'
    });
  }
});

// ==========================================
// POST /ai/safety - Check text for safety concerns
// ==========================================
const SafetyCheckRequestSchema = z.object({
  text: z.string().min(1)
});

router.post('/safety', async (req: Request, res: Response) => {
  try {
    const validationResult = SafetyCheckRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: validationResult.error.errors
      });
    }

    const { text } = validationResult.data;

    // Quick client-side check first
    if (!containsSafetyKeywords(text)) {
      return res.json({
        flags: ['none'],
        requiresIntervention: false,
        crisisResourcesNeeded: false
      });
    }

    // Full AI check
    const gemini = getGeminiService();
    const result = await gemini.checkSafety(
      SAFETY_CHECK_SYSTEM_PROMPT,
      buildSafetyCheckPrompt(text)
    );

    return res.json(result.data);

  } catch (error) {
    console.error('Safety check error:', error);
    // Fail safe - assume no intervention needed
    return res.json({
      flags: ['none'],
      requiresIntervention: false,
      crisisResourcesNeeded: false
    });
  }
});

export default router;
