import { Response } from 'express';
import {
  SuccessResponse,
  PaginatedRespone,
  ErrorResponse,
  ValidationErrorResponse
} from '../common/types/contoller-response.types';

export function sendSuccess<T>(res: Response, data: T, message = 'Data retreived.', status = 200) {
  const response: SuccessResponse<T> = { message, data };
  return res.status(status).json(response);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  totalPages: number,
  status = 200
) {
  const response: PaginatedRespone<T> = { data, total, page, totalPages };
  return res.status(status).json(response);
}

export function sendError(res: Response, code: number, message: string, data: any = null) {
  const response: ErrorResponse = { code, message, data };
  return res.status(code).json(response);
}

export function sendValidationErrors(res: Response, errors: ValidationErrorResponse, status = 400) {
  return res.status(status).json(errors);
} 