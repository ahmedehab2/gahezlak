import 'express';

declare global {
    namespace Express {
        interface Request {
            user?: any; //Todo: Define a proper user type
        }
    }
}
