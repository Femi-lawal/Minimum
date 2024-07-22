import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createHandler, successResponse } from '../../lib/middleware';
import { CommentModel } from '../../models/Comment';
import { ValidationError, NotFoundError } from '../../lib/errors';
import { replyToCommentSchema } from '../../lib/validation';
import type { AuthContext } from '../../types';

export const handler = createHandler(async (event: APIGatewayProxyEvent & { requestContext: { authorizer: AuthContext } }): Promise<APIGatewayProxyResult> => {
  const validation = replyToCommentSchema.safeParse(event);
  if (!validation.success) {
    throw new ValidationError('Invalid request', validation.error.errors);
  }

  const { body, pathParameters } = validation.data;
  const { userId, name } = event.requestContext.authorizer;
  const parentCommentId = pathParameters.commentId;

  const postId = event.headers['x-post-id'] || event.queryStringParameters?.postId;
  if (!postId) {
    throw new ValidationError('postId required');
  }

  // Verify parent comment exists
  const parentComment = await CommentModel.getById(postId, parentCommentId);
  if (!parentComment) {
    throw new NotFoundError('Comment', parentCommentId);
  }

  const reply = await CommentModel.create(
    postId,
    userId,
    name,
    body.content,
    parentCommentId
  );

  return successResponse(reply, 201);
});
