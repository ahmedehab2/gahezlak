import { getOpenAIClient, AI_CONFIG } from '../../config/openai';
import { LanguageDetectorService } from './language-detector.service';
import { AIMenuDataModel, IAIMenuData } from '../../models/AIMenuData';
import { MenuItemModel, IMenuItem } from '../../models/MenuItem';

import { logger } from '../../config/pino';
import mongoose from 'mongoose';

export interface AllergyFilterRequest {
  query: string;
  shopId: string;
  includeOutOfStock?: boolean;
}

export interface AllergyFilterResponse {
  safeItems: IMenuItem[];
  unsafeItems: IMenuItem[];
  extractedAllergies: string[];
  detectedLanguage: string;
  totalFiltered: number;
}

export interface ExtractedAllergies {
  allergies: string[];
  dietaryRestrictions: string[];
  preferences: string[];
}

export class AllergyFilterService {
  private static openai = getOpenAIClient();

  /**
   * Get common variations of allergens for better detection
   */
  public static getAllergyVariations(allergy: string): string[] {
    const variations: { [key: string]: string[] } = {
      'chocolate': ['chocolate', 'cocoa', 'cacao', 'choc'],
      'nuts': ['nuts', 'peanuts', 'tree nuts', 'almonds', 'walnuts', 'cashews', 'pistachios'],
      'dairy': ['dairy', 'milk', 'cheese', 'cream', 'butter', 'yogurt'],
      'gluten': ['gluten', 'wheat', 'barley', 'rye', 'flour'],
      'eggs': ['eggs', 'egg', 'egg whites', 'egg yolks'],
      'fish': ['fish', 'salmon', 'tuna', 'cod', 'halibut'],
      'shellfish': ['shellfish', 'shrimp', 'crab', 'lobster', 'oysters'],
      'soy': ['soy', 'soybean', 'soya', 'tofu'],
      'sesame': ['sesame', 'sesame seeds', 'tahini']
    };

    const lowerAllergy = allergy.toLowerCase();
    return variations[lowerAllergy] || [allergy];
  }

  /**
   * Extract allergies and dietary restrictions from natural language
   */
  static async extractAllergiesFromQuery(query: string): Promise<ExtractedAllergies> {
    try {
      // Input validation
      if (!query || typeof query !== 'string') {
        logger.warn('Invalid query provided', { query });
        return { allergies: [], dietaryRestrictions: [], preferences: [] };
      }

      // Clean the query
      const cleanQuery = query.trim();
      if (cleanQuery.length === 0) {
        logger.warn('Empty query provided');
        return { allergies: [], dietaryRestrictions: [], preferences: [] };
      }

      // Check if query is too short (likely nonsense)
      if (cleanQuery.length < 3) {
        logger.warn('Query too short, likely nonsense', { query: cleanQuery });
        return { allergies: [], dietaryRestrictions: [], preferences: [] };
      }

      const detectedLang = LanguageDetectorService.detectLanguage(cleanQuery);
      const systemPrompt = `Extract allergies, dietary restrictions, and food preferences from the user's message. 
      
Respond with a JSON object containing:
- allergies: array of specific allergens (nuts, dairy, gluten, eggs, fish, shellfish, soy, wheat, sesame, etc.)
- dietaryRestrictions: array of dietary tags (vegan, vegetarian, halal, kosher, gluten-free, dairy-free, etc.)
- preferences: array of general preferences (low-sodium, high-protein, organic, etc.)

Use standardized terms in lowercase. If the user mentions "nuts", include both "nuts" and "peanuts". If they mention "chocolate", include "chocolate", "cocoa", "cacao".

IMPORTANT: If the message contains nonsense, random characters, or no relevant food information, return empty arrays for all fields.

Examples:
- "I'm allergic to nuts and dairy" → {"allergies": ["nuts", "peanuts", "tree nuts", "dairy", "milk"], "dietaryRestrictions": [], "preferences": []}
- "I'm allergic to chocolate" → {"allergies": ["chocolate", "cocoa", "cacao"], "dietaryRestrictions": [], "preferences": []}
- "I'm vegan and can't have gluten" → {"allergies": ["gluten", "wheat"], "dietaryRestrictions": ["vegan", "gluten-free"], "preferences": []}
- "blah blah blah" → {"allergies": [], "dietaryRestrictions": [], "preferences": []}
- "123456789" → {"allergies": [], "dietaryRestrictions": [], "preferences": []}
- "لديّ حساسية من المكسرات والألبان" → {"allergies": ["nuts", "peanuts", "tree nuts", "dairy", "milk"], "dietaryRestrictions": [], "preferences": []}`;

      const response = await this.openai.chat.completions.create({
        model: AI_CONFIG.TEXT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: cleanQuery }
        ],
        max_tokens: AI_CONFIG.MAX_TOKENS,
        temperature: AI_CONFIG.TEMPERATURE,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}') as ExtractedAllergies;
      
      logger.info('Extracted allergies from query', { 
        query, 
        detectedLang, 
        result 
      });

      return {
        allergies: result.allergies || [],
        dietaryRestrictions: result.dietaryRestrictions || [],
        preferences: result.preferences || []
      };

    } catch (error) {
      logger.error('Error extracting allergies from query', { query, error });
      throw new Error('Failed to process allergy query');
    }
  }

  /**
   * Filter menu items based on allergies and dietary restrictions
   */
  static async filterMenuItems(request: AllergyFilterRequest): Promise<AllergyFilterResponse> {
    try {
      const { query, shopId, includeOutOfStock = false } = request;
      
      // Extract allergies from natural language
      const extracted = await this.extractAllergiesFromQuery(query);
      const allAllergies = [...extracted.allergies, ...extracted.dietaryRestrictions];
      
      if (allAllergies.length === 0) {
        logger.warn('No allergies detected in query', { query });
      }

      // Build menu item query
      const menuItemQuery: any = { shopId: new mongoose.Types.ObjectId(shopId) };
      if (!includeOutOfStock) {
        menuItemQuery.isAvailable = true;
      }

      // Get all menu items for the shop
      const allMenuItems = await MenuItemModel.find(menuItemQuery).lean() as unknown as IMenuItem[];
      
      // Debug: Check for duplicate items
      const itemIds = allMenuItems.map(item => item._id.toString());
      const uniqueIds = new Set(itemIds);
      if (itemIds.length !== uniqueIds.size) {
        logger.warn('Duplicate menu items found', {
          totalItems: itemIds.length,
          uniqueItems: uniqueIds.size,
          duplicates: itemIds.length - uniqueIds.size
        });
      }
      
      // Log all items for debugging
      logger.info('All menu items found', {
        totalItems: allMenuItems.length,
        items: allMenuItems.map(item => ({
          id: item._id.toString(),
          name: item.name.en,
          description: item.description?.en?.substring(0, 50) + '...'
        }))
      });

      if (allMenuItems.length === 0) {
        return {
          safeItems: [],
          unsafeItems: [],
          extractedAllergies: allAllergies,
          detectedLanguage: LanguageDetectorService.detectLanguage(query),
          totalFiltered: 0
        };
      }

      // Get AI data for menu items
      const menuItemIds = allMenuItems.map(item => item._id);
      const aiDataMap = new Map<string, IAIMenuData>();
      
      const aiDataList = await AIMenuDataModel.find({
        menuItemId: { $in: menuItemIds }
      }).lean() as unknown as IAIMenuData[];

      aiDataList.forEach(data => {
        aiDataMap.set(data.menuItemId.toString(), data);
      });
      
      // Debug: Check if Chocolate Brownie needs AI processing
      const chocolateBrownie = allMenuItems.find(item => 
        item.name.en.toLowerCase().includes('chocolate brownie')
      );
      if (chocolateBrownie && !aiDataMap.has(chocolateBrownie._id.toString())) {
        logger.info('Chocolate Brownie needs AI processing - no AI data found');
        // Process it now
        try {
          const aiData = await this.processMenuItemForAI(chocolateBrownie);
          aiDataMap.set(chocolateBrownie._id.toString(), aiData);
          logger.info('Chocolate Brownie AI processing completed', {
            allergens: aiData.allergens,
            ingredients: aiData.ingredients
          });
        } catch (error) {
          logger.error('Failed to process Chocolate Brownie with AI', { error });
        }
      }

      // Filter items based on allergies
      const safeItems: IMenuItem[] = [];
      const unsafeItems: IMenuItem[] = [];

      for (const menuItem of allMenuItems) {
        const aiData = aiDataMap.get(menuItem._id.toString());
        
        // Debug: Log all items being processed
        logger.info('Processing menu item for allergy check', {
          menuItemId: menuItem._id.toString(),
          menuItemName: menuItem.name.en,
          description: menuItem.description?.en
        });
        
        // Check both AI-processed data and original description
        const itemAllergens = aiData ? [...(aiData.allergens || []), ...(aiData.ingredients || [])] : [];
        const descriptionText = `${menuItem.name.en} ${menuItem.description?.en || ''}`.toLowerCase();
        
        // Debug: Log AI data for Chocolate Brownie
        if (menuItem.name.en.toLowerCase().includes('chocolate brownie')) {
          logger.info('Chocolate Brownie AI data check', {
            menuItemName: menuItem.name.en,
            hasAIData: !!aiData,
            aiAllergens: aiData?.allergens || [],
            aiIngredients: aiData?.ingredients || [],
            description: menuItem.description?.en,
            descriptionText: descriptionText.substring(0, 100) + '...'
          });
        }
        
        const hasAllergen = allAllergies.some(allergy => {
          // Check AI-processed allergens if available
          let hasInAI = false;
          if (aiData && itemAllergens.length > 0) {
            hasInAI = itemAllergens.some(itemAllergen => 
              itemAllergen.toLowerCase().includes(allergy.toLowerCase()) || 
              allergy.toLowerCase().includes(itemAllergen.toLowerCase())
            );
          }
          
          // Check original description (always check this) - use word boundaries
          const hasInDescription = new RegExp(`\\b${allergy.toLowerCase()}\\b`, 'i').test(descriptionText);
          
          // Check for common variations (e.g., chocolate -> cocoa, cacao) - use word boundaries
          const allergyVariations = this.getAllergyVariations(allergy);
          const hasVariation = allergyVariations.some(variation => 
            new RegExp(`\\b${variation.toLowerCase()}\\b`, 'i').test(descriptionText)
          );
          
          const isUnsafe = hasInAI || hasInDescription || hasVariation;
          
          // Log detection details for debugging
          if (isUnsafe) {
            logger.info('Allergen detected in menu item', {
              menuItemName: menuItem.name.en,
              allergy,
              hasInAI,
              hasInDescription,
              hasVariation,
              descriptionText: descriptionText.substring(0, 100) + '...',
              aiAllergens: itemAllergens,
              hasAIData: !!aiData
            });
          }
          
          return isUnsafe;
        });

        // Add debug logging for the Chocolate Brownie specifically
        if (menuItem.name.en.toLowerCase().includes('chocolate brownie')) {
          logger.info('Chocolate Brownie allergen check', {
            menuItemName: menuItem.name.en,
            description: menuItem.description?.en,
            allAllergies,
            hasAllergen,
            descriptionText: descriptionText.substring(0, 100) + '...',
            willBeAddedTo: hasAllergen ? 'unsafeItems' : 'safeItems'
          });
        }



        if (hasAllergen) {
          unsafeItems.push(menuItem);
          logger.info('Added to unsafeItems', { 
            menuItemName: menuItem.name.en, 
            menuItemId: menuItem._id.toString() 
          });
        } else {
          safeItems.push(menuItem);
          logger.info('Added to safeItems', { 
            menuItemName: menuItem.name.en, 
            menuItemId: menuItem._id.toString() 
          });
        }
      }

      logger.info('Menu items filtered for allergies', {
        shopId,
        totalItems: allMenuItems.length,
        safeItems: safeItems.length,
        unsafeItems: unsafeItems.length,
        extractedAllergies: allAllergies
      });

      return {
        safeItems,
        unsafeItems,
        extractedAllergies: allAllergies,
        detectedLanguage: LanguageDetectorService.detectLanguage(query),
        totalFiltered: unsafeItems.length
      };

    } catch (error) {
      logger.error('Error filtering menu items', { request, error });
      throw error;
    }
  }

  /**
   * Process a menu item to extract AI data
   */
  static async processMenuItemForAI(menuItem: IMenuItem): Promise<IAIMenuData> {
    try {
      const itemDescription = `${menuItem.name.en} - ${menuItem.description?.en || ''}`;
      
      const systemPrompt = `Analyze this menu item and extract:
1. ingredients: List main ingredients (basic form, lowercase)
2. allergens: Common allergens present (nuts, dairy, gluten, eggs, fish, shellfish, soy, wheat, etc.)
3. dietaryTags: Dietary classifications (vegan, vegetarian, halal, gluten-free, etc.)

Respond with JSON only. Be conservative - only include allergens you're confident about.`;

      const response = await this.openai.chat.completions.create({
        model: AI_CONFIG.TEXT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: itemDescription }
        ],
        max_tokens: AI_CONFIG.MAX_TOKENS,
        temperature: AI_CONFIG.TEMPERATURE,
        response_format: { type: 'json_object' }
      });

      const aiResult = JSON.parse(response.choices[0].message.content || '{}');

      // Create or update AI data
      const aiData = await AIMenuDataModel.findOneAndUpdate(
        { menuItemId: menuItem._id },
        {
          menuItemId: menuItem._id,
          shopId: menuItem.shopId,
          ingredients: aiResult.ingredients || [],
          allergens: aiResult.allergens || [],
          dietaryTags: aiResult.dietaryTags || [],
          aiProcessed: true,
          lastAIUpdate: new Date()
        },
        { upsert: true, new: true }
      );

      logger.info('Processed menu item for AI', {
        menuItemId: menuItem._id,
        ingredients: aiResult.ingredients?.length || 0,
        allergens: aiResult.allergens?.length || 0
      });

      return aiData.toObject();

    } catch (error) {
      logger.error('Error processing menu item for AI', { menuItemId: menuItem._id, error });
      throw error;
    }
  }
} 