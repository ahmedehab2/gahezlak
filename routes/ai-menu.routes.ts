import { Router } from "express";
import * as aiMenuController from "../controllers/ai-menu.controller";
import { protect } from "../middlewares/auth";
import { checkShopAccess } from "../middlewares/shop-member-check.middleware";
import { uploadMultipleMiddleware } from '../middlewares/multer';

const aiMenuRoutes = Router();

// All AI routes require authentication and shop membership
aiMenuRoutes.use(protect);
aiMenuRoutes.use(checkShopAccess("member"));

/**
 * POST /api/ai/menu/allergy-filter
 * Filter menu items based on allergies and dietary restrictions
 * Body: { query: string, includeOutOfStock?: boolean }
 */
aiMenuRoutes.post("/allergy-filter", aiMenuController.allergyFilterHandler);

/**
 * POST /api/ai/menu/smart-search  
 * Natural language search for menu items
 * Body: { query: string, limit?: number, includeOutOfStock?: boolean }
 */
aiMenuRoutes.post("/smart-search", aiMenuController.smartSearchHandler);

/**
 * POST /api/ai/menu/super-search
 * Super endpoint: combines allergy filter, health insights, and smart search
 * Body: { query: string, shopId?: string, limit?: number, includeOutOfStock?: boolean }
 */
aiMenuRoutes.post("/super-search", aiMenuController.superSearchHandler);

/**
 * POST /api/ai/menu/process/:itemId
 * Process a single menu item for AI data extraction
 */
aiMenuRoutes.post("/process/:itemId", aiMenuController.processMenuItemHandler);

/**
 * POST /api/ai/menu/batch-process
 * Batch process multiple menu items for AI data extraction
 * Body: { itemIds?: string[], processAll?: boolean }
 */
aiMenuRoutes.post("/batch-process", aiMenuController.batchProcessMenuItemsHandler);

/**
 * POST /api/ai/menu/health-insights
 * Get health-based menu recommendations
 * Body: { query: string, limit?: number, includeOutOfStock?: boolean }
 */
aiMenuRoutes.post("/health-insights", aiMenuController.healthInsightsHandler);

/**
 * POST /api/ai/menu/condition/:condition
 * Get recommendations for specific health condition
 * Params: condition (diabetes, hypertension, heart_disease, etc.)
 * Body: { limit?: number }
 */
aiMenuRoutes.post("/condition/:condition", aiMenuController.conditionRecommendationsHandler);

/**
 * POST /api/ai/menu/bulk-insert
 * Bulk insert menu items (AI/automation only)
 * Body: { items: [ ... ] }
 */
aiMenuRoutes.post('/bulk-insert', aiMenuController.bulkInsertMenuItemsHandler);

/**
 * POST /api/ai/menu/vision-extract
 * AI-powered menu extraction from image or PDF (staff/admin only)
 * Upload field: 'files' (multiple images) or 'file' (single PDF)
 */
// Use uploadMultipleMiddleware for images (field: 'files'), fallback to uploadSingleMiddleware for PDF (field: 'file')
// The controller will handle validation and error if both are present
aiMenuRoutes.post('/vision-extract', uploadMultipleMiddleware('files'), aiMenuController.visionExtractHandler);

export { aiMenuRoutes }; 