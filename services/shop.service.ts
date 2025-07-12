import { ObjectId } from 'mongodb';
import { Shops, IShop } from '../models/Shop';
import { Errors } from '../errors';
import { errMsg } from '../common/err-messages';
import { generateMenuQRCode, QRCodeOptions } from '../utils/qrCodeGenerator';

export interface CreateShopData {
    name: string;
    type: string;
    address: string;
    phoneNumber: string;
    email: string;
    ownerId: string;
}

/**
 * Create a new shop with automatic QR code generation
 */
export async function createShop(data: CreateShopData): Promise<IShop> {
    try {
        // Create shop first to get the ID
        const shop = await Shops.create({
            name: data.name,
            type: data.type,
            address: data.address,
            phoneNumber: data.phoneNumber,
            email: data.email,
            ownerId: new ObjectId(data.ownerId),
            isPaymentDone: false,
            members: []
        });

        // Generate QR code as base64
        const qrCodeResult = await generateMenuQRCode(shop._id.toString());
        
        // Update shop with QR code base64 data
        shop.qrCodeImage = qrCodeResult.qrCodeImage;
        await shop.save();

        return shop;
    } catch (error) {
        if (error instanceof Error) {
            // If it's a validation error or database error, throw with the original message
            throw new Errors.BadRequestError(errMsg.FAILED_TO_CREATE_SHOP);
        }
        throw new Errors.BadRequestError(errMsg.FAILED_TO_CREATE_SHOP);
    }
}

/**
 * Get shop by ID
 */
export async function getShop(shopId: string): Promise<IShop> {
    const shop = await Shops.findById(shopId);
    if (!shop) {
        throw new Errors.NotFoundError(errMsg.SHOP_NOT_FOUND);
    }

    return shop;
}

/**
 * Regenerate QR code for shop
 */
export async function regenerateShopQRCode(
    shopId: string, 
    options: QRCodeOptions = {}
): Promise<{ qrCodeImage: string; menuUrl: string }> {
    const shop = await Shops.findById(shopId);
    if (!shop) {
        throw new Errors.NotFoundError(errMsg.SHOP_NOT_FOUND);
    }

    const qrCodeResult = await generateMenuQRCode(shopId, undefined, options);
    
    // Update shop with new QR code base64 data
    shop.qrCodeImage = qrCodeResult.qrCodeImage;
    await shop.save();

    return qrCodeResult;
}

/**
 * Get shop menu URL
 */
export async function getShopMenuUrl(shopId: string): Promise<string> {
    const shop = await Shops.findById(shopId);
    if (!shop) {
        throw new Errors.NotFoundError(errMsg.SHOP_NOT_FOUND);
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${baseUrl}/menu/${shopId}`;
}

