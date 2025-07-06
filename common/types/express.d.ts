import 'express';
import { LangType } from '../../errors/abstract-error-class';

declare global {
    namespace Express {
        interface Request {
            user?: any; //Todo: Define a proper user type
            lang: LangType;
        }
    }
}
