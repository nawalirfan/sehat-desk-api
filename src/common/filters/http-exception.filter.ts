import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { fail } from '../envelope';

// Catches everything, not just HttpException, so an unexpected thrown Error
// still becomes a 500 envelope instead of hanging or leaking a stack trace.
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();

      // Our own pipes/guards throw a { code, message, details } body already;
      // Nest's built-ins (NotFoundException etc.) throw a plain string/message.
      if (typeof body === 'object' && body !== null && 'code' in body) {
        const { code, message, details } = body as {
          code: string;
          message: string;
          details?: unknown;
        };
        response.status(status).json(fail(code, message, details));
        return;
      }

      if (status === HttpStatus.TOO_MANY_REQUESTS) {
        response.status(status).json(fail('RATE_LIMITED', 'Too many requests, slow down and try again shortly.'));
        return;
      }

      const message = typeof body === 'string' ? body : (body as { message?: string }).message;
      response.status(status).json(fail(this.codeForStatus(status), message ?? exception.message));
      return;
    }

    this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : exception);
    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(fail('INTERNAL_ERROR', 'Something went wrong on our end.'));
  }

  private codeForStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_ERROR';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMITED';
      default:
        return 'ERROR';
    }
  }
}
