import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { toClientMessage } from '../utils/safe-error.util';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const rawMessage =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : ((exceptionResponse as { message?: string | string[] }).message ??
          'Unexpected error');

    if (status >= 500) {
      this.logger.error(exception);
    } else if (typeof rawMessage === 'string' && rawMessage !== toClientMessage(rawMessage, status)) {
      this.logger.warn(`Client error (${status}): ${rawMessage}`);
    }

    response.status(status).json({
      success: false,
      data: null,
      message: toClientMessage(rawMessage, status),
    });
  }
}
