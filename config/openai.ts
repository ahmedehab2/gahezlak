import OpenAI from 'openai';
import { logger } from './pino';

// OpenAI client singleton
let openaiClient: OpenAI | null = null;

export const getOpenAIClient = (): OpenAI => {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      logger.error('OPENAI_API_KEY environment variable is not set');
      throw new Error('OpenAI API key is required');
    }

    openaiClient = new OpenAI({
      apiKey: apiKey,
    });

    logger.info('OpenAI client initialized successfully');
  }

  return openaiClient;
};

// AI Configuration constants
export const AI_CONFIG = {
  TEXT_MODEL: process.env.AI_MODEL_TEXT || 'gpt-4o-mini',
  EMBEDDING_MODEL: process.env.AI_MODEL_EMBEDDING || 'text-embedding-3-small',
  MAX_TOKENS: parseInt(process.env.AI_MAX_TOKENS || '500'),
  TEMPERATURE: parseFloat(process.env.AI_TEMPERATURE || '0.3'),
  
  // Language detection patterns
  ARABIC_PATTERN: /[\u0600-\u06FF]/,
  
  // Price ranges for semantic understanding (in your currency)
  PRICE_RANGES: {
    'very cheap': { max: 20 },
    'cheap': { max: 40 },
    'affordable': { max: 60 },
    'moderate': { min: 40, max: 80 },
    'expensive': { min: 80, max: 120 },
    'very expensive': { min: 120 }
  }
};

export type LanguageCode = 'en' | 'ar' | 'mixed'; 