import { CustomError } from './abstract-error-class';
import { ErrorResponse } from '../common/types/contoller-response.types';
import { LangType, MessageError } from '../common/types/general-types';


export class DatabaseConnectionError extends CustomError {
  statusCode = 500;
  customMessage: MessageError;
  lang: LangType;
  constructor(message?: MessageError, lang?: LangType) {
    super(
      message || { en: 'Error connecting to database', ar: 'Error connecting to database' },
      lang,
    );
    this.customMessage = message || {
      en: 'Error connecting to database',
      ar: 'Error connecting to database',
    };
    this.lang = lang || 'ar';
  }

  serializeError(): ErrorResponse {
    const localizedMessage = this.customMessage[this.lang];
    return { code: this.statusCode, message: localizedMessage, data: {} };
  }
}
