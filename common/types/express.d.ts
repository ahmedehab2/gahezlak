import 'express';
import { LangType } from '../../errors/abstract-error-class';
import { IUser } from '../../models/User';
import { CurrentUserPayload } from './general-types';

declare global {
    namespace Express {
        interface Request {
            user?: CurrentUserPayload
            lang: LangType;
        }
    }
}
