import { MessageError } from "./types/general-types";

enum errorMessage {
  INVALID_PAYMENT_METHOD = "INVALID_PAYMENT_METHOD",
  INVALID_PAYMENT_AMOUNT = "INVALID_PAYMENT_AMOUNT",
  INVALID_PAYMENT_CURRENCY = "INVALID_PAYMENT_CURRENCY",
  PAYMENT_NOT_FOUND = "PAYMENT_NOT_FOUND",
  ROLE_NOT_FOUND = "ROLE_NOT_FOUND",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  INVALID_VERIFICATION_CODE = "INVALID_VERIFICATION_CODE",
  INVALID_VERIFICATION_REASON = "INVALID_VERIFICATION_REASON",
  VERIFICATION_CODE_EXPIRED = "VERIFICATION_CODE_EXPIRED",
  STARTER_PLAN_NOT_FOUND = "STARTER_PLAN_NOT_FOUND",
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
  NO_SUBSCRIPTION_FOUND = "NO_SUBSCRIPTION_FOUND",
  PREMIUM_PLAN_NOT_FOUND = "PREMIUM_PLAN_NOT_FOUND",
  PLAN_ID_REQUIRED = "PLAN_ID_REQUIRED",
  USER_NOT_AUTHENTICATED = "USER_NOT_AUTHENTICATED",
  PAYMOB_CONFIG_ERROR = "PAYMOB_CONFIG_ERROR",
  PLAN_NOT_FOUND = "PLAN_NOT_FOUND",
  SHOP_NOT_FOUND = "SHOP_NOT_FOUND",
  USER_ALREADY_SUBSCRIBED = "USER_ALREADY_SUBSCRIBED",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  USER_HAS_NO_SHOP = "USER_HAS_NO_SHOP",
  USER_HAS_NO_PASSWORD = "USER_HAS_NO_PASSWORD",
  BOTH_PASSWORDS_REQUIRED = "BOTH_PASSWORDS_REQUIRED",
  MONTHLY_PLAN_EXISTS = "MONTHLY_PLAN_EXISTS",
  YEARLY_PLAN_EXISTS = "YEARLY_PLAN_EXISTS",
  BOTH_PLANS_EXIST = "BOTH_PLANS_EXIST",
  NO_ACTIVE_SUBSCRIPTION = "NO_ACTIVE_SUBSCRIPTION",
  SUBSCRIPTION_EXPIRED = "SUBSCRIPTION_EXPIRED",
  CATEGORY_NOT_FOUND = "CATEGORY_NOT_FOUND",
  MENU_ITEM_NOT_FOUND = "MENU_ITEM_NOT_FOUND",
  ORDER_NOT_FOUND = "ORDER_NOT_FOUND",
  ORDER_NOT_PENDING = "ORDER_NOT_PENDING",
  SUBSCRIPTION_NOT_FOUND = "SUBSCRIPTION_NOT_FOUND",
  SUBSCRIPTION_ALREADY_CANCELLED = "SUBSCRIPTION_ALREADY_CANCELLED",
  SUBSCRIPTION_CANNOT_BE_CANCELLED = "SUBSCRIPTION_CANNOT_BE_CANCELLED",
  UNAUTHORIZED_SHOP_SUBSCRIPTION_CANCEL = "UNAUTHORIZED_SHOP_SUBSCRIPTION_CANCEL",
  UNAUTHORIZED_SHOP_SUBSCRIPTION_VIEW = "UNAUTHORIZED_SHOP_SUBSCRIPTION_VIEW",
  INVALID_OLD_PASSWORD = "INVALID_OLD_PASSWORD",
  SAME_PASSWORD_ERROR = "SAME_PASSWORD_ERROR",
  IMAGE_UPLOAD_FAILED = "IMAGE_UPLOAD_FAILED",
  ROUTE_NOT_FOUND = "ROUTE_NOT_FOUND",
}

export const errMsg: {
  [key in errorMessage]: MessageError;
} = {
  INVALID_PAYMENT_METHOD: {
    en: "Invalid payment method",
    ar: "طريقة الدفع غير صحيحة",
  },
  INVALID_PAYMENT_AMOUNT: {
    en: "Invalid payment amount",
    ar: "مبلغ الدفع غير صحيح",
  },
  INVALID_PAYMENT_CURRENCY: {
    en: "Invalid payment currency",
    ar: "عملة الدفع غير صحيحة",
  },
  PAYMENT_NOT_FOUND: {
    en: "Payment not found",
    ar: "لا يوجد معاملة بهذا الرقم",
  },
  ROLE_NOT_FOUND: { en: "Role not found", ar: "لا يوجد دور بهذا الرقم" },
  USER_NOT_FOUND: { en: "User not found", ar: "لا يوجد مستخدم بهذا الرقم" },
  INVALID_VERIFICATION_CODE: {
    en: "Invalid verification code.",
    ar: "رمز التحقق غير صالح.",
  },
  INVALID_VERIFICATION_REASON: {
    en: "Invalid verification reason.",
    ar: "سبب التحقق غير صالح.",
  },
  VERIFICATION_CODE_EXPIRED: {
    en: "Verification code has expired.",
    ar: "انتهت صلاحية رمز التحقق.",
  },
  STARTER_PLAN_NOT_FOUND: {
    en: "Starter plan not found",
    ar: "الخطة الأولية غير موجودة",
  },
  USER_ALREADY_VERIFIED: {
    en: "User is already verified.",
    ar: "المستخدم تم التحقق منه بالفعل.",
  },
  FAILED_TO_SEND_EMAIL: {
    en: "Failed to send email",
    ar: "فشل في إرسال البريد الإلكتروني.",
  },
  INVALID_EMAIL_OR_PASSWORD: {
    en: "Invalid email or password",
    ar: "بريد إلكتروني أو كلمة مرور غير صالحة.",
  },
  ACCOUNT_NOT_VERIFIED: {
    en: "Account is not verified. Please verify your account first.",
    ar: "الحساب غير مفعل. يرجى تفعيل حسابك أولاً.",
  },
  JWT_SECRET_NOT_DEFINED: {
    en: "JWT_SECRET is not defined in environment variables",
    ar: "JWT_SECRET غير معرف في متغيرات البيئة.",
  },
  NO_VERIFICATION_CODE_FOUND: {
    en: "No verification code found. Please request a new code.",
    ar: "لم يتم العثور على رمز التحقق. يرجى طلب رمز جديد.",
  },
  EMAIL_ALREADY_IN_USE: {
    en: "This email is already in use.",
    ar: "هذا البريد الإلكتروني مستخدم بالفعل.",
  },
  NO_EMAIL_CHANGE_REQUEST_FOUND: {
    en: "No email change request found.",
    ar: "لم يتم العثور على طلب تغيير البريد الإلكتروني.",
  },
  INVALID_CONFIRMATION_CODE: {
    en: "Invalid confirmation code.",
    ar: "رمز التأكيد غير صالح.",
  },
  INVALID_CONFIRMATION_REASON: {
    en: "Invalid confirmation reason.",
    ar: "سبب التأكيد غير صالح.",
  },
  CONFIRMATION_CODE_EXPIRED: {
    en: "Confirmation code has expired.",
    ar: "انتهت صلاحية رمز التأكيد.",
  },
  REFRESH_TOKEN_REQUIRED: {
    en: "Refresh token is required",
    ar: "رمز التحديث مطلوب.",
  },
  INVALID_OR_EXPIRED_REFRESH_TOKEN: {
    en: "Invalid or expired refresh token",
    ar: "رمز التحديث غير صالح أو منتهي الصلاحية.",
  },
  REFRESH_TOKEN_NOT_RECOGNIZED: {
    en: "Refresh token not recognized",
    ar: "رمز التحديث غير معروف.",
  },
  NO_SUBSCRIPTION_FOUND: {
    en: "No subscription found for user",
    ar: "لم يتم العثور على اشتراك للمستخدم.",
  },
  PREMIUM_PLAN_NOT_FOUND: {
    en: "Premium plan not found",
    ar: "الخطة المميزة غير موجودة.",
  },
  PLAN_ID_REQUIRED: { en: "Plan ID is required.", ar: "معرف الخطة مطلوب." },
  USER_NOT_AUTHENTICATED: {
    en: "User not authenticated.",
    ar: "المستخدم غير مصادق عليه.",
  },
  PAYMOB_CONFIG_ERROR: {
    en: "Paymob configuration error.",
    ar: "خطأ في تهيئة Paymob.",
  },
  PLAN_NOT_FOUND: { en: "Plan not found.", ar: "الخطة غير موجودة." },
  SHOP_NOT_FOUND: { en: "Shop not found", ar: "المتجر غير موجود" },
  USER_ALREADY_SUBSCRIBED: {
    en: "User is already subscribed.",
    ar: "المستخدم مشترك بالفعل.",
  },
  PAYMENT_FAILED: {
    en: "Payment failed",
    ar: "فشل الدفع",
  },
  USER_HAS_NO_SHOP: {
    en: "User does not have a shop",
    ar: "المستخدم ليس لديه متجر",
  },
  USER_HAS_NO_PASSWORD: {
    en: "User does not have a password",
    ar: "المستخدم ليس لديه كلمة مرور",
  },
  BOTH_PASSWORDS_REQUIRED: {
    en: "Both old and new passwords are required.",
    ar: "كلمة المرور القديمة وكلمة المرور الجديدة مطلوبة.",
  },
  MONTHLY_PLAN_EXISTS: {
    en: "Monthly plan for this group already exists",
    ar: "الخطة الشهرية لهذه المجموعة موجودة بالفعل",
  },
  YEARLY_PLAN_EXISTS: {
    en: "Yearly plan for this group already exists",
    ar: "الخطة السنوية لهذه المجموعة موجودة بالفعل",
  },
  BOTH_PLANS_EXIST: {
    en: "Both monthly and yearly plans for this group already exist",
    ar: "توجد بالفعل خطط شهرية وسنوية لهذه المجموعة",
  },

  NO_ACTIVE_SUBSCRIPTION: {
    en: "No active subscription found for user",
    ar: "لا يوجد اشتراك نشط",
  },
  SUBSCRIPTION_EXPIRED: {
    en: "Your subscription has expired. Please subscribe to continue.",
    ar: "انتهت صلاحية اشتراكك. يرجى الاشتراك للمتابعة.",
  },

  CATEGORY_NOT_FOUND: {
    en: "Category not found",
    ar: "الفئة غير موجودة",
  },
  MENU_ITEM_NOT_FOUND: {
    en: "Menu item not found",
    ar: "العنصر غير موجود",
  },

  ORDER_NOT_FOUND: {
    en: "Order not found",
    ar: "الطلب غير موجود",
  },
  ORDER_NOT_PENDING: {
    en: "Order is not pending and cannot be paid.",
    ar: "لا يمكن دفع الطلب لأنه ليس في حالة انتظار.",
  },
  SUBSCRIPTION_NOT_FOUND: {
    en: "Subscription not found",
    ar: "الاشتراك غير موجود",
  },
  SUBSCRIPTION_ALREADY_CANCELLED: {
    en: "Subscription is already cancelled",
    ar: "الاشتراك ملغي بالفعل",
  },
  SUBSCRIPTION_CANNOT_BE_CANCELLED: {
    en: "Subscription cannot be cancelled",
    ar: "الاشتراك غير قابل للإلغاء",
  },
  UNAUTHORIZED_SHOP_SUBSCRIPTION_CANCEL: {
    en: "You are not authorized to cancel this shop's subscription.",
    ar: "أنت غير مصرح لإلغاء الاشتراك لهذا المتجر.",
  },
  UNAUTHORIZED_SHOP_SUBSCRIPTION_VIEW: {
    en: "You are not authorized to view this shop's subscription.",
    ar: "أنت غير مصرح لعرض الاشتراك لهذا المتجر.",
  },
  INVALID_OLD_PASSWORD: {
    en: "Invalid old password.",
    ar: "كلمة المرور القديمة غير صالحة.",
  },
  SAME_PASSWORD_ERROR: {
    en: "New password cannot be the same as old password.",
    ar: "كلمة المرور الجديدة غير مسموح بها لأنها تطابق كلمة المرور القديمة.",
  },
  IMAGE_UPLOAD_FAILED: {
    en: "Failed to upload image",
    ar: "فشل تحميل الصورة",
  },
  ROUTE_NOT_FOUND: {
    en: "Route not found",
    ar: "الرابط غير موجود",
  },
};
