import { Router } from 'express';
import {
    createShopHandler,
    getShopHandler,
    regenerateQRCodeHandler,
    getMenuUrlHandler,
    getShopMenuHandler
} from '../controllers/shop.controller';
import {
    validateCreateShop,
    validateGetShop,
    validateRegenerateQRCode,
    validateGetMenuUrl,
    validateGetShopMenu
} from '../validators/shop.validator';
import { protect } from '../middlewares/auth';

const router = Router();

// Public routes (no authentication required)
router.get('/menu/:shopId', validateGetShopMenu, getShopMenuHandler);
router.post('/create', protect, validateCreateShop, createShopHandler);
router.get('/:shopId', protect, validateGetShop, getShopHandler);
router.post('/:shopId/qr-code/regenerate', protect, validateRegenerateQRCode, regenerateQRCodeHandler);
router.get('/:shopId/menu-url', protect, validateGetMenuUrl, getMenuUrlHandler);

export default router; 