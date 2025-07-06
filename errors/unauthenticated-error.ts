import { CustomError, } from './abstract-error-class';
import { ErrorResponse } from '../common/types/contoller-response.types';
import { LangType, MessageError } from '../common/types/general-types';



export class UnauthenticatedError extends CustomError {
  statusCode = 401;
  customMessage: MessageError;
  lang: LangType;
  constructor(message?: MessageError, lang?: LangType) {
    super(message || { en: 'unauthenticated', ar: 'الحساب غير موثق' }, lang);
    this.customMessage = message || { en: 'unauthenticated', ar: 'الحساب غير موثق' };
    this.lang = lang || 'ar';
  }

  serializeError(): ErrorResponse {
    const localizedMessage = this.customMessage[this.lang];
    return { code: this.statusCode, message: localizedMessage, data: {} };
  }
}
