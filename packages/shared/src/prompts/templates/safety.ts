// ==========================================
// Safety Check Prompt Template
// Version: 1.0.0
// Applied to all AI interactions
// ==========================================

export const SAFETY_CHECK_SYSTEM_PROMPT = `You are a safety filter for a personal coaching app. Analyze user input for risk indicators and respond appropriately.

RISK CATEGORIES:
1. SELF_HARM_RISK: mentions of self-harm, suicidal ideation, wanting to end life
2. CRISIS_DETECTED: severe panic, breakdown, inability to function
3. SUBSTANCE_MENTION: alcohol/drug abuse, relapse indicators
4. SEVERE_DISTRESS: extreme emotional state requiring professional help

RESPONSE RULES:
- If ANY risk detected: return supportive message + recommend professional help
- Always maintain warmth and non-judgment
- Provide crisis resources for Germany (placeholder)
- Do NOT attempt to be a therapist or diagnose

OUTPUT FORMAT (strict JSON):
{
  "flags": ["self_harm_risk"|"crisis_detected"|"substance_mention"|"severe_distress"|"none"],
  "requiresIntervention": true|false,
  "crisisResourcesNeeded": true|false,
  "messageRu": "Supportive message if intervention needed"
}`;

export const SAFETY_KEYWORDS = {
  selfHarm: [
    'убить себя', 'покончить', 'суицид', 'не хочу жить', 'лучше бы меня не было',
    'хочу умереть', 'конец всему', 'нет смысла жить', 'порезать себя'
  ],
  crisis: [
    'не могу дышать', 'паническая атака', 'схожу с ума', 'не выдержу',
    'всё рушится', 'не могу функционировать', 'полный распад'
  ],
  substance: [
    'напился', 'нажрался', 'употребил', 'срыв', 'опять пью',
    'не могу остановиться', 'наркотики', 'закинулся'
  ]
};

export const CRISIS_RESOURCES_DE = {
  general: {
    name: 'Telefonseelsorge',
    phone: '0800 111 0 111',
    available: '24/7, бесплатно'
  },
  suicide: {
    name: 'Suizidprävention',
    phone: '0800 111 0 222',
    available: '24/7, бесплатно'
  },
  note: 'Это плейсхолдеры — проверь актуальные номера для Германии'
};

export const buildSafetyCheckPrompt = (userInput: string) => {
  return `Analyze this user input for safety risks:

INPUT: "${userInput}"

Check for: self-harm ideation, crisis state, substance issues, severe distress.
Output strict JSON with flags, requiresIntervention, crisisResourcesNeeded, and messageRu if needed.`;
};

export const SAFETY_INTERVENTION_MESSAGE_RU = `Я слышу тебя. То, что ты переживаешь — тяжело.

Пожалуйста, если тебе сейчас очень плохо — обратись за профессиональной поддержкой:
📞 Telefonseelsorge: 0800 111 0 111 (бесплатно, 24/7)

Ты не один в этом. Просить помощи — это сила, не слабость.

Я здесь, чтобы поддержать, но профессионал сможет помочь лучше.`;

export const SAFETY_PROMPT_VERSION = '1.0.0';
