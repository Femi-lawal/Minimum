import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createHandler, successResponse } from '../../lib/middleware';
import { CommentModel } from '../../models/Comment';
import { ValidationError, NotFoundError, ForbiddenError } from '../../lib/errors';
import { deleteCommentSchema } from '../../lib/validation';
import type { AuthContext } from '../../types';

export const handler = createHandler(async (event: APIGatewayProxyEvent & { requestContext: { authorizer: AuthContext } }): Promise<APIGatewayProxyResult> => {
  const validation = deleteCommentSchema.safeParse(event);
  if (!validation.success) {
    throw new ValidationError('Invalid request', validation.error.errors);
  }

  const { pathParameters } = validation.data;
  const { userId } = event.requestContext.authorizer;
  const commentId = pathParameters.commentId;

  const postId = event.headers['x-post-id'] || event.queryStringParameters?.postId;
  if (!postId) {
    throw new ValidationError('postId required');
  }

  const comment = await CommentModel.getById(postId, commentId);
  if (!comment) {
    throw new NotFoundError('Comment', commentId);
  }

  if (comment.authorId !== userId) {
    throw new ForbiddenError('You can only delete your own comments');
  }

  await CommentModel.delete(postId, commentId);
  return successResponse({ message: 'Comment deleted successfully' });
});
