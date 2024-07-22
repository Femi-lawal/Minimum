import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import httpErrorHandler from '@middy/http-error-handler';
import httpCors from '@middy/http-cors';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import { logger, tracer, metrics } from './powertools';
import { AppError } from './errors';
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Handler } from 'aws-lambda';

export const createHandler = <T extends APIGatewayProxyEvent = APIGatewayProxyEvent>(
  handler: Handler<T, APIGatewayProxyResult>
) => {
  return middy(handler)
    .use(injectLambdaContext(logger, { logEvent: true }))
    .use(captureLambdaHandler(tracer))
    .use(logMetrics(metrics, { captureColdStartMetric: true }))
    .use(httpJsonBodyParser())
    .use(httpCors({
      origin: '*',
      headers: 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      credentials: true,
    }))
    .use(httpErrorHandler({
      fallbackMessage: 'Internal server error',
      logger: (error) => {
        logger.error('Error occurred', error as Error);
      },
    }))
    .onError((request) => {
      const error = request.error;
      
      if (error instanceof AppError) {
        request.response = {
          statusCode: error.statusCode,
          body: JSON.stringify({
            success: false,
            error: {
              code: error.code,
              message: error.message,
              details: error.details,
            },
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        };
      }
    });
};

export const successResponse = (data: unknown, statusCode: number = 200): APIGatewayProxyResult => ({
  statusCode,
  body: JSON.stringify({
    success: true,
    data,
  }),
  headers: {
    'Content-Type': 'application/json',
  },
});

export const errorResponse = (
  statusCode: number,
  code: string,
  message: string,
  details?: unknown
): APIGatewayProxyResult => ({
  statusCode,
  body: JSON.stringify({
    success: false,
    error: {
      code,
      message,
      details,
    },
  }),
  headers: {
    'Content-Type': 'application/json',
  },
});
