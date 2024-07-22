import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createHandler, successResponse } from '../../lib/middleware';
import { CommentModel } from '../../models/Comment';
import { ValidationError, NotFoundError, ForbiddenError } from '../../lib/errors';
import { updateCommentSchema } from '../../lib/validation';
import type { AuthContext } from '../../types';

export const handler = createHandler(async (event: APIGatewayProxyEvent & { requestContext: { authorizer: AuthContext } }): Promise<APIGatewayProxyResult> => {
  const validation = updateCommentSchema.safeParse(event);
  if (!validation.success) {
    throw new ValidationError('Invalid request', validation.error.errors);
  }

  const { body, pathParameters } = validation.data;
  const { userId } = event.requestContext.authorizer;

  // Note: In production, you'd extract postId from the comment or use a GSI
  // For now, this is a simplified version
  const commentId = pathParameters.commentId;
  
  // Fetch the comment first to check ownership (simplified - would need GSI in production)
  // For now, assuming we pass postId in headers or query
  const postId = event.headers['x-post-id'] || event.queryStringParameters?.postId;
  if (!postId) {
    throw new ValidationError('postId required');
  }

  const comment = await CommentModel.getById(postId, commentId);
  if (!comment) {
    throw new NotFoundError('Comment', commentId);
  }

  if (comment.authorId !== userId) {
    throw new ForbiddenError('You can only edit your own comments');
  }

  const updated = await CommentModel.update(postId, commentId, body.content);
  return successResponse(updated);
});
