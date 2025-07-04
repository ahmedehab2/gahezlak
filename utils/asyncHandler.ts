import { Request, Response, NextFunction, RequestHandler } from 'express';

export const asyncHandler = (handle: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler => {
    return (req, res, next) => {
        handle(req, res, next).catch(next);
    }
}
