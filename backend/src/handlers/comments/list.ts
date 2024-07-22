import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createHandler, successResponse } from '../../lib/middleware';
import { CommentModel } from '../../models/Comment';
import { ValidationError } from '../../lib/errors';
import { listCommentsSchema } from '../../lib/validation';

export const handler = createHandler(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const validation = listCommentsSchema.safeParse(event);
  if (!validation.success) {
    throw new ValidationError('Invalid request', validation.error.errors);
  }

  const { pathParameters, queryStringParameters } = validation.data;
  const limit = queryStringParameters?.limit || 50;

  const comments = await CommentModel.getByPost(pathParameters.postId, limit);

  // Build threaded structure
  const commentMap = new Map(comments.map(c => [c.commentId, { ...c, replies: [] as any[] }]));
  const topLevel: any[] = [];

  for (const comment of comments) {
    const commentWithReplies = commentMap.get(comment.commentId)!;
    
    if (comment.parentId) {
      const parent = commentMap.get(comment.parentId);
      if (parent) {
        parent.replies.push(commentWithReplies);
      }
    } else {
      topLevel.push(commentWithReplies);
    }
  }

  return successResponse({
    comments: topLevel,
    total: comments.length,
  });
});
