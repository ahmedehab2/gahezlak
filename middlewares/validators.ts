import { validationResult } from 'express-validator';
import { RequestHandler } from 'express';
import { sendValidationErrors } from '../utils/responseHelper';

export const validate: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err: any) => ({
      message: err.msg,
      field: err.param !== undefined ? err.param : undefined,
    }));
    sendValidationErrors(res, formattedErrors);
    return;
  }
  next();
};
