// ==========================================
// Gemini AI Service
// Handles all AI model interactions
// ==========================================

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import {
  extractJSON,
  safeParseJSON,
  QuestGenerationResponseSchema,
  ScriptGenerationResponseSchema,
  ResetProtocolResponseSchema,
  SafetyCheckResultSchema
} from '@ruach/shared';

// Model configuration
const MODEL_FLASH = 'gemini-2.0-flash';  // Fast, cheap - daily tasks
const MODEL_PRO = 'gemini-2.0-pro';      // Deep reasoning - complex analysis

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private flashModel: GenerativeModel;
  private proModel: GenerativeModel;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);

    this.flashModel = this.genAI.getGenerativeModel({
      model: MODEL_FLASH,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
      }
    });

    this.proModel = this.genAI.getGenerativeModel({
      model: MODEL_PRO,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 4096,
      }
    });
  }

  async generateQuests(systemPrompt: string, userPrompt: string) {
    try {
      const result = await this.flashModel.generateContent(
        systemPrompt + '\n\n' + userPrompt
      );

      const responseText = result.response.text();
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
      const result = await this.flashModel.generateContent(
        systemPrompt + '\n\n' + userPrompt
      );

      const responseText = result.response.text();
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
      const result = await this.flashModel.generateContent(
        systemPrompt + '\n\n' + userPrompt
      );

      const responseText = result.response.text();
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
      const result = await this.flashModel.generateContent(
        systemPrompt + '\n\n' + userPrompt
      );

      const responseText = result.response.text();
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

  // Deep analysis using Pro model
  async deepAnalysis(systemPrompt: string, userPrompt: string) {
    try {
      const result = await this.proModel.generateContent(
        systemPrompt + '\n\n' + userPrompt
      );

      const responseText = result.response.text();
      return { success: true, data: responseText };
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
