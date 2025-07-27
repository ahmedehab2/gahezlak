import { getOpenAIClient, AI_CONFIG } from '../../config/openai';
import { LanguageDetectorService } from './language-detector.service';
import { MenuItemModel, IMenuItem } from '../../models/MenuItem';
import { AIMenuDataModel } from '../../models/AIMenuData';
import { logger } from '../../config/pino';
import mongoose from 'mongoose';

export interface HealthInsightRequest {
  query: string;
  shopId: string;
  limit?: number;
  includeOutOfStock?: boolean;
}

export interface HealthInsightResponse {
  recommendations: HealthRecommendation[];
  healthConditions: string[];
  nutritionalGuidance: string;
  detectedLanguage: string;
  totalFound: number;
  disclaimerMessage: string;
}

export interface HealthRecommendation {
  item: IMenuItem;
  healthScore: number;
  benefits: string[];
  warnings?: string[];
  nutritionalHighlights: string[];
  confidence: number;
}

export interface ParsedHealthQuery {
  conditions: string[];
  goals: string[];
  restrictions: string[];
  preferences: string[];
}

export class HealthInsightsService {
  private static openai = getOpenAIClient();

  // Medical disclaimer
  private static readonly HEALTH_DISCLAIMER = {
    en: "⚠️ This is AI-generated nutritional guidance for informational purposes only. Always consult healthcare professionals for medical dietary advice.",
    ar: "⚠️ هذه إرشادات غذائية مُولدة بالذكاء الاصطناعي لأغراض إعلامية فقط. استشر دائماً مختصي الرعاية الصحية للحصول على نصائح غذائية طبية."
  };

  // Health condition database
  private static readonly HEALTH_CONDITIONS = {
    diabetes: {
      keywords: ['diabetes', 'diabetic', 'blood sugar', 'glucose', 'السكري', 'سكر الدم'],
      avoid: ['sugar', 'refined carbs', 'white bread', 'candy', 'sweet'],
      recommend: ['fiber', 'whole grains', 'lean protein', 'vegetables', 'complex carbs'],
      guidance: 'Focus on low glycemic index foods, high fiber, and balanced meals'
    },
    hypertension: {
      keywords: ['hypertension', 'high blood pressure', 'bp', 'ضغط الدم', 'ضغط مرتفع'],
      avoid: ['sodium', 'salt', 'processed foods', 'canned foods'],
      recommend: ['potassium', 'magnesium', 'fresh fruits', 'vegetables', 'lean protein'],
      guidance: 'Limit sodium intake, increase potassium-rich foods'
    },
    heart_disease: {
      keywords: ['heart disease', 'cardiac', 'cholesterol', 'أمراض القلب', 'كوليسترول'],
      avoid: ['saturated fat', 'trans fat', 'cholesterol', 'fried foods'],
      recommend: ['omega-3', 'fiber', 'antioxidants', 'fish', 'nuts', 'olive oil'],
      guidance: 'Choose heart-healthy fats, limit saturated fats'
    },
    kidney_disease: {
      keywords: ['kidney', 'renal', 'nephritis', 'أمراض الكلى', 'كلى'],
      avoid: ['phosphorus', 'potassium', 'sodium', 'protein excess'],
      recommend: ['controlled protein', 'low phosphorus', 'fresh foods'],
      guidance: 'Monitor protein, phosphorus, and potassium intake'
    },
    celiac: {
      keywords: ['celiac', 'gluten intolerance', 'gluten sensitivity', 'حساسية القمح'],
      avoid: ['gluten', 'wheat', 'barley', 'rye', 'oats'],
      recommend: ['gluten-free grains', 'rice', 'quinoa', 'corn'],
      guidance: 'Strictly avoid all gluten-containing foods'
    },
    ibs: {
      keywords: ['ibs', 'irritable bowel', 'digestive issues', 'القولون العصبي'],
      avoid: ['high fodmap', 'beans', 'dairy', 'spicy foods'],
      recommend: ['low fodmap', 'soluble fiber', 'probiotics'],
      guidance: 'Follow low FODMAP diet, avoid trigger foods'
    }
  };

  /**
   * Get health condition data for external access
   */
  static getHealthConditionData(condition: string) {
    return this.HEALTH_CONDITIONS[condition as keyof typeof this.HEALTH_CONDITIONS];
  }

  /**
   * Parse health-related query to extract conditions and goals
   */
  static async parseHealthQuery(query: string): Promise<ParsedHealthQuery> {
    try {
      const detectedLang = LanguageDetectorService.detectLanguage(query);
      
      const systemPrompt = `Analyze this health-related food query and extract medical conditions, health goals, and dietary needs.

Respond with JSON containing:
- conditions: Array of medical conditions mentioned (diabetes, hypertension, heart disease, kidney disease, celiac, ibs, etc.)
- goals: Array of health goals (weight loss, muscle gain, energy boost, inflammation reduction, etc.)
- restrictions: Array of specific restrictions (low sodium, sugar-free, high protein, etc.)
- preferences: Array of dietary preferences related to health

Use standardized medical terms. For Arabic queries, translate to English equivalents.

Examples:
- "I have diabetes, what can I eat?" → {"conditions": ["diabetes"], "goals": ["blood sugar control"], "restrictions": ["low sugar"], "preferences": []}
- "أعاني من ضغط الدم المرتفع" → {"conditions": ["hypertension"], "goals": ["blood pressure control"], "restrictions": ["low sodium"], "preferences": []}
- "Heart healthy options for weight loss" → {"conditions": ["heart disease"], "goals": ["weight loss", "heart health"], "restrictions": ["low fat"], "preferences": []}`;

      const response = await this.openai.chat.completions.create({
        model: AI_CONFIG.TEXT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        max_tokens: AI_CONFIG.MAX_TOKENS,
        temperature: AI_CONFIG.TEMPERATURE,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}') as ParsedHealthQuery;
      
      logger.info('Parsed health query', { 
        query, 
        detectedLang, 
        result 
      });

      return {
        conditions: result.conditions || [],
        goals: result.goals || [],
        restrictions: result.restrictions || [],
        preferences: result.preferences || []
      };

    } catch (error) {
      logger.error('Error parsing health query', { query, error });
      return {
        conditions: [],
        goals: [],
        restrictions: [],
        preferences: []
      };
    }
  }

  /**
   * Get health-based menu recommendations
   */
  static async getHealthInsights(request: HealthInsightRequest): Promise<HealthInsightResponse> {
    try {
      const { query, shopId, limit = 15, includeOutOfStock = false } = request;
      const detectedLang = LanguageDetectorService.detectLanguage(query);
      
      // Parse the health query
      const healthQuery = await this.parseHealthQuery(query);
      
      if (healthQuery.conditions.length === 0 && healthQuery.goals.length === 0) {
        logger.warn('No health conditions or goals detected', { query });
      }

      // Get menu items for the shop
      const menuItemQuery: any = { shopId: new mongoose.Types.ObjectId(shopId) };
      if (!includeOutOfStock) {
        menuItemQuery.isAvailable = true;
      }

      const menuItems = await MenuItemModel.find(menuItemQuery).lean() as unknown as IMenuItem[];

      if (menuItems.length === 0) {
        return {
          recommendations: [],
          healthConditions: healthQuery.conditions,
          nutritionalGuidance: 'No menu items available for analysis',
          detectedLanguage: detectedLang,
          totalFound: 0,
          disclaimerMessage: this.HEALTH_DISCLAIMER[detectedLang === 'ar' ? 'ar' : 'en']
        };
      }

      // Analyze menu items for health compatibility
      const recommendations = await this.analyzeMenuItemsForHealth(
        menuItems, 
        healthQuery, 
        shopId
      );

      // Generate nutritional guidance
      const guidance = await this.generateNutritionalGuidance(healthQuery, detectedLang);

      // Sort by health score and limit results
      const sortedRecommendations = recommendations
        .sort((a, b) => b.healthScore - a.healthScore)
        .slice(0, limit);

      logger.info('Health insights generated', {
        shopId,
        query,
        conditions: healthQuery.conditions,
        recommendationCount: sortedRecommendations.length
      });

      return {
        recommendations: sortedRecommendations,
        healthConditions: healthQuery.conditions,
        nutritionalGuidance: guidance,
        detectedLanguage: detectedLang,
        totalFound: sortedRecommendations.length,
        disclaimerMessage: this.HEALTH_DISCLAIMER[detectedLang === 'ar' ? 'ar' : 'en']
      };

    } catch (error) {
      logger.error('Error generating health insights', { request, error });
      throw error;
    }
  }

  /**
   * Analyze menu items for health compatibility
   */
  private static async analyzeMenuItemsForHealth(
    menuItems: IMenuItem[],
    healthQuery: ParsedHealthQuery,
    shopId: string
  ): Promise<HealthRecommendation[]> {
    const recommendations: HealthRecommendation[] = [];

    // Get AI data for menu items
    const menuItemIds = menuItems.map(item => item._id);
    const aiDataMap = new Map();
    
    const aiDataList = await AIMenuDataModel.find({
      menuItemId: { $in: menuItemIds }
    }).lean();

    aiDataList.forEach(data => {
      aiDataMap.set(data.menuItemId.toString(), data);
    });

    for (const menuItem of menuItems) {
      const aiData = aiDataMap.get(menuItem._id.toString());
      const healthAnalysis = await this.analyzeItemForHealth(menuItem, aiData, healthQuery);
      
      // Include all items but with different thresholds
      if (healthAnalysis.healthScore > 0.3) {
        recommendations.push(healthAnalysis);
      } else if (healthAnalysis.healthScore > 0.1) {
        // Include items with lower scores but still some health benefits
        recommendations.push(healthAnalysis);
      }
    }
    
    // If no recommendations found, include some basic items
    if (recommendations.length === 0 && menuItems.length > 0) {
      logger.info('No health-specific recommendations found, including basic items', { shopId });
      for (const menuItem of menuItems.slice(0, 5)) { // Include first 5 items
        const aiData = aiDataMap.get(menuItem._id.toString());
        const basicAnalysis = await this.analyzeItemForHealth(menuItem, aiData, healthQuery);
        recommendations.push(basicAnalysis);
      }
    }

    return recommendations;
  }

  /**
   * Analyze individual menu item for health compatibility
   */
  private static async analyzeItemForHealth(
    menuItem: IMenuItem,
    aiData: any,
    healthQuery: ParsedHealthQuery
  ): Promise<HealthRecommendation> {
    let healthScore = 0.5; // Base score
    const benefits: string[] = [];
    const warnings: string[] = [];
    const nutritionalHighlights: string[] = [];

    // Analyze based on detected conditions
    for (const condition of healthQuery.conditions) {
      const conditionData = this.HEALTH_CONDITIONS[condition as keyof typeof this.HEALTH_CONDITIONS];
      
      if (conditionData && aiData) {
        // Check for beneficial ingredients
        const beneficialIngredients = aiData.ingredients?.filter((ingredient: string) =>
          conditionData.recommend.some(rec => ingredient.includes(rec))
        ) || [];

        if (beneficialIngredients.length > 0) {
          healthScore += 0.2;
          benefits.push(`Good for ${condition}: contains ${beneficialIngredients.join(', ')}`);
        }

        // Check for ingredients to avoid
        const harmfulIngredients = aiData.ingredients?.filter((ingredient: string) =>
          conditionData.avoid.some(avoid => ingredient.includes(avoid))
        ) || [];

        if (harmfulIngredients.length > 0) {
          healthScore -= 0.3;
          warnings.push(`Caution for ${condition}: contains ${harmfulIngredients.join(', ')}`);
        }
      }
    }

    // Analyze dietary tags
    if (aiData?.dietaryTags) {
      aiData.dietaryTags.forEach((tag: string) => {
        switch (tag) {
          case 'low-sodium':
            if (healthQuery.conditions.includes('hypertension')) {
              healthScore += 0.2;
              benefits.push('Low sodium - good for blood pressure');
            }
            break;
          case 'high-protein':
            if (healthQuery.goals.includes('muscle gain')) {
              healthScore += 0.15;
              benefits.push('High protein for muscle building');
            }
            break;
          case 'low-carb':
            if (healthQuery.conditions.includes('diabetes')) {
              healthScore += 0.2;
              benefits.push('Low carb - helps blood sugar control');
            }
            break;
          case 'gluten-free':
            if (healthQuery.conditions.includes('celiac')) {
              healthScore += 0.3;
              benefits.push('Gluten-free - safe for celiac disease');
            }
            break;
        }
      });
    }

    // Analyze nutritional info if available
    if (aiData?.nutritionalInfo) {
      const nutrition = aiData.nutritionalInfo;
      
      if (nutrition.calories && nutrition.calories < 300) {
        if (healthQuery.goals.includes('weight loss')) {
          healthScore += 0.1;
          benefits.push('Lower calorie option');
        }
        nutritionalHighlights.push(`${nutrition.calories} calories`);
      }

      if (nutrition.fiber && nutrition.fiber > 5) {
        healthScore += 0.1;
        nutritionalHighlights.push('High fiber');
      }

      if (nutrition.sodium && nutrition.sodium > 600) {
        if (healthQuery.conditions.includes('hypertension')) {
          healthScore -= 0.2;
          warnings.push('High sodium content');
        }
      }
    }

    // Ensure score is between 0 and 1
    healthScore = Math.max(0, Math.min(1, healthScore));

    return {
      item: menuItem,
      healthScore,
      benefits,
      warnings,
      nutritionalHighlights,
      confidence: aiData ? 0.8 : 0.4 // Lower confidence if no AI data
    };
  }

  /**
   * Generate personalized nutritional guidance
   */
  public static async generateNutritionalGuidance(
    healthQuery: ParsedHealthQuery,
    language: string
  ): Promise<string> {
    try {
      const systemPrompt = `Generate personalized nutritional guidance for someone with these health conditions and goals.

Health conditions: ${healthQuery.conditions.join(', ')}
Health goals: ${healthQuery.goals.join(', ')}
Dietary restrictions: ${healthQuery.restrictions.join(', ')}

Provide 2-3 specific, actionable nutritional tips. ${language === 'ar' ? 'Respond in Arabic.' : 'Respond in English.'}
Keep it concise and practical for restaurant menu selection.`;

      const response = await this.openai.chat.completions.create({
        model: AI_CONFIG.TEXT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate guidance for: ${JSON.stringify(healthQuery)}` }
        ],
        max_tokens: 200,
        temperature: 0.7
      });

      return response.choices[0].message.content || 'Focus on balanced, nutrient-rich options.';

    } catch (error) {
      logger.error('Error generating nutritional guidance', { healthQuery, error });
      return language === 'ar' 
        ? 'ركز على الخيارات المتوازنة والغنية بالعناصر الغذائية.'
        : 'Focus on balanced, nutrient-rich options.';
    }
  }

  /**
   * Get condition-specific recommendations
   */
  static async getConditionSpecificRecommendations(
    condition: string,
    shopId: string,
    limit: number = 10
  ): Promise<HealthRecommendation[]> {
    const conditionData = this.HEALTH_CONDITIONS[condition as keyof typeof this.HEALTH_CONDITIONS];
    
    if (!conditionData) {
      return [];
    }

    // Build query to find items with beneficial ingredients
    const menuItems = await MenuItemModel.find({
      shopId: new mongoose.Types.ObjectId(shopId),
      isAvailable: true
    }).lean() as unknown as IMenuItem[];

    const healthQuery: ParsedHealthQuery = {
      conditions: [condition],
      goals: [],
      restrictions: [],
      preferences: []
    };

    return this.analyzeMenuItemsForHealth(menuItems, healthQuery, shopId);
  }
} 