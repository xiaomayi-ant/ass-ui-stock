import { AppError } from './errors.js';

export class Logger {
  private static formatMessage(level: string, message: string, context?: any) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    };
  }

  static error(error: Error | AppError, context?: any) {
    const logMessage = error instanceof AppError
      ? error.toJSON()
      : {
          message: error.message,
          stack: error.stack,
          context
        };
    
    console.error(JSON.stringify(this.formatMessage('ERROR', error.message, logMessage)));
  }

  static info(message: string, context?: any) {
    console.log(JSON.stringify(this.formatMessage('INFO', message, context)));
  }

  static debug(message: string, context?: any) {
    if ((typeof process !== 'undefined') && process.env.NODE_ENV === 'development') {
      console.log(JSON.stringify(this.formatMessage('DEBUG', message, context)));
    }
  }
} 