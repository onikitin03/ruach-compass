// ==========================================
// API Client Service - Supabase Edge Functions
// ==========================================

import { supabase, EDGE_FUNCTIONS } from '@/lib/supabase';
import {
  QuestGenerationRequest,
  QuestGenerationResponse,
  ScriptGenerationRequest,
  ScriptGenerationResponse,
  ResetProtocolResponse,
  TriggerType,
  FALLBACK_RESET_PROTOCOLS
} from '@ruach/shared';

// Timeout for API requests (30 seconds for AI generation)
const API_TIMEOUT_MS = 30000;

// Base fetch with Supabase auth and timeout
const apiFetch = async <T>(
  url: string,
  body: object
): Promise<{ success: true; data: T } | { success: false; error: string }> => {
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    // Try to refresh the session first
    const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();

    if (refreshError) {
      console.log('[API] Refresh error, trying getSession:', refreshError.message);
    }

    // Get current session (either refreshed or existing)
    const { data: { session: currentSession } } = await supabase.auth.getSession();

    if (!currentSession) {
      clearTimeout(timeoutId);
      return {
        success: false,
        error: 'Необходима авторизация'
      };
    }

    console.log(`[API] POST ${url}`);
    console.log(`[API] Token expires at:`, new Date((currentSession.expires_at || 0) * 1000).toISOString());

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentSession.access_token}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    console.log(`[API] Response status: ${response.status}`);
    console.log(`[API] Response data:`, JSON.stringify(data).substring(0, 500));

    if (!response.ok) {
      return {
        success: false,
        error: data.errorRu || data.error || 'Ошибка запроса'
      };
    }

    return { success: true, data: data as T };
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      console.error('[API] Request timeout after', API_TIMEOUT_MS, 'ms');
      return {
        success: false,
        error: 'Запрос занял слишком много времени. Попробуй ещё раз.'
      };
    }

    console.error('[API] Error:', error);
    return {
      success: false,
      error: 'Нет связи с сервером. Проверь интернет.'
    };
  }
};

// ==========================================
// API Methods
// ==========================================

export const api = {
  // Generate daily quests
  generateQuests: async (
    request: QuestGenerationRequest
  ): Promise<{ success: true; data: QuestGenerationResponse } | { success: false; error: string }> => {
    return apiFetch<QuestGenerationResponse>(EDGE_FUNCTIONS.generateQuests, request);
  },

  // Generate conversation scripts
  generateScript: async (
    request: ScriptGenerationRequest
  ): Promise<{ success: true; data: ScriptGenerationResponse } | { success: false; error: string }> => {
    return apiFetch<ScriptGenerationResponse>(EDGE_FUNCTIONS.generateScripts, request);
  },

  // Generate reset protocol
  generateReset: async (
    trigger: TriggerType,
    contextSummary?: string
  ): Promise<{ success: true; data: ResetProtocolResponse } | { success: false; error: string }> => {
    return apiFetch<ResetProtocolResponse>(EDGE_FUNCTIONS.generateReset, {
      trigger,
      contextSummary,
    });
  },

  // Health check - check if user is authenticated
  healthCheck: async (): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    } catch {
      return false;
    }
  },
};

// ==========================================
// Offline Fallbacks
// ==========================================

export const fallback = {
  // Get fallback reset protocol
  getResetProtocol: (trigger: TriggerType): ResetProtocolResponse => {
    return {
      trigger,
      steps: FALLBACK_RESET_PROTOCOLS[trigger] || FALLBACK_RESET_PROTOCOLS.overwhelm,
      trustAnchorRu: 'ДОВЕРИЕ. Я делаю правильно — результат не в моём контроле.'
    };
  },

  // Get fallback quests when offline
  getDefaultQuests: (energy: number, stress: number): QuestGenerationResponse => {
    const isLowEnergy = energy <= 4;
    const isHighStress = stress >= 7;

    return {
      stateAssessment: {
        ruachState: isHighStress ? 'tense' : isLowEnergy ? 'drained' : 'calm',
        notesRu: 'Офлайн режим. Базовые квесты.'
      },
      quests: [
        {
          type: 'main',
          category: isHighStress ? 'body' : 'micro',
          titleRu: isHighStress
            ? 'Прогулка 15 минут'
            : 'Записать 3 благодарности',
          whyRu: isHighStress
            ? 'Тело помогает разрядить напряжение. Экран через движение.'
            : 'Кли расширяется через признание хорошего.',
          stepsRu: isHighStress
            ? ['Выйди на улицу', 'Иди в любом направлении 7 минут', 'Вернись обратно', 'Дыши глубоко по пути']
            : ['Открой заметки', 'Напиши 3 вещи, за которые благодарен сегодня', 'Перечитай'],
          failSafeRu: isHighStress
            ? '5 минут стоя у окна, глубокое дыхание'
            : '1 благодарность вслух'
        },
        {
          type: 'side',
          category: 'micro',
          titleRu: '10 отжиманий или приседаний',
          whyRu: 'Тело в тонусе = ум в тонусе.',
          stepsRu: ['Встань', 'Сделай 10 повторений', 'Выпей воды'],
          failSafeRu: '5 повторений'
        },
        {
          type: 'side',
          category: 'micro',
          titleRu: '5 минут без телефона',
          whyRu: 'Цимцум: сжатие создаёт пространство для кли.',
          stepsRu: ['Положи телефон в другую комнату', 'Поставь таймер на 5 минут', 'Просто сиди или смотри в окно'],
          failSafeRu: '2 минуты'
        }
      ],
      safetyFlags: [],
      followupsRu: ['Вернись, когда будет связь.']
    };
  }
};
