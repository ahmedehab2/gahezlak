import QRCode from 'qrcode';

export interface QRCodeOptions {
    width?: number;
    margin?: number;
    color?: {
        dark?: string;
        light?: string;
    };
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export interface QRCodeResult {
    qrCodeImage: string; // Base64 data URL
    menuUrl: string;     // The URL that was encoded
}

/**
 * Generate QR code for shop menu (returns base64 data URL)
 * @param shopId - The shop ID to generate QR code for
 * @param baseUrl - Base URL for the menu (default: process.env.FRONTEND_URL)
 * @param options - QR code generation options
 * @returns Promise<QRCodeResult>
 */
export async function generateMenuQRCode(
    shopId: string,
    baseUrl: string = process.env.FRONTEND_URL || 'http://localhost:3000',
    options: QRCodeOptions = {}
): Promise<QRCodeResult> {
    try {
        // Construct the menu URL
        const menuUrl = `${baseUrl}/menu/${shopId}`;
        
        // Default QR code options optimized for menu scanning
        const qrOptions = {
            width: options.width || 300,
            margin: options.margin || 2,
            color: {
                dark: options.color?.dark || '#000000',
                light: options.color?.light || '#FFFFFF'
            },
            errorCorrectionLevel: options.errorCorrectionLevel || 'M' as const
        };

        // Generate QR code as base64 data URL
        const qrCodeImage = await QRCode.toDataURL(menuUrl, qrOptions);

        return {
            qrCodeImage,
            menuUrl
        };
    } catch (error) {
        throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Generate QR code as buffer (for file downloads, email attachments, printing)
 * @param shopId - The shop ID to generate QR code for
 * @param baseUrl - Base URL for the menu (default: process.env.FRONTEND_URL)
 * @param options - QR code generation options
 * @returns Promise<Buffer>
 */
export async function generateMenuQRCodeBuffer(
    shopId: string,
    baseUrl: string = process.env.FRONTEND_URL || 'http://localhost:3000',
    options: QRCodeOptions = {}
): Promise<Buffer> {
    try {
        // Construct the menu URL
        const menuUrl = `${baseUrl}/menu/${shopId}`;
        
        // Default QR code options optimized for menu scanning
        const qrOptions = {
            width: options.width || 300,
            margin: options.margin || 2,
            color: {
                dark: options.color?.dark || '#000000',
                light: options.color?.light || '#FFFFFF'
            },
            errorCorrectionLevel: options.errorCorrectionLevel || 'M' as const
        };

        // Generate QR code as buffer
        return await QRCode.toBuffer(menuUrl, qrOptions);
    } catch (error) {
        throw new Error(`Failed to generate QR code buffer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
} 