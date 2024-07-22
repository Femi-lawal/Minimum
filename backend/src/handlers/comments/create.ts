import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createHandler, successResponse } from '../../lib/middleware';
import { CommentModel } from '../../models/Comment';
import { ValidationError } from '../../lib/errors';
import { createCommentSchema } from '../../lib/validation';
import type { AuthContext } from '../../types';

export const handler = createHandler(async (event: APIGatewayProxyEvent & { requestContext: { authorizer: AuthContext } }): Promise<APIGatewayProxyResult> => {
  // Validate input
  const validation = createCommentSchema.safeParse(event);
  if (!validation.success) {
    throw new ValidationError('Invalid request', validation.error.errors);
  }

  const { body, pathParameters } = validation.data;
  const { userId, name } = event.requestContext.authorizer;

  // Create comment
  const comment = await CommentModel.create(
    pathParameters.postId,
    userId,
    name,
    body.content
  );

  return successResponse(comment, 201);
});
