import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const requestId = request.requestId || 'unknown';
    const errorMessage =
      exception instanceof Error ? exception.message : 'Internal server error';

    const logData: any = {
      requestId,
      method: request.method,
      path: request.url,
      status,
      message: errorMessage,
    };

    if (exception instanceof Error) {
      logData.stack = exception.stack;
      logData.errorName = exception.name;
    }

    if (status >= 500) {
      this.logger.error(logData, `Unhandled exception`);
    } else {
      this.logger.warn(logData, `Client error`);
    }

    const isInputError = status === 400 || status === 422;
    const responseBody: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
    };

    if (isInputError && exception instanceof HttpException) {
      const responsePayload = exception.getResponse();
      if (typeof responsePayload === 'object' && responsePayload !== null) {
        responseBody.message = responsePayload;
        if ((responsePayload as any).details) {
          responseBody.details = (responsePayload as any).details;
        }
      } else {
        responseBody.message = errorMessage;
      }
    } else if (status >= 500) {
      responseBody.message = 'Internal server error';
    } else {
      responseBody.message = errorMessage;
    }

    response.status(status).json(responseBody);
  }
}
