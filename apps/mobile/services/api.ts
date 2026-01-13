// ==========================================
// API Client Service
// ==========================================

import * as SecureStore from 'expo-secure-store';
import {
  QuestGenerationRequest,
  QuestGenerationResponse,
  ScriptGenerationRequest,
  ScriptGenerationResponse,
  ResetProtocolResponse,
  TriggerType,
  FALLBACK_RESET_PROTOCOLS
} from '@ruach/shared';

// API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

// Device ID for rate limiting
let deviceId: string | null = null;

const getDeviceId = async (): Promise<string> => {
  if (deviceId) return deviceId;

  try {
    const stored = await SecureStore.getItemAsync('deviceId');
    if (stored) {
      deviceId = stored;
      return stored;
    }
  } catch (e) {
    // SecureStore might not be available
  }

  // Generate new device ID
  deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    await SecureStore.setItemAsync('deviceId', deviceId);
  } catch (e) {
    // Ignore storage errors
  }

  return deviceId;
};

// Base fetch with headers
const apiFetch = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: true; data: T } | { success: false; error: string }> => {
  try {
    const id = await getDeviceId();
    const url = `${API_BASE_URL}${endpoint}`;

    console.log(`[API] ${options.method || 'GET'} ${url}`);

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Id': id,
        'X-Client-Version': '1.0.0',
        ...options.headers,
      },
    });

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
  } catch (error) {
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
    return apiFetch<QuestGenerationResponse>('/ai/quests', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  // Generate conversation scripts
  generateScript: async (
    request: ScriptGenerationRequest
  ): Promise<{ success: true; data: ScriptGenerationResponse } | { success: false; error: string }> => {
    return apiFetch<ScriptGenerationResponse>('/ai/script', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  // Generate reset protocol
  generateReset: async (
    trigger: TriggerType,
    contextSummary?: string
  ): Promise<{ success: true; data: ResetProtocolResponse } | { success: false; error: string }> => {
    return apiFetch<ResetProtocolResponse>('/ai/reset', {
      method: 'POST',
      body: JSON.stringify({ trigger, contextSummary }),
    });
  },

  // Health check
  healthCheck: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
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
