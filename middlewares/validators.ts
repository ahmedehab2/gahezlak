import { validationResult } from 'express-validator';
import { RequestHandler } from 'express';

export const validate: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err: any) => ({
      message: err.msg,
      field: err.param !== undefined ? err.param : undefined,
    }));
    res.status(400).json(formattedErrors);
    return;
  }
  next();
};
