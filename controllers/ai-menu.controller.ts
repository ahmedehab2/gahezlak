import { RequestHandler } from "express";
import mongoose from "mongoose";
import { AllergyFilterService } from "../services/ai/allergy-filter.service";
import { SmartSearchService, SmartSearchRequest, SmartSearchResponse } from "../services/ai/smart-search.service";
import { LanguageDetectorService } from "../services/ai/language-detector.service";
import { HealthInsightsService } from "../services/ai/health-insights.service";
import { SuccessResponse } from "../common/types/contoller-response.types";
import { MenuItemModel, IMenuItem } from "../models/MenuItem";
import { AIMenuDataModel } from "../models/AIMenuData";
import { extractMenuFromFile } from "../services/ai/vision-extract.service";
import { getOpenAIClient, AI_CONFIG } from "../config/openai";

/**
 * Filter menu items based on allergies and dietary restrictions
 */
export const allergyFilterHandler: RequestHandler<
  unknown,
  SuccessResponse<any>,
  { query: string; includeOutOfStock?: boolean }
> = async (req, res) => {
  const shopId = req.user?.shopId!;
  const { query, includeOutOfStock = false } = req.body;

  const filterRequest = {
    query,
    shopId,
    includeOutOfStock,
  };

  const result = await AllergyFilterService.filterMenuItems(filterRequest);

  res.status(200).json({
    message: "Menu items filtered successfully",
    data: result,
  });
};

/**
 * Smart search for menu items using natural language
 */
export const smartSearchHandler: RequestHandler<
  unknown,
  SuccessResponse<SmartSearchResponse>,
  { query: string; limit?: number; includeOutOfStock?: boolean }
> = async (req, res) => {
  const shopId = req.user?.shopId!;
  const { query, limit = 20, includeOutOfStock = false } = req.body;

  const searchRequest: SmartSearchRequest = {
    query,
    shopId,
    limit,
    includeOutOfStock,
  };

  const result = await SmartSearchService.searchMenuItems(searchRequest);

  res.status(200).json({
    message: "Smart search completed",
    data: result,
  });
};

/**
 * Process a menu item for AI data extraction
 */
export const processMenuItemHandler: RequestHandler<
  { itemId: string },
  SuccessResponse<{ processed: boolean; message: string }>,
  unknown
> = async (req, res) => {
  const shopId = req.user?.shopId!;
  const { itemId } = req.params;

  // Get the menu item
  const menuItem = await MenuItemModel.findOne({
    _id: itemId,
    shopId,
  }).lean();

  if (!menuItem) {
    res.status(404).json({
      message: "Menu item not found",
      data: { processed: false, message: "Menu item not found" },
    });
    return;
  }

  // Process with AI
  await AllergyFilterService.processMenuItemForAI(
    menuItem as unknown as IMenuItem
  );

  res.status(200).json({
    message: "Menu item processed successfully",
    data: { processed: true, message: "AI data extracted and stored" },
  });
};

/**
 * Batch process multiple menu items
 */
export const batchProcessMenuItemsHandler: RequestHandler<
  unknown,
  SuccessResponse<{
    processed: number;
    failed: number;
    total: number;
    details: string[];
  }>,
  { itemIds?: string[]; processAll?: boolean }
> = async (req, res) => {
  const shopId = req.user?.shopId!;
  const { itemIds, processAll = false } = req.body;

  let menuItems: IMenuItem[];

  if (processAll) {
    // Process all menu items for the shop
    const results = await MenuItemModel.find({
      shopId: new mongoose.Types.ObjectId(shopId),
    }).lean();
    menuItems = results as unknown as IMenuItem[];
  } else if (itemIds && itemIds.length > 0) {
    // Process specific items
    const results = await MenuItemModel.find({
      _id: { $in: itemIds.map((id) => new mongoose.Types.ObjectId(id)) },
      shopId: new mongoose.Types.ObjectId(shopId),
    }).lean();
    menuItems = results as unknown as IMenuItem[];
  } else {
    res.status(400).json({
      message: "Either provide itemIds or set processAll to true",
      data: { processed: 0, failed: 0, total: 0, details: [] },
    });
    return;
  }

  let processed = 0;
  let failed = 0;
  const details: string[] = [];

  // Process items one by one to avoid overwhelming the API
  for (const menuItem of menuItems) {
    try {
      await AllergyFilterService.processMenuItemForAI(menuItem as IMenuItem);
      processed++;
      details.push(`Processed: ${menuItem.name.en}`);
    } catch (error) {
      failed++;
      details.push(`Failed: ${menuItem.name.en} - ${(error as Error).message}`);
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  res.status(200).json({
    message: `Batch processing completed: ${processed} processed, ${failed} failed`,
    data: {
      processed,
      failed,
      total: menuItems.length,
      details: details.slice(0, 20), // Limit details to first 20 items
    },
  });
};

/**
 * Get health-based menu recommendations
 */
export const healthInsightsHandler: RequestHandler<
  unknown,
  SuccessResponse<any>,
  { query: string; limit?: number; includeOutOfStock?: boolean }
> = async (req, res) => {
  const shopId = req.user?.shopId!;
  const { query, limit = 15, includeOutOfStock = false } = req.body;

  const healthRequest = {
    query,
    shopId,
    limit,
    includeOutOfStock,
  };

  const result = await HealthInsightsService.getHealthInsights(healthRequest);

  res.status(200).json({
    message: "Health insights generated successfully",
    data: result,
  });
};

/**
 * Get recommendations for specific health condition
 */
export const conditionRecommendationsHandler: RequestHandler<
  { condition: string },
  SuccessResponse<{
    recommendations: any[];
    condition: string;
    guidance: string;
  }>,
  { limit?: number }
> = async (req, res) => {
  const shopId = req.user?.shopId!;
  const { condition } = req.params;
  const { limit = 10 } = req.body;

  const recommendations =
    await HealthInsightsService.getConditionSpecificRecommendations(
      condition,
      shopId,
      limit
    );

  // Get condition guidance
  const conditionData = (HealthInsightsService as any).HEALTH_CONDITIONS[
    condition
  ];
  const guidance =
    conditionData?.guidance ||
    "No specific guidance available for this condition";

  res.status(200).json({
    message: `Recommendations for ${condition} generated`,
    data: {
      recommendations,
      condition,
      guidance,
    },
  });
};

/**
 * Use AI to determine user intent and extract relevant information
 */
async function getIntentFromAI(query: string) {
  try {
    const openai = getOpenAIClient();
    
    const intentResponse = await openai.chat.completions.create({
      model: AI_CONFIG.TEXT_MODEL,
      messages: [
        { 
          role: 'system', 
          content: `Analyze this restaurant search query and determine the user's intent. Extract relevant information and respond with JSON:
          {
            "intent": "find|avoid|health",
            "confidence": 0.95,
            "extracted_keywords": [],
            "extracted_allergies": [],
            "extracted_health": [],
            "price_range": {
              "min": null,
              "max": null
            }
          }
          
          Intent definitions:
          - "find": User wants to discover/search for specific food items, ingredients, or dishes
          - "avoid": User has allergies, dislikes, or wants to exclude certain foods
          - "health": User has health conditions or wants health-focused recommendations
          
          Price extraction rules:
          - "under 50", "< 50", "less than 50" → {"max": 50}
          - "over 80", "> 80", "more than 80" → {"min": 80}
          - "between 30 and 70", "30-70" → {"min": 30, "max": 70}
          - "cheap" → {"max": 50}
          - "expensive" → {"min": 100}
          
          Examples:
          - "I want pizza" → {"intent": "find", "extracted_keywords": ["pizza"]}
          - "burgers under 80" → {"intent": "find", "extracted_keywords": ["burgers"], "price_range": {"max": 80}}
          - "show me cheap vegan options" → {"intent": "find", "extracted_keywords": ["vegan"], "price_range": {"max": 50}}
          - "expensive steaks" → {"intent": "find", "extracted_keywords": ["steaks"], "price_range": {"min": 100}}
          - "I'm allergic to nuts" → {"intent": "avoid", "extracted_allergies": ["nuts"]}
          - "I have diabetes" → {"intent": "health", "extracted_health": ["diabetes"]}
          
          Handle both English and Arabic queries naturally.`
        },
        { role: 'user', content: query }
      ],
      max_tokens: AI_CONFIG.MAX_TOKENS,
      temperature: AI_CONFIG.TEMPERATURE,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(intentResponse.choices[0].message.content || '{}');
    
    return {
      intent: result.intent || 'find',
      confidence: result.confidence || 0.5,
      keywords: result.extracted_keywords || [],
      allergies: result.extracted_allergies || [],
      health: result.extracted_health || [],
      priceRange: result.price_range || null
    };
  } catch (error) {
    console.error('Error getting intent from AI:', error);
    // Fallback to 'find' intent if AI fails
    return {
      intent: 'find',
      confidence: 0.3,
      keywords: [],
      allergies: [],
      health: [],
      priceRange: null
    };
  }
}

/**
 * Super endpoint: Combines allergy filter, health insights, and smart search
 */
export const superSearchHandler: RequestHandler<
  unknown,
  SuccessResponse<any>,
  {
    query: string;
    shopId?: string;
    limit?: number;
    includeOutOfStock?: boolean;
  }
> = async (req, res) => {
  // Use shopId from user or body
  const shopId = req.user?.shopId || req.body.shopId;
  const { query, limit = 20, includeOutOfStock = false } = req.body;

  // 1. Use AI to determine intent and extract information
  const aiIntent = await getIntentFromAI(query);
  
  const intent = aiIntent.intent as 'find' | 'avoid' | 'health';
  const allAllergies = aiIntent.allergies;
  const healthConditions = aiIntent.health;
  const searchKeywords = aiIntent.keywords;
  const priceRange = aiIntent.priceRange;
  
  const detectedLanguage = LanguageDetectorService.detectLanguage(query);

  // 2. Get all menu items for the shop
  const menuItemQuery: any = { shopId: new mongoose.Types.ObjectId(shopId) };
  if (!includeOutOfStock) menuItemQuery.isAvailable = true;
  const allMenuItems = (await MenuItemModel.find(
    menuItemQuery
  ).lean()) as unknown as IMenuItem[];

  // 3. Get AI data for menu items
  const menuItemIds = allMenuItems.map((item) => item._id);
  const aiDataList = await AIMenuDataModel.find({
    menuItemId: { $in: menuItemIds },
  }).lean();
  const aiDataMap = new Map<string, any>();
  aiDataList.forEach((data) => {
    aiDataMap.set(data.menuItemId.toString(), data);
  });

  // 4. Filtering logic based on intent
  const safeItems: IMenuItem[] = [];
  const excludedItems: { item: IMenuItem; reasons: string[] }[] = [];

  for (const menuItem of allMenuItems) {
    const aiData = aiDataMap.get(menuItem._id.toString());
    const reasons: string[] = [];
    const descriptionText = `
      ${menuItem.name.en || ''} ${menuItem.name.ar || ''} 
      ${menuItem.description?.en || ''} ${menuItem.description?.ar || ''}
    `.toLowerCase();
    const allIngredients = [
      ...(aiData?.ingredients || []),
    ];
    const allAllergensAI = [
      ...(aiData?.allergens || []),
    ];
    const allDietaryTags = [
      ...(aiData?.dietaryTags || []),
    ];

    // INTENT-BASED FILTERING
    if (intent === 'find') {
      // Normal search: match keywords/ingredients and price
      let matches = true; // Start with true, then apply filters
      
      // Keyword filtering
      if (searchKeywords && searchKeywords.length > 0) {
        const keywordMatch = searchKeywords.some((keyword: string) => {
          const keywordLower = keyword.toLowerCase();
          // Remove common plural suffixes for better matching
          const keywordBase = keywordLower.replace(/s$|es$/, '');
          
          return (
            // Check exact match in description text
            descriptionText.includes(keywordLower) ||
            // Check base form (singular/plural variations)
            descriptionText.includes(keywordBase) ||
            // Check if any ingredient matches
            allIngredients.some((ing) => 
              ing.toLowerCase().includes(keywordLower) ||
              ing.toLowerCase().includes(keywordBase) ||
              keywordLower.includes(ing.toLowerCase())
            ) ||
            // Check if any dietary tag matches
            allDietaryTags.some((tag) => 
              tag.toLowerCase().includes(keywordLower) ||
              tag.toLowerCase().includes(keywordBase) ||
              keywordLower.includes(tag.toLowerCase())
            )
          );
        });
        if (!keywordMatch) {
          matches = false;
          reasons.push(`does not match keywords: ${searchKeywords.join(', ')}`);
        }
      }
      
      // Price filtering
      if (matches && priceRange) {
        if (priceRange.min !== null && menuItem.price < priceRange.min) {
          matches = false;
          reasons.push(`price ${menuItem.price} is below minimum ${priceRange.min}`);
        }
        if (priceRange.max !== null && menuItem.price > priceRange.max) {
          matches = false;
          reasons.push(`price ${menuItem.price} is above maximum ${priceRange.max}`);
        }
      }
      
      // Final decision for 'find' intent
      if (matches) {
        safeItems.push(menuItem);
      } else {
        excludedItems.push({ item: menuItem, reasons });
      }
    } else if (intent === 'avoid') {
      // Allergy/dietary restriction: exclude unsafe items
      let hasAllergen = false;
      
      // DEBUG: Log what we're checking
      console.log('=== AVOID FILTERING DEBUG ===');
      console.log('Item:', menuItem.name.en);
      console.log('Extracted allergies:', allAllergies);
      console.log('Description text:', descriptionText);
      console.log('AI Ingredients:', allIngredients);
      console.log('AI Allergens:', allAllergensAI);
      
      if (allAllergies.length > 0) {
        hasAllergen = allAllergies.some((allergy: string) => {
          const allergyLower = allergy.toLowerCase();
          // Remove common suffixes for better matching (tomato/tomatoes)
          const allergyBase = allergyLower.replace(/s$|es$/, '');
          
          console.log('Checking allergy:', allergyLower, 'base:', allergyBase);
          
          let hasInAI = false;
          if (allAllergensAI.length || allIngredients.length) {
            hasInAI = [...allAllergensAI, ...allIngredients].some(
              (itemAllergen) => {
                const itemAllergenLower = itemAllergen.toLowerCase();
                return (
                  itemAllergenLower.includes(allergyLower) ||
                  itemAllergenLower.includes(allergyBase) ||
                  allergyLower.includes(itemAllergenLower) ||
                  allergyBase.includes(itemAllergenLower)
                );
              }
            );
          }
          
          // More flexible description matching
          const hasInDescription = (
            descriptionText.includes(allergyLower) ||
            descriptionText.includes(allergyBase)
          );
          
          console.log('Has in AI:', hasInAI, 'Has in description:', hasInDescription);
          
          if (hasInAI || hasInDescription) {
            reasons.push(`contains allergen: ${allergy}`);
            console.log('FOUND ALLERGEN:', allergy);
            return true;
          }
          return false;
        });
      }
      
      console.log('Final hasAllergen:', hasAllergen);
      console.log('==============================');
      
      if (!hasAllergen) safeItems.push(menuItem);
      else excludedItems.push({ item: menuItem, reasons });
    } else if (intent === 'health') {
      // Health insights: exclude items with harmful ingredients
      let healthUnsuitable = false;
      if (healthConditions.length > 0 && aiData) {
        for (const condition of healthConditions) {
          const conditionData = (HealthInsightsService as any).HEALTH_CONDITIONS[condition];
          if (conditionData) {
            const harmfulIngredients =
              allIngredients.filter((ingredient) =>
                conditionData.avoid.some((avoid: string) =>
                  ingredient.toLowerCase().includes(avoid.toLowerCase())
                )
              ) || [];
            if (harmfulIngredients.length > 0) {
              reasons.push(
                `not suitable for ${condition}: contains ${harmfulIngredients.join(', ')}`
              );
              healthUnsuitable = true;
            }
          }
        }
      }
      if (!healthUnsuitable) safeItems.push(menuItem);
      else excludedItems.push({ item: menuItem, reasons });
    }
  }

  // Health advice (if relevant)
  let healthAdvice = "";
  if (intent === 'health' && healthConditions.length > 0) {
    healthAdvice = await HealthInsightsService.generateNutritionalGuidance(
      { 
        conditions: healthConditions,
        goals: [],
        restrictions: [],
        preferences: []
      },
      detectedLanguage
    );
  }

  // Always include image (imgUrl) in each item
  const addImgUrl = (item: IMenuItem) => ({
    ...item,
    imgUrl: item.imgUrl || "",
  });
  const safeItemsWithImg = safeItems.map(addImgUrl);
  const excludedItemsWithImg = excludedItems.map(({ item, reasons }) => ({
    item: addImgUrl(item),
    reasons,
  }));

  res.status(200).json({
    message: "Super search completed",
    data: {
      safeItems: safeItemsWithImg,
      excludedItems: excludedItemsWithImg,
      healthAdvice,
      intent,
    },
  });
};

/**
 * AI Vision Extract Endpoint: Extract menu items from image or PDF using AI (GPT-4 Vision)
 * Expects a file upload (field: 'file').
 * Returns structured menu data, errors, and warnings (does NOT save to DB).
 */
export const visionExtractHandler: RequestHandler = async (req, res) => {
  try {
    // 1. Check for uploaded files (always field: 'files')
    const files = (req as any).files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      res.status(400).json({
        message: "No file(s) uploaded. Please upload images or a PDF.",
      });
      return;
    }
    // 2. Validate file types
    const imageFiles = files.filter((f) => f.mimetype.startsWith("image/"));
    const pdfFiles = files.filter((f) => f.mimetype === "application/pdf");
    if (pdfFiles.length > 1) {
      res
        .status(400)
        .json({ message: "Only one PDF can be uploaded at a time." });
      return;
    }
    if (pdfFiles.length === 1 && imageFiles.length > 0) {
      res.status(400).json({
        message: "Please upload either images or a single PDF, not both.",
      });
      return;
    }
    let allItems: any[] = [];
    let allErrors: string[] = [];
    let allWarnings: string[] = [];
    if (pdfFiles.length === 1) {
      // Single PDF
      const { buffer, mimetype } = pdfFiles[0];
      const result = await extractMenuFromFile(buffer, mimetype);
      allItems = result.items;
      allErrors = result.errors;
      allWarnings = result.warnings;
    } else {
      // Only images (1-5)
      for (const imgFile of imageFiles) {
        const { buffer, mimetype } = imgFile;
        const result = await extractMenuFromFile(buffer, mimetype);
        allItems.push(...result.items);
        allErrors.push(...result.errors);
        allWarnings.push(...result.warnings);
      }
    }
    // Build unique categories array
    const categorySet = new Set<string>();
    for (const item of allItems) {
      if (item.category) categorySet.add(item.category);
      else categorySet.add("Uncategorized");
    }
    const categories = Array.from(categorySet).map((cat) => {
      const lang = LanguageDetectorService.detectLanguage(cat);
      return {
        name: {
          en: lang === "en" ? cat : "",
          ar: lang === "ar" ? cat : ""
        },
        description: { en: "", ar: "" },
      };
    });
    // Build flat items array
    const items = allItems.map((item) => {
      const nameLang = LanguageDetectorService.detectLanguage(item.name ?? "");
      const descLang = LanguageDetectorService.detectLanguage(item.description ?? "");
      return {
        name: {
          en: nameLang === "en" ? item.name ?? "" : "",
          ar: nameLang === "ar" ? item.name ?? "" : ""
        },
        description: {
          en: descLang === "en" ? item.description ?? "" : "",
          ar: descLang === "ar" ? item.description ?? "" : ""
        },
        price: item.price ?? null,
        category: item.category ?? "Uncategorized",
        isAvailable: true,
      };
    });
    res.status(200).json({
      message: "Menu extraction completed",
      data: {
        categories,
        items,
        errors: allErrors,
        warnings: allWarnings,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred during menu extraction",
      error: (error as Error).message,
    });
  }
};

/**
 * Bulk insert menu items (AI/automation only, not core logic)
 * POST /api/ai/menu/bulk-insert
 * Body: { items: [ ... ] }
 */
export const bulkInsertMenuItemsHandler: RequestHandler = async (req, res) => {
  const shopId = req.user?.shopId!;
  const items = req.body.items;
  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({
      message: "No items provided",
      data: {
        successCount: 0,
        failCount: 0,
        items: [],
        errors: [],
      },
    });
    return;
  }
  // Inline validation (basic)
  const requiredFields = ["name", "description", "price", "categoryId"];
  const results: any[] = [];
  const errors: { index: number; error: string }[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    // Basic validation
    for (const field of requiredFields) {
      if (!item[field]) {
        errors.push({ index: i, error: `Missing required field: ${field}` });
        continue;
      }
    }
    if (typeof item.price !== "number" || item.price < 0) {
      errors.push({ index: i, error: `Invalid price` });
      continue;
    }
    // Duplicate prevention: check if item with same name, categoryId, and shopId exists
    const existing = await MenuItemModel.findOne({
      shopId,
      "name.en": { $regex: new RegExp(`^${item.name.en}$`, "i") },
      categoryId: item.categoryId,
    });
    if (existing) {
      errors.push({
        index: i,
        error: `Duplicate item: ${item.name.en} in this category already exists.`,
      });
      continue;
    }
    // Insert
    try {
      const created = await MenuItemModel.create({ ...item, shopId });
      results.push(created.toObject());
    } catch (err: any) {
      errors.push({ index: i, error: err.message || "Unknown error" });
    }
  }
  res.status(201).json({
    message: "Bulk insert completed",
    data: {
      successCount: results.length,
      failCount: errors.length,
      items: results,
      errors,
    },
  });
};
