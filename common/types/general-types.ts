import { JwtPayload } from "jsonwebtoken";

export type LangType = 'en' | 'ar';
export type MessageError = { en: string; ar: string };
export type CurrentUserPayload = JwtPayload & {
    userId: string;
    email: string
    role: string;
}
