import { BadRequestError } from './bad-request-error';
import { CustomError } from './abstract-error-class';
import { DatabaseConnectionError } from './data-base-connections';
import { NotAllowedError } from './not-allowed-error';
import { NotFoundError } from './notfound-error';
import { UnauthenticatedError } from './unauthenticated-error';
import { UnauthorizedError } from './unauthorized-error';
import { UnprocessableError } from './unprocessable-error';
import { ValidationError } from './validation-error';

export const Errors = {
  BadRequestError,
  CustomError,
  DatabaseConnectionError,
  NotAllowedError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
  ValidationError,
  UnprocessableError,
};
