import { ErrorRequestHandler } from "express";
import { MulterError } from "multer";

import { logger } from "../config/pino";
import { ErrorResponse } from "../common/types/contoller-response.types";
import { CustomError } from "../errors/abstract-error-class";

export const ErrorHandlerMiddleware: ErrorRequestHandler<
  unknown,
  ErrorResponse
> = (err, req, res, next): void => {
  logger.error(err);
  if (process.env.NODE_ENV === "development") console.log(err);

  // custom error
  if (err instanceof CustomError) {
    res.status(err.statusCode).json(err.serializeError() as ErrorResponse);
    return;
  }

  // mongo duplicate error
  if (err.name === "MongoServerError" && err.code === 11000) {
    res.status(400).json({
      code: 400,
      message:
        req.lang === "en"
          ? `${Object.keys(err.keyPattern)} is already exists`
          : `${Object.keys(err.keyPattern)} موحود بالفعل`.replace(
              "email",
              "الايميل"
            ),
      data: {},
    });
    return;
  }

  // mongoose validation error
  if (err.name === "ValidationError") {
    res.status(400).json({
      code: 400,
      message: err.message,
      data: {},
    });
    return;
  }

  // unhandled multer error
  if (err instanceof MulterError) {
    res.status(400).json({
      code: 400,
      message: `${err.field} is invalid`,
      data: err.message,
    });
    return;
  }

  // JWT invalid token
  if (err.name === "JsonWebTokenError") {
    res.status(401).json({
      code: 401,
      message: req.lang === "en" ? "invalid token" : "التوكن غير صالح",
      data: {},
    });
    return;
  }

  // JWT expired token
  if (err.name === "TokenExpiredError") {
    res.status(401).json({
      code: 401,
      message: req.lang === "en" ? "expired token" : "التوكن منتهي",
      data: {},
    });
    return;
  }

  // unhandled error
  res.status(500).json({
    code: 500,
    message: req.lang === "en" ? "Internal server error" : "خطأ بالسيرفر",
    data: {},
  });
};
