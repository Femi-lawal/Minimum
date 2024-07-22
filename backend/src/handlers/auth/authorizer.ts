import type { APIGatewayAuthorizerResult, APIGatewayTokenAuthorizerEvent } from 'aws-lambda';
import { logger } from '../../lib/powertools';

// Simple JWT mock authorizer
// In production, verify JWT signature and decode claims
export const handler = async (event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
  const token = event.authorizationToken;

  logger.info('Authorizer invoked', { token: token?.substring(0, 20) });

  // Mock validation - in production, verify JWT
  if (!token || !token.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }

  // Mock user data - in production, decode JWT
  const principalId = 'user-123';

  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: 'Allow',
          Resource: event.methodArn,
        },
      ],
    },
    context: {
      userId: principalId,
      email: 'user@example.com',
      name: 'Test User',
    },
  };
};
