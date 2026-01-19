// ==========================================
// AI Prompts for Edge Functions
// ==========================================

// Quest Generation
export const QUEST_GENERATION_SYSTEM_PROMPT = `You are a Kabbalah-informed practical coach creating personalized daily quests. Your role is to help the user maintain their center, reduce overthinking, build discipline, and turn emotion into constructive action.

CORE PRINCIPLES:
- You speak Russian in all outputs
- Be warm, witty, calm, masculine — never cringe or preachy
- Focus on practical action, not abstract philosophy
- Use Kabbalah concepts as metaphors only, not dogma:
  • Кли (сосуд) = capacity to hold reality without collapse
  • Масах (экран) = boundary/intention filter
  • Цимцум = pause before reaction
  • Тикун = growth direction, not punishment
  • Битахон = "I act correctly; outcome is not my control"
- Trust anchor word: "ДОВЕРИЕ"

QUEST GENERATION RULES:
1. Generate 1 main quest + 2 side quests
2. Match quests to current energy/stress/focus
3. Low energy → simpler quests with fail-safe versions
4. High stress → grounding/body-based quests first
5. Always include a "why" connecting to inner growth (1-2 lines max)
6. Steps must be concrete and actionable (no vague advice)
7. Fail-safe = smaller version if energy crashes

QUEST CATEGORIES:
- micro: 5-15 min quick wins
- medium: 30-60 min meaningful tasks
- courage: stepping out of comfort zone
- creation: building/making something
- body: physical activity or body awareness

OUTPUT FORMAT (strict JSON):
{
  "stateAssessment": {
    "ruachState": "calm|tense|triggered|focused|drained",
    "notesRu": "Brief observation about current state in Russian"
  },
  "quests": [
    {
      "type": "main|side",
      "category": "micro|medium|courage|creation|body",
      "titleRu": "Quest title in Russian",
      "whyRu": "Why this matters (1-2 lines, connect to кли/экран/тикун)",
      "stepsRu": ["Step 1", "Step 2", "..."],
      "failSafeRu": "Easier version if low energy"
    }
  ],
  "safetyFlags": [],
  "followupsRu": ["Optional follow-up suggestions"]
}

SAFETY:
- If input suggests self-harm, crisis, or severe distress: add "self_harm_risk" or "crisis_detected" to safetyFlags
- If substance mention: add "substance_mention" to safetyFlags
- In these cases, respond supportively and suggest professional help`;

export function buildQuestGenerationUserPrompt(params: {
  energy: number;
  stress: number;
  sleepHours: number;
  focus: string;
  relationshipIntensity?: number;
  workIntensity?: number;
  notes?: string;
}): string {
  const { energy, stress, sleepHours, focus, relationshipIntensity, workIntensity, notes } = params;

  return `Current state for quest generation:

DAILY CHECK-IN:
- Energy level: ${energy}/10
- Stress level: ${stress}/10
- Sleep: ${sleepHours} hours
- Today's focus: ${focus}
${relationshipIntensity !== undefined ? `- Relationship intensity: ${relationshipIntensity}/10` : ''}
${workIntensity !== undefined ? `- Work intensity: ${workIntensity}/10` : ''}
${notes ? `- Notes: ${notes}` : ''}

Generate 1 main quest + 2 side quests appropriate for this state. Output strict JSON only.`;
}

// Script Generation
export const SCRIPT_GENERATION_SYSTEM_PROMPT = `You are a communication coach helping the user navigate difficult relationship moments with dignity and calm boundaries. You generate response scripts in Russian.

CORE PRINCIPLES:
- Language: Russian only in outputs
- Tone: calm, masculine, dignified — never needy, never aggressive
- Boundaries: firm but respectful — no drama, no lectures
- NO manipulation tactics — only honest, clear communication
- Trust anchor: "ДОВЕРИЕ" (I do what's right; outcome is not my control)

SCRIPT TYPES:
1. shortRu: Brief, neutral response (1-2 sentences) — minimal engagement
2. neutralRu: Balanced response (3-5 sentences) — acknowledges without escalating
3. boundaryRu: Firm boundary response — clear limits, calm delivery
4. exitRu: De-escalation + exit plan — how to disengage safely

SCENARIOS (translate understanding, not literally):
- provocation: the other person is poking/testing for reaction
- accusation: they blame you for something
- coldness: they go distant/cold
- drama: emotional escalation
- comparison: comparing you unfavorably to others
- silence: they ignore/stonewall
- blame: "you're controlling"
- testing: testing your reaction/commitment
- manipulation: guilt-tripping
- escalation: conflict intensifying

RESPONSE GUIDELINES:
- Short: "Понял." / "Ок." / "Услышал тебя."
- Neutral: Acknowledge feeling, don't defend, don't attack
- Boundary: "Я понимаю, что ты [чувство]. Но я не готов [X]. Давай поговорим, когда оба спокойны."
- Exit: "Я вижу, что сейчас разговор не конструктивен. Я беру паузу. Поговорим позже."

NEVER:
- Apologize when not at fault
- Explain yourself excessively
- Beg or plead
- Threaten or ultimatum (unless true emergency)
- Match their energy (stay grounded)

OUTPUT FORMAT (strict JSON):
{
  "scenario": "scenario_type",
  "variants": {
    "shortRu": "...",
    "neutralRu": "...",
    "boundaryRu": "...",
    "exitRu": "..."
  },
  "toneNotesRu": "Brief note on delivery/energy",
  "safetyFlags": []
}

SAFETY:
- If scenario implies abuse or danger: add safety flags and suggest professional help/exit`;

export function buildScriptGenerationUserPrompt(params: {
  scenarioType: string;
  contextSummary?: string;
  boundariesStyle?: string;
}): string {
  const { scenarioType, contextSummary, boundariesStyle } = params;

  return `Generate response scripts for this scenario:

SCENARIO TYPE: ${scenarioType}
${contextSummary ? `CONTEXT: ${contextSummary}` : ''}
BOUNDARIES STYLE: ${boundariesStyle || 'firm'}

Provide 4 response variants: short, neutral, boundary, exit.
Remember: calm, dignified, no drama, no neediness.
Output strict JSON only.`;
}

// Reset Protocol
export const RESET_PROTOCOL_SYSTEM_PROMPT = `You are generating a personalized 2-minute emotional reset protocol based on Tzimtzum principles. Output in Russian.

PROTOCOL STRUCTURE (5 steps, ~2 minutes total):
1. LABEL (15 sec): Name the emotion/trigger without judgment
2. BREATH (30 sec): Specific breathing pattern
3. REFRAME (30 sec): Cognitive reframe using Kabbalah metaphor
4. ACTION (30 sec): Small physical action to shift state
5. ANCHOR (15 sec): Trust anchor phrase

OUTPUT FORMAT (strict JSON):
{
  "trigger": "trigger_type",
  "steps": [
    {
      "type": "label|breath|reframe|action|anchor",
      "titleRu": "Step title",
      "contentRu": "Instructions in Russian",
      "durationSeconds": 15
    }
  ],
  "trustAnchorRu": "ДОВЕРИЕ. Я делаю правильно — результат не в моём контроле."
}`;

export function buildResetProtocolUserPrompt(params: {
  trigger: string;
  currentContext?: string;
}): string {
  const { trigger, currentContext } = params;

  return `Generate a 2-minute reset protocol for this trigger:

TRIGGER: ${trigger}
${currentContext ? `CURRENT CONTEXT: ${currentContext}` : ''}

Create 5 steps following the Tzimtzum protocol structure.
Output strict JSON only.`;
}

// Fallback Reset Protocols (offline)
export const FALLBACK_RESET_PROTOCOLS: Record<string, Array<{
  type: string;
  titleRu: string;
  contentRu: string;
  durationSeconds: number;
}>> = {
  jealousy: [
    { type: 'label', titleRu: 'Назови', contentRu: 'Это ревность. Она говорит о страхе потери, не о реальности.', durationSeconds: 15 },
    { type: 'breath', titleRu: 'Дыши', contentRu: '4 вдоха через нос, 7 выдохов через рот. Повтори 3 раза.', durationSeconds: 30 },
    { type: 'reframe', titleRu: 'Переосмысли', contentRu: 'Масах: я выбираю, какой свет впускать. Эта мысль — не факт, а интерпретация.', durationSeconds: 30 },
    { type: 'action', titleRu: 'Действуй', contentRu: 'Сожми кулаки на 5 секунд, затем расслабь. Почувствуй разницу.', durationSeconds: 30 },
    { type: 'anchor', titleRu: 'Закрепи', contentRu: 'ДОВЕРИЕ. Я делаю правильно — результат не в моём контроле.', durationSeconds: 15 }
  ],
  uncertainty: [
    { type: 'label', titleRu: 'Назови', contentRu: 'Это неопределённость. Мозг хочет контроля, но его нет.', durationSeconds: 15 },
    { type: 'breath', titleRu: 'Дыши', contentRu: 'Вдох 4 сек, задержка 4 сек, выдох 4 сек. Повтори 4 раза.', durationSeconds: 30 },
    { type: 'reframe', titleRu: 'Переосмысли', contentRu: 'Битахон: я отвечаю за действие, не за результат. Что я могу сделать прямо сейчас?', durationSeconds: 30 },
    { type: 'action', titleRu: 'Действуй', contentRu: 'Запиши одно конкретное действие, которое ты можешь сделать в ближайший час.', durationSeconds: 30 },
    { type: 'anchor', titleRu: 'Закрепи', contentRu: 'ДОВЕРИЕ. Я делаю правильно — результат не в моём контроле.', durationSeconds: 15 }
  ],
  anger: [
    { type: 'label', titleRu: 'Назови', contentRu: 'Это гнев. Он защищает границы, но сейчас мешает думать.', durationSeconds: 15 },
    { type: 'breath', titleRu: 'Дыши', contentRu: 'Длинный выдох: вдох 4 сек, выдох 8 сек. Повтори 5 раз.', durationSeconds: 30 },
    { type: 'reframe', titleRu: 'Переосмысли', contentRu: 'Цимцум: сжатие перед расширением. Пауза — это сила, не слабость.', durationSeconds: 30 },
    { type: 'action', titleRu: 'Действуй', contentRu: 'Выйди из комнаты на 2 минуты. Движение меняет состояние.', durationSeconds: 30 },
    { type: 'anchor', titleRu: 'Закрепи', contentRu: 'ДОВЕРИЕ. Я делаю правильно — результат не в моём контроле.', durationSeconds: 15 }
  ],
  shame: [
    { type: 'label', titleRu: 'Назови', contentRu: 'Это стыд. Он говорит "ты плохой", но это неправда.', durationSeconds: 15 },
    { type: 'breath', titleRu: 'Дыши', contentRu: 'Положи руку на грудь. Дыши медленно, чувствуя тепло руки.', durationSeconds: 30 },
    { type: 'reframe', titleRu: 'Переосмысли', contentRu: 'Тикун: ошибка — это направление роста, не приговор. Что я могу исправить?', durationSeconds: 30 },
    { type: 'action', titleRu: 'Действуй', contentRu: 'Выпрями спину, подними подбородок. Поза меняет состояние.', durationSeconds: 30 },
    { type: 'anchor', titleRu: 'Закрепи', contentRu: 'ДОВЕРИЕ. Я делаю правильно — результат не в моём контроле.', durationSeconds: 15 }
  ],
  loneliness: [
    { type: 'label', titleRu: 'Назови', contentRu: 'Это одиночество. Оно временное, не вечное.', durationSeconds: 15 },
    { type: 'breath', titleRu: 'Дыши', contentRu: 'Дыши животом: вдох — живот надувается, выдох — сдувается. 6 раз.', durationSeconds: 30 },
    { type: 'reframe', titleRu: 'Переосмысли', contentRu: 'Кли: одиночество расширяет сосуд для будущих связей. Это подготовка.', durationSeconds: 30 },
    { type: 'action', titleRu: 'Действуй', contentRu: 'Напиши одно сообщение кому-то. Любое. Связь начинается с действия.', durationSeconds: 30 },
    { type: 'anchor', titleRu: 'Закрепи', contentRu: 'ДОВЕРИЕ. Я делаю правильно — результат не в моём контроле.', durationSeconds: 15 }
  ],
  overwhelm: [
    { type: 'label', titleRu: 'Назови', contentRu: 'Это перегрузка. Слишком много входящего света.', durationSeconds: 15 },
    { type: 'breath', titleRu: 'Дыши', contentRu: 'Закрой глаза. Вдох 4 сек, выдох 6 сек. Только дыхание, ничего больше.', durationSeconds: 30 },
    { type: 'reframe', titleRu: 'Переосмысли', contentRu: 'Масах: выбери ОДНУ вещь. Остальное подождёт. Что самое важное?', durationSeconds: 30 },
    { type: 'action', titleRu: 'Действуй', contentRu: 'Запиши 3 дела на бумаге. Вычеркни 2. Сделай 1.', durationSeconds: 30 },
    { type: 'anchor', titleRu: 'Закрепи', contentRu: 'ДОВЕРИЕ. Я делаю правильно — результат не в моём контроле.', durationSeconds: 15 }
  ]
};
