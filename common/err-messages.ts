import { MessageError } from "./types/general-types";

enum errorMessage {
    // User authentication errors
    ROLE_NOT_FOUND = "ROLE_NOT_FOUND",
    USER_NOT_FOUND = "USER_NOT_FOUND",
    INVALID_VERIFICATION_CODE = "INVALID_VERIFICATION_CODE",
    INVALID_VERIFICATION_REASON = "INVALID_VERIFICATION_REASON",
    VERIFICATION_CODE_EXPIRED = "VERIFICATION_CODE_EXPIRED",
    USER_ALREADY_VERIFIED = "USER_ALREADY_VERIFIED",
    FAILED_TO_SEND_EMAIL = "FAILED_TO_SEND_EMAIL",
    INVALID_EMAIL_OR_PASSWORD = "INVALID_EMAIL_OR_PASSWORD",
    ACCOUNT_NOT_VERIFIED = "ACCOUNT_NOT_VERIFIED",
    JWT_SECRET_NOT_DEFINED = "JWT_SECRET_NOT_DEFINED",
    NO_VERIFICATION_CODE_FOUND = "NO_VERIFICATION_CODE_FOUND",
    EMAIL_ALREADY_IN_USE = "EMAIL_ALREADY_IN_USE",
    NO_EMAIL_CHANGE_REQUEST_FOUND = "NO_EMAIL_CHANGE_REQUEST_FOUND",
    INVALID_CONFIRMATION_CODE = "INVALID_CONFIRMATION_CODE",
    INVALID_CONFIRMATION_REASON = "INVALID_CONFIRMATION_REASON",
    CONFIRMATION_CODE_EXPIRED = "CONFIRMATION_CODE_EXPIRED",
    REFRESH_TOKEN_REQUIRED = "REFRESH_TOKEN_REQUIRED",
    INVALID_OR_EXPIRED_REFRESH_TOKEN = "INVALID_OR_EXPIRED_REFRESH_TOKEN",
    REFRESH_TOKEN_NOT_RECOGNIZED = "REFRESH_TOKEN_NOT_RECOGNIZED",
    USER_NOT_AUTHENTICATED = "USER_NOT_AUTHENTICATED",
    
    // Shop related errors
    SHOP_NOT_FOUND = "SHOP_NOT_FOUND",
    FAILED_TO_CREATE_SHOP = "FAILED_TO_CREATE_SHOP",
}

export const errMsg: {
    [key in errorMessage]: MessageError
} = {
    // User authentication errors
    ROLE_NOT_FOUND: { en: 'Role not found', ar: 'لا يوجد دور بهذا الرقم' },
    USER_NOT_FOUND: { en: 'User not found', ar: 'لا يوجد مستخدم بهذا الرقم' },
    INVALID_VERIFICATION_CODE: { en: 'Invalid verification code.', ar: 'رمز التحقق غير صالح.' },
    INVALID_VERIFICATION_REASON: { en: 'Invalid verification reason.', ar: 'سبب التحقق غير صالح.' },
    VERIFICATION_CODE_EXPIRED: { en: 'Verification code has expired.', ar: 'انتهت صلاحية رمز التحقق.' },
    USER_ALREADY_VERIFIED: { en: 'User is already verified.', ar: 'المستخدم تم التحقق منه بالفعل.' },
    FAILED_TO_SEND_EMAIL: { en: 'Failed to send email', ar: 'فشل في إرسال البريد الإلكتروني.' },
    INVALID_EMAIL_OR_PASSWORD: { en: 'Invalid email or password', ar: 'بريد إلكتروني أو كلمة مرور غير صالحة.' },
    ACCOUNT_NOT_VERIFIED: { en: 'Account is not verified. Please verify your account first.', ar: 'الحساب غير مفعل. يرجى تفعيل حسابك أولاً.' },
    JWT_SECRET_NOT_DEFINED: { en: 'JWT_SECRET is not defined in environment variables', ar: 'JWT_SECRET غير معرف في متغيرات البيئة.' },
    NO_VERIFICATION_CODE_FOUND: { en: 'No verification code found. Please request a new code.', ar: 'لم يتم العثور على رمز التحقق. يرجى طلب رمز جديد.' },
    EMAIL_ALREADY_IN_USE: { en: 'This email is already in use.', ar: 'هذا البريد الإلكتروني مستخدم بالفعل.' },
    NO_EMAIL_CHANGE_REQUEST_FOUND: { en: 'No email change request found.', ar: 'لم يتم العثور على طلب تغيير البريد الإلكتروني.' },
    INVALID_CONFIRMATION_CODE: { en: 'Invalid confirmation code.', ar: 'رمز التأكيد غير صالح.' },
    INVALID_CONFIRMATION_REASON: { en: 'Invalid confirmation reason.', ar: 'سبب التأكيد غير صالح.' },
    CONFIRMATION_CODE_EXPIRED: { en: 'Confirmation code has expired.', ar: 'انتهت صلاحية رمز التأكيد.' },
    REFRESH_TOKEN_REQUIRED: { en: 'Refresh token is required', ar: 'رمز التحديث مطلوب.' },
    INVALID_OR_EXPIRED_REFRESH_TOKEN: { en: 'Invalid or expired refresh token', ar: 'رمز التحديث غير صالح أو منتهي الصلاحية.' },
    REFRESH_TOKEN_NOT_RECOGNIZED: { en: 'Refresh token not recognized', ar: 'رمز التحديث غير معروف.' },
    USER_NOT_AUTHENTICATED: { en: 'User not authenticated.', ar: 'المستخدم غير مصادق عليه.' },
    
    // Shop related errors
    SHOP_NOT_FOUND: { en: 'Shop not found', ar: 'المتجر غير موجود' },
    FAILED_TO_CREATE_SHOP: { en: 'Failed to create shop', ar: 'فشل في إنشاء المتجر' },
};
