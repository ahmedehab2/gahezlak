import { AI_CONFIG, LanguageCode } from '../../config/openai';

export class LanguageDetectorService {
  /**
   * Auto-detect language from user query
   */
  static detectLanguage(text: string): LanguageCode {
    if (!text || text.trim().length === 0) {
      return 'en';
    }

    const hasArabic = AI_CONFIG.ARABIC_PATTERN.test(text);
    const hasEnglish = /[a-zA-Z]/.test(text);

    if (hasArabic && hasEnglish) {
      return 'mixed';
    } else if (hasArabic) {
      return 'ar';
    } else {
      return 'en';
    }
  }

  /**
   * Get response language template based on detected language
   */
  static getResponseLanguage(detectedLang: LanguageCode): 'en' | 'ar' {
    // For mixed or unclear, default to English
    // Can be enhanced with user preference later
    return detectedLang === 'ar' ? 'ar' : 'en';
  }

  /**
   * Get system prompt in appropriate language
   */
  static getSystemPrompt(language: LanguageCode): string {
    const prompts = {
      en: "You are a helpful restaurant AI assistant. Respond in English.",
      ar: "أنت مساعد ذكي للمطاعم. يرجى الرد باللغة العربية.",
      mixed: "You are a helpful restaurant AI assistant. Respond in the primary language of the user's query."
    };

    return prompts[language];
  }
} 