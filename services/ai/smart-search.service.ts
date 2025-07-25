import { getOpenAIClient, AI_CONFIG } from '../../config/openai';
import { LanguageDetectorService } from './language-detector.service';
import { MenuItemModel, IMenuItem } from '../../models/MenuItem';
import { AIMenuDataModel } from '../../models/AIMenuData';
import { logger } from '../../config/pino';
import mongoose from 'mongoose';

export interface SmartSearchRequest {
  query: string;
  shopId: string;
  limit?: number;
  includeOutOfStock?: boolean;
}

export interface SmartSearchResponse {
  items: IMenuItem[];
  searchCriteria: ParsedSearchCriteria;
  detectedLanguage: string;
  totalFound: number;
  suggestions?: string[];
}

export interface ParsedSearchCriteria {
  keywords: string[];
  priceRange?: { min?: number; max?: number };
  dietaryRequirements: string[];
  excludeIngredients: string[];
  mealType?: string;
  cuisine?: string;
  healthFocus?: string[];
}

export class SmartSearchService {
  private static openai = getOpenAIClient();

  /**
   * Parse natural language search query into structured criteria
   */
  static async parseSearchQuery(query: string): Promise<ParsedSearchCriteria> {
    try {
      const detectedLang = LanguageDetectorService.detectLanguage(query);
      
      const systemPrompt = `Parse this restaurant menu search query into structured criteria.

Extract and respond with JSON containing:
- keywords: Array of food-related keywords (ingredients, dish names, cooking methods)
- priceRange: Object with min/max price bounds if mentioned (convert words like "cheap", "expensive" to numbers)
- dietaryRequirements: Array of dietary needs (vegan, halal, gluten-free, etc.)
- excludeIngredients: Array of ingredients to avoid
- mealType: Single string (breakfast, lunch, dinner, snack, dessert, etc.)
- cuisine: Single string (italian, chinese, arabic, etc.)
- healthFocus: Array of health aspects (low-calorie, high-protein, diabetic-friendly, etc.)

Price conversion guide:
- "cheap/affordable" = max: 40
- "under X" = max: X
- "expensive" = min: 80
- "moderate" = min: 40, max: 80

Examples:
- "chocolate dessert under 60 pounds" → {"keywords": ["chocolate", "dessert"], "priceRange": {"max": 60}, "mealType": "dessert"}
- "healthy chicken meal" → {"keywords": ["chicken"], "healthFocus": ["healthy"], "mealType": "meal"}
- "وجبة نباتية رخيصة" → {"keywords": [], "dietaryRequirements": ["vegetarian"], "priceRange": {"max": 40}}`;

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

      const result = JSON.parse(response.choices[0].message.content || '{}') as ParsedSearchCriteria;
      
      logger.info('Parsed search query', { 
        query, 
        detectedLang, 
        criteria: result 
      });

      return {
        keywords: result.keywords || [],
        priceRange: result.priceRange,
        dietaryRequirements: result.dietaryRequirements || [],
        excludeIngredients: result.excludeIngredients || [],
        mealType: result.mealType,
        cuisine: result.cuisine,
        healthFocus: result.healthFocus || []
      };

    } catch (error) {
      logger.error('Error parsing search query', { query, error });
      // Fallback to simple keyword extraction
      return {
        keywords: query.split(' ').filter(word => word.length > 2),
        dietaryRequirements: [],
        excludeIngredients: [],
        healthFocus: []
      };
    }
  }

  /**
   * Search menu items using natural language query
   */
  static async searchMenuItems(request: SmartSearchRequest): Promise<SmartSearchResponse> {
    try {
      const { query, shopId, limit = 20, includeOutOfStock = false } = request;
      
      // Parse the search query
      const criteria = await this.parseSearchQuery(query);
      
      // Build MongoDB query
      const mongoQuery: any = { 
        shopId: new mongoose.Types.ObjectId(shopId)
      };

      if (!includeOutOfStock) {
        mongoQuery.isAvailable = true;
      }

      // Price filtering
      if (criteria.priceRange) {
        if (criteria.priceRange.min !== undefined) {
          mongoQuery.price = { $gte: criteria.priceRange.min };
        }
        if (criteria.priceRange.max !== undefined) {
          mongoQuery.price = { ...mongoQuery.price, $lte: criteria.priceRange.max };
        }
      }

      // Text search on name and description
      if (criteria.keywords.length > 0) {
        const keywordRegex = criteria.keywords.map(keyword => 
          new RegExp(keyword, 'i')
        );
        
        mongoQuery.$or = [
          { 'name.en': { $in: keywordRegex } },
          { 'name.ar': { $in: keywordRegex } },
          { 'description.en': { $in: keywordRegex } },
          { 'description.ar': { $in: keywordRegex } }
        ];
      }

      // Get initial menu items
      let menuItems: IMenuItem[] = await MenuItemModel.find(mongoQuery)
        .limit(limit * 2) // Get extra for filtering
        .lean();

      // Apply AI-based filtering if we have dietary requirements or exclusions
      if (criteria.dietaryRequirements.length > 0 || criteria.excludeIngredients.length > 0) {
        menuItems = await this.applyAIFiltering(menuItems, criteria);
      }

      // Apply semantic ranking if we have keywords
      if (criteria.keywords.length > 0) {
        menuItems = await this.rankByRelevance(menuItems, criteria.keywords, query);
      }

      // Limit final results
      const finalItems = menuItems.slice(0, limit);

      // Generate suggestions for better results
      const suggestions = await this.generateSearchSuggestions(query, criteria, finalItems.length);

      logger.info('Smart search completed', {
        shopId,
        query,
        criteria,
        totalFound: finalItems.length
      });

      return {
        items: finalItems,
        searchCriteria: criteria,
        detectedLanguage: LanguageDetectorService.detectLanguage(query),
        totalFound: finalItems.length,
        suggestions
      };

    } catch (error) {
      logger.error('Error in smart search', { request, error });
      throw error;
    }
  }

  /**
   * Apply AI-based filtering for dietary requirements and exclusions
   */
  private static async applyAIFiltering(
    menuItems: IMenuItem[], 
    criteria: ParsedSearchCriteria
  ): Promise<IMenuItem[]> {
    if (menuItems.length === 0) return menuItems;

    const menuItemIds = menuItems.map(item => item._id);
    const aiDataMap = new Map();
    
    const aiDataList = await AIMenuDataModel.find({
      menuItemId: { $in: menuItemIds }
    }).lean();

    aiDataList.forEach(data => {
      aiDataMap.set(data.menuItemId.toString(), data);
    });

    return menuItems.filter(item => {
      const aiData = aiDataMap.get(item._id.toString());
      
      if (!aiData) {
        // If no AI data, include item (better to show than hide)
        return true;
      }

      // Check dietary requirements
      if (criteria.dietaryRequirements.length > 0) {
        const hasDietaryMatch = criteria.dietaryRequirements.some(req =>
          aiData.dietaryTags?.includes(req)
        );
        if (!hasDietaryMatch) return false;
      }

      // Check excluded ingredients
      if (criteria.excludeIngredients.length > 0) {
        const hasExcludedIngredient = criteria.excludeIngredients.some(excluded =>
          aiData.ingredients?.some((ingredient: string) => 
            ingredient.includes(excluded) || excluded.includes(ingredient)
          ) ||
          aiData.allergens?.some((allergen: string) => 
            allergen.includes(excluded) || excluded.includes(allergen)
          )
        );
        if (hasExcludedIngredient) return false;
      }

      return true;
    });
  }

  /**
   * Rank menu items by relevance to search keywords
   */
  private static async rankByRelevance(
    menuItems: IMenuItem[], 
    keywords: string[], 
    originalQuery: string
  ): Promise<IMenuItem[]> {
    // Simple text-based relevance scoring
    const scoredItems = menuItems.map(item => {
      let score = 0;
      const itemText = `${item.name.en} ${item.name.ar} ${item.description?.en} ${item.description?.ar}`.toLowerCase();
      
      keywords.forEach(keyword => {
        const keywordLower = keyword.toLowerCase();
        if (itemText.includes(keywordLower)) {
          score += itemText.split(keywordLower).length - 1;
        }
      });

      return { item, score };
    });

    // Sort by score (highest first)
    scoredItems.sort((a, b) => b.score - a.score);
    
    return scoredItems.map(scored => scored.item);
  }

  /**
   * Generate search suggestions when results are limited
   */
  private static async generateSearchSuggestions(
    query: string, 
    criteria: ParsedSearchCriteria, 
    resultCount: number
  ): Promise<string[]> {
    if (resultCount >= 5) return []; // Good enough results

    const suggestions: string[] = [];

    if (criteria.priceRange?.max && criteria.priceRange.max < 50) {
      suggestions.push("Try increasing your budget for more options");
    }

    if (criteria.dietaryRequirements.length > 2) {
      suggestions.push("Consider fewer dietary restrictions");
    }

    if (criteria.keywords.length > 3) {
      suggestions.push("Try simpler search terms");
    }

    if (suggestions.length === 0) {
      suggestions.push("Try browsing our categories", "Check out our popular items");
    }

    return suggestions.slice(0, 3);
  }
} 