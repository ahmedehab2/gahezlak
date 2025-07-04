import { validationResult } from 'express-validator';
import { RequestHandler } from 'express';

export const validate: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      errors: errors.array().map((err) => err.msg),
    });
    return;
  }
  next();
};
