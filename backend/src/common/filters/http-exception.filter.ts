// backend/src/common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let title = 'Internal Server Error';
    let detail = 'Ocurrió un error inesperado en el servidor';
    let invalidParams: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        detail = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resObj = exceptionResponse as any;
        detail = Array.isArray(resObj.message) ? resObj.message.join(', ') : resObj.message || exception.message;
        if (Array.isArray(resObj.message)) {
          invalidParams = resObj.message;
        }
        title = resObj.error || exception.name;
      }
    } else if (exception instanceof Error) {
      detail = exception.message;
      this.logger.error(`Error no controlado: ${exception.message}`, exception.stack);
    }

    // Estructura RFC 7807 Problem Details
    const problemDetails = {
      type: `https://httpstatuses.com/${status}`,
      title,
      status,
      detail,
      instance: request.url,
      timestamp: new Date().toISOString(),
      ...(invalidParams ? { invalidParams } : {}),
    };

    response.status(status).json(problemDetails);
  }
}
