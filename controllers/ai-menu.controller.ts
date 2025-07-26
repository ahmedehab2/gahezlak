import { RequestHandler } from "express";
import { SuccessResponse } from "../common/types/contoller-response.types";
import {
  AllergyFilterService,
  AllergyFilterRequest,
  AllergyFilterResponse,
} from "../services/ai/allergy-filter.service";
import {
  SmartSearchService,
  SmartSearchRequest,
  SmartSearchResponse,
} from "../services/ai/smart-search.service";

import {
  HealthInsightsService,
  HealthInsightRequest,
  HealthInsightResponse,
} from "../services/ai/health-insights.service";
import { IMenuItem, MenuItemModel } from "../models/MenuItem";
import mongoose from "mongoose";
import { LanguageDetectorService } from "../services/ai/language-detector.service";
import { AIMenuDataModel } from "../models/AIMenuData";
import { extractMenuFromFile } from "../services/ai/vision-extract.service";

/**
 * Filter menu items based on allergies and dietary restrictions
 */
export const allergyFilterHandler: RequestHandler<
  unknown,
  SuccessResponse<AllergyFilterResponse>,
  { query: string; includeOutOfStock?: boolean }
> = async (req, res) => {
  const shopId = req.user?.shopId!;
  const { query, includeOutOfStock = false } = req.body;

  const filterRequest: AllergyFilterRequest = {
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
  SuccessResponse<HealthInsightResponse>,
  { query: string; limit?: number; includeOutOfStock?: boolean }
> = async (req, res) => {
  const shopId = req.user?.shopId!;
  const { query, limit = 15, includeOutOfStock = false } = req.body;

  const healthRequest: HealthInsightRequest = {
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

  // 1. Extract allergies, health conditions, and search criteria
  const [extracted, healthParsed, searchParsed] = await Promise.all([
    AllergyFilterService.extractAllergiesFromQuery(query),
    HealthInsightsService.parseHealthQuery(query),
    SmartSearchService.parseSearchQuery(query),
  ]);
  const allAllergies = [
    ...(extracted.allergies || []),
    ...(extracted.dietaryRestrictions || []),
  ];
  const healthConditions = healthParsed.conditions || [];
  const detectedLanguage = LanguageDetectorService.detectLanguage(query);

  // INTENT DETECTION: Determine if user wants to 'find', 'avoid', or get 'health' advice
  let intent: 'find' | 'avoid' | 'health' = 'find';
  const queryLower = query.toLowerCase();
  
  // Arabic avoidance phrases (common Arabic allergy/avoidance expressions)
  const arabicAvoidPhrases = [
    'عندي حساسية من', 'حساسية ل', 'بدون', 'ما أحب', 'مبحبش', 'مش بحب', 'مش بتحب',
    'ما عجبني', 'ما يعجبني', 'مش عجبني', 'مش يعجبني', 'ما أكل', 'ما بأكل',
    'مش بأكل', 'ما أشرب', 'ما بشرب', 'مش بشرب', 'ما أحبش', 'ما بتحبش'
  ];
  
  const allergyAvoidRegex = /allergic to|allergy to|sensitive to|intolerant to|without|avoid|can't eat|cannot eat|don't like|do not like|hate|dislike|not a fan of|no|never|won't eat|will not eat/;
  
  // Check for Arabic avoidance phrases
  const hasArabicAvoidance = arabicAvoidPhrases.some(phrase => queryLower.includes(phrase));
  
  if (allergyAvoidRegex.test(queryLower) || hasArabicAvoidance) {
    intent = 'avoid';
  } else if (
    queryLower.includes('diabetes') ||
    queryLower.includes('keto') ||
    queryLower.includes('hypertension') ||
    queryLower.includes('health') ||
    queryLower.includes('سكري') ||
    queryLower.includes('ضغط') ||
    queryLower.includes('صحة') ||
    healthConditions.length > 0
  ) {
    intent = 'health';
  } else if (
    /find|show me|contains|with/.test(queryLower) ||
    (searchParsed.keywords && searchParsed.keywords.length > 0)
  ) {
    intent = 'find';
  } else if (
    // If the query is a single word and matches an allergen, treat as 'find'
    allAllergies.length === 1 && query.trim().split(' ').length === 1
  ) {
    intent = 'find';
  }

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
      // Normal search: match keywords/ingredients
      let matches = false;
      if (searchParsed.keywords && searchParsed.keywords.length > 0) {
        matches = searchParsed.keywords.some((keyword) =>
          descriptionText.includes(keyword.toLowerCase()) ||
          allIngredients.some((ing) => ing.includes(keyword.toLowerCase())) ||
          allDietaryTags.some((tag) => tag.includes(keyword.toLowerCase()))
        );
      }
      // If no keywords or no matches found, include all items
      if (!searchParsed.keywords || searchParsed.keywords.length === 0 || !matches) {
        safeItems.push(menuItem);
      } else {
        safeItems.push(menuItem);
      }
    } else if (intent === 'avoid') {
      // Allergy/dietary restriction: exclude unsafe items
      let hasAllergen = false;
      if (allAllergies.length > 0) {
        hasAllergen = allAllergies.some((allergy) => {
          let hasInAI = false;
          if (allAllergensAI.length || allIngredients.length) {
            hasInAI = [...allAllergensAI, ...allIngredients].some(
              (itemAllergen) =>
                itemAllergen.toLowerCase().includes(allergy.toLowerCase()) ||
                allergy.toLowerCase().includes(itemAllergen.toLowerCase())
            );
          }
          const hasInDescription = new RegExp(
            `\\b${allergy.toLowerCase()}\\b`,
            'i'
          ).test(descriptionText);
          if (hasInAI || hasInDescription) {
            reasons.push(`contains allergen: ${allergy}`);
            return true;
          }
          return false;
        });
      }
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
      healthParsed,
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
