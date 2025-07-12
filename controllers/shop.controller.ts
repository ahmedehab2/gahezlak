import { Request, Response, NextFunction } from 'express';
import { SuccessResponse } from '../common/types/contoller-response.types';
import {
    createShop,
    getShop,
    regenerateShopQRCode,
    getShopMenuUrl,
    CreateShopData
} from '../services/shop.service';
import { QRCodeOptions } from '../utils/qrCodeGenerator';
import { MenuItemModel } from '../models/MenuItem';

/**
 * Create a new shop with automatic QR code generation
 */
export const createShopHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = (req as any).user?.userId;
        const shopData: CreateShopData = {
            ...req.body,
            ownerId: userId
        };
        
        const shop = await createShop(shopData);
        const response: SuccessResponse<typeof shop> = {
            message: 'Shop created successfully with QR code',
            data: shop
        };
        res.status(201).json(response);
    } catch (error) {
        next(error);
    }
};

/**
 * Get shop by ID
 */
export const getShopHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { shopId } = req.params;
        const shop = await getShop(shopId);
        
        const response: SuccessResponse<typeof shop> = {
            message: 'Shop retrieved successfully',
            data: shop
        };
        res.json(response);
    } catch (error) {
        next(error);
    }
};

/**
 * Regenerate QR code for shop
 */
export const regenerateQRCodeHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { shopId } = req.params;
        const options: QRCodeOptions = req.body;
        
        const result = await regenerateShopQRCode(shopId, options);
        const response: SuccessResponse<typeof result> = {
            message: 'QR code regenerated successfully',
            data: result
        };
        res.json(response);
    } catch (error) {
        next(error);
    }
};

/**
 * Get shop menu URL
 */
export const getMenuUrlHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { shopId } = req.params;
        const menuUrl = await getShopMenuUrl(shopId);
        
        const response: SuccessResponse<{ menuUrl: string }> = {
            message: 'Menu URL retrieved successfully',
            data: { menuUrl }
        };
        res.json(response);
    } catch (error) {
        next(error);
    }
};

/**
 * Public endpoint to get shop menu (for QR code scanning)
 * Returns real menu items from the database
 */
export const getShopMenuHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { shopId } = req.params;
        
        // Get shop details
        const shop = await getShop(shopId);
        
        // Get menu items for this shop
        const menuItems = await MenuItemModel.find({ 
            shopId: shopId,
            isAvailable: true 
        }).sort({ category: 1, name: 1 });
        
        // Group menu items by category
        const menuByCategory = menuItems.reduce((acc, item) => {
            if (!acc[item.category]) {
                acc[item.category] = [];
            }
            acc[item.category].push({
                _id: item._id,
                name: item.name,
                description: item.description,
                price: item.price,
                category: item.category,
                isAvailable: item.isAvailable
            });
            return acc;
        }, {} as Record<string, any[]>);
        
        const response = {
            message: 'Shop menu retrieved successfully',
            data: {
                shop: {
                    _id: shop._id,
                    name: shop.name,
                    type: shop.type,
                    address: shop.address,
                    phoneNumber: shop.phoneNumber,
                    email: shop.email
                },
                menuItems: menuItems.map(item => ({
                    _id: item._id,
                    name: item.name,
                    description: item.description,
                    price: item.price,
                    category: item.category,
                    isAvailable: item.isAvailable
                })),
                menuByCategory,
                totalItems: menuItems.length,
                categories: Object.keys(menuByCategory)
            }
        };
        res.json(response);
    } catch (error) {
        next(error);
    }
}; 