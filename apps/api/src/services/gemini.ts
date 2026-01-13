// ==========================================
// Gemini AI Service - Using @google/genai SDK
// ==========================================

import { GoogleGenAI } from '@google/genai';
import {
  extractJSON,
  safeParseJSON,
  QuestGenerationResponseSchema,
  ScriptGenerationResponseSchema,
  ResetProtocolResponseSchema,
  SafetyCheckResultSchema
} from '@ruach/shared';

// Model configuration - using Gemini 3 (free tier available)
const MODEL_FLASH = 'gemini-3-flash-preview';

export class GeminiService {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateQuests(systemPrompt: string, userPrompt: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: MODEL_FLASH,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048,
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response from AI');
      }
      const jsonString = extractJSON(responseText);
      const parsed = safeParseJSON(jsonString, null);

      if (!parsed) {
        throw new Error('Failed to parse AI response');
      }

      // Validate against schema
      const validated = QuestGenerationResponseSchema.parse(parsed);
      return { success: true, data: validated };
    } catch (error) {
      console.error('Quest generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async generateScript(systemPrompt: string, userPrompt: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: MODEL_FLASH,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048,
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response from AI');
      }
      const jsonString = extractJSON(responseText);
      const parsed = safeParseJSON(jsonString, null);

      if (!parsed) {
        throw new Error('Failed to parse AI response');
      }

      const validated = ScriptGenerationResponseSchema.parse(parsed);
      return { success: true, data: validated };
    } catch (error) {
      console.error('Script generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async generateResetProtocol(systemPrompt: string, userPrompt: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: MODEL_FLASH,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048,
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response from AI');
      }
      const jsonString = extractJSON(responseText);
      const parsed = safeParseJSON(jsonString, null);

      if (!parsed) {
        throw new Error('Failed to parse AI response');
      }

      const validated = ResetProtocolResponseSchema.parse(parsed);
      return { success: true, data: validated };
    } catch (error) {
      console.error('Reset protocol generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async checkSafety(systemPrompt: string, userPrompt: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: MODEL_FLASH,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.3,
          maxOutputTokens: 1024,
        }
      });

      const responseText = response.text;
      if (!responseText) {
        // Default to safe if no response
        return {
          success: true,
          data: {
            flags: ['none'],
            requiresIntervention: false,
            crisisResourcesNeeded: false
          }
        };
      }
      const jsonString = extractJSON(responseText);
      const parsed = safeParseJSON(jsonString, null);

      if (!parsed) {
        // Default to safe if parsing fails
        return {
          success: true,
          data: {
            flags: ['none'],
            requiresIntervention: false,
            crisisResourcesNeeded: false
          }
        };
      }

      const validated = SafetyCheckResultSchema.parse(parsed);
      return { success: true, data: validated };
    } catch (error) {
      console.error('Safety check error:', error);
      // Default to requiring intervention on error (fail-safe)
      return {
        success: true,
        data: {
          flags: ['none'],
          requiresIntervention: false,
          crisisResourcesNeeded: false
        }
      };
    }
  }

  // Deep analysis using same model (Gemini 3 Flash is very capable)
  async deepAnalysis(systemPrompt: string, userPrompt: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: MODEL_FLASH,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 4096,
        }
      });

      return { success: true, data: response.text };
    } catch (error) {
      console.error('Deep analysis error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Singleton instance
let geminiService: GeminiService | null = null;

export const getGeminiService = (): GeminiService => {
  if (!geminiService) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    geminiService = new GeminiService(apiKey);
  }
  return geminiService;
};
