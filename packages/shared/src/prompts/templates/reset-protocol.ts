// ==========================================
// Reset Protocol (Tzimtzum Mode) Template
// Version: 1.0.0
// Model: Gemini 3 Flash (fast) or local fallback
// ==========================================

import type { TriggerType, ResetProtocolStep } from '../../types';

export const RESET_PROTOCOL_SYSTEM_PROMPT = `You are a grounding coach helping Sania return to center when triggered. You create 90-second reset protocols in Russian.

CORE PRINCIPLES:
- Language: Russian only
- Tone: calm, grounding, masculine — not fluffy or new-age
- Speed: protocol must work in 90 seconds
- Practical: real steps, not abstract meditation

TRIGGER TYPES:
- jealousy (ревность): fear of loss, comparison, inadequacy
- uncertainty (неизвестность): anxiety about unknown, overthinking
- anger (злость): frustration, unfairness, violation
- shame (стыд): exposure, failure, judgment
- loneliness (одиночество): disconnection, abandonment
- overwhelm (перегруз): too much, can't cope

PROTOCOL STRUCTURE (5 steps, ~90 sec total):
1. LABEL (10 sec): Name the emotion clearly
2. BREATH (30 sec): Box breathing or 4-7-8
3. REFRAME (20 sec): Kabbalah lens — "где мой экран?"
4. ACTION (20 sec): One micro-step to take NOW
5. ANCHOR (10 sec): Trust anchor phrase

KABBALAH REFRAMES:
- jealousy: "Мой сосуд достаточен. Её выбор — не моя ответственность."
- uncertainty: "Цимцум — сжатие перед расширением. Я выдержу неизвестность."
- anger: "Экран: не реагировать, а выбирать."
- shame: "Тикун — рост, не наказание. Это урок, не приговор."
- loneliness: "Свет внутри. Связь с собой — основа."
- overwhelm: "Одно действие. Одна вещь. Сейчас."

OUTPUT FORMAT (strict JSON):
{
  "trigger": "trigger_type",
  "steps": [
    {
      "type": "label|breath|reframe|action|anchor",
      "titleRu": "Step title",
      "contentRu": "Step content/instruction",
      "durationSeconds": 10
    }
  ],
  "trustAnchorRu": "ДОВЕРИЕ. Я делаю правильно — результат не в моём контроле."
}`;

export const buildResetProtocolUserPrompt = (params: {
  trigger: string;
  currentContext?: string;
}) => {
  const { trigger, currentContext } = params;

  return `Generate a 90-second reset protocol for:

TRIGGER: ${trigger}
${currentContext ? `CONTEXT: ${currentContext}` : ''}

Create 5 steps: label → breath → reframe → action → anchor
Total ~90 seconds. Output strict JSON only.`;
};

// ==========================================
// Pre-built Fallback Protocols (offline mode)
// ==========================================

export const FALLBACK_RESET_PROTOCOLS: Record<TriggerType, ResetProtocolStep[]> = {
  jealousy: [
    { type: 'label', titleRu: 'Назови', contentRu: 'Это ревность. Страх потери. Я вижу это.', durationSeconds: 10 },
    { type: 'breath', titleRu: 'Дыши', contentRu: 'Вдох 4 сек → задержка 4 сек → выдох 4 сек → задержка 4 сек. Повтори 3 раза.', durationSeconds: 30 },
    { type: 'reframe', titleRu: 'Экран', contentRu: 'Мой сосуд достаточен. Её выбор — её ответственность, не моя. Я не контролирую других.', durationSeconds: 20 },
    { type: 'action', titleRu: 'Действие', contentRu: 'Одно дело для себя прямо сейчас: 10 отжиманий, стакан воды, 5 минут работы.', durationSeconds: 20 },
    { type: 'anchor', titleRu: 'Якорь', contentRu: 'ДОВЕРИЕ. Я делаю правильно — результат не в моём контроле.', durationSeconds: 10 }
  ],
  uncertainty: [
    { type: 'label', titleRu: 'Назови', contentRu: 'Это тревога. Неизвестность. Ум пытается контролировать будущее.', durationSeconds: 10 },
    { type: 'breath', titleRu: 'Дыши', contentRu: 'Вдох 4 сек → задержка 7 сек → выдох 8 сек. Повтори 3 раза.', durationSeconds: 30 },
    { type: 'reframe', titleRu: 'Цимцум', contentRu: 'Сжатие перед расширением. Неизвестность — пространство для роста. Я выдержу.', durationSeconds: 20 },
    { type: 'action', titleRu: 'Действие', contentRu: 'Запиши одну вещь, которую ты МОЖЕШЬ контролировать сегодня. Сделай её.', durationSeconds: 20 },
    { type: 'anchor', titleRu: 'Якорь', contentRu: 'ДОВЕРИЕ. Я не знаю как — но я знаю, что справлюсь.', durationSeconds: 10 }
  ],
  anger: [
    { type: 'label', titleRu: 'Назови', contentRu: 'Это злость. Что-то кажется несправедливым. Я это вижу.', durationSeconds: 10 },
    { type: 'breath', titleRu: 'Дыши', contentRu: 'Глубокий вдох носом → сильный выдох ртом. 5 раз. Выпусти напряжение.', durationSeconds: 30 },
    { type: 'reframe', titleRu: 'Экран', contentRu: 'Экран: не реагировать автоматически, а выбирать ответ. Моя сила — в паузе.', durationSeconds: 20 },
    { type: 'action', titleRu: 'Действие', contentRu: 'Напиши, что тебя злит. Потом — что ты РЕАЛЬНО можешь сделать (не фантазия мести).', durationSeconds: 20 },
    { type: 'anchor', titleRu: 'Якорь', contentRu: 'ДОВЕРИЕ. Я выбираю достоинство. Ответ — позже, когда остыну.', durationSeconds: 10 }
  ],
  shame: [
    { type: 'label', titleRu: 'Назови', contentRu: 'Это стыд. Чувство, что я недостаточно хорош. Это чувство, не факт.', durationSeconds: 10 },
    { type: 'breath', titleRu: 'Дыши', contentRu: 'Положи руку на грудь. Вдох 4 сек → выдох 6 сек. Почувствуй тепло руки.', durationSeconds: 30 },
    { type: 'reframe', titleRu: 'Тикун', contentRu: 'Тикун — исправление, не наказание. Ошибка — урок, не приговор. Я расту.', durationSeconds: 20 },
    { type: 'action', titleRu: 'Действие', contentRu: 'Одно маленькое действие, где ты компетентен. Напомни себе: я умею.', durationSeconds: 20 },
    { type: 'anchor', titleRu: 'Якорь', contentRu: 'ДОВЕРИЕ. Моя ценность не зависит от одного момента.', durationSeconds: 10 }
  ],
  loneliness: [
    { type: 'label', titleRu: 'Назови', contentRu: 'Это одиночество. Чувство разъединения. Оно пройдёт.', durationSeconds: 10 },
    { type: 'breath', titleRu: 'Дыши', contentRu: 'Обними себя руками. Вдох 4 сек → выдох 4 сек. Почувствуй своё тело.', durationSeconds: 30 },
    { type: 'reframe', titleRu: 'Свет внутри', contentRu: 'Ор (свет) внутри меня. Связь с собой — основа всех связей. Я не один в себе.', durationSeconds: 20 },
    { type: 'action', titleRu: 'Действие', contentRu: 'Напиши одному человеку простое сообщение. Или сделай что-то доброе для себя.', durationSeconds: 20 },
    { type: 'anchor', titleRu: 'Якорь', contentRu: 'ДОВЕРИЕ. Связи придут. Сначала — связь с собой.', durationSeconds: 10 }
  ],
  overwhelm: [
    { type: 'label', titleRu: 'Назови', contentRu: 'Это перегруз. Слишком много. Ум пытается охватить всё сразу.', durationSeconds: 10 },
    { type: 'breath', titleRu: 'Дыши', contentRu: 'Стоп. Вдох 4 сек → выдох 8 сек (длинный). Повтори 4 раза. Замедлись.', durationSeconds: 30 },
    { type: 'reframe', titleRu: 'Одна вещь', contentRu: 'Всё не надо. Одна вещь. Сейчас. Остальное — потом. Кли расширяется постепенно.', durationSeconds: 20 },
    { type: 'action', titleRu: 'Действие', contentRu: 'Выбери ОДНУ задачу на следующие 25 минут. Только одну. Остальное — в список на потом.', durationSeconds: 20 },
    { type: 'anchor', titleRu: 'Якорь', contentRu: 'ДОВЕРИЕ. Я не должен всё сразу. Шаг за шагом.', durationSeconds: 10 }
  ]
};

export const RESET_PROTOCOL_PROMPT_VERSION = '1.0.0';
