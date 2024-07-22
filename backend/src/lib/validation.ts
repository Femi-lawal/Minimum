import { z } from 'zod';

export const createCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(2000),
  }),
  pathParameters: z.object({
    postId: z.string().uuid(),
  }),
});

export const listCommentsSchema = z.object({
  pathParameters: z.object({
    postId: z.string().uuid(),
  }),
  queryStringParameters: z.object({
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 50),
  }).optional(),
});

export const updateCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(2000),
  }),
  pathParameters: z.object({
    commentId: z.string(),
  }),
});

export const deleteCommentSchema = z.object({
  pathParameters: z.object({
    commentId: z.string(),
  }),
});

export const replyToCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(2000),
  }),
  pathParameters: z.object({
    commentId: z.string(),
  }),
});
