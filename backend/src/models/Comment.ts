import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand, DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { nanoid } from 'nanoid';
import { logger } from './powertools';
import type { Comment } from '../types';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

const COMMENTS_TABLE = process.env.COMMENTS_TABLE!;

export class CommentModel {
  static async create(
    postId: string,
    authorId: string,
    authorName: string,
    content: string,
    parentId: string | null = null
  ): Promise<Comment> {
    const commentId = nanoid();
    const now = new Date().toISOString();

    const comment: Comment = {
      commentId,
      postId,
      authorId,
      authorName,
      content,
      parentId,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };

    const command = new PutCommand({
      TableName: COMMENTS_TABLE,
      Item: {
        PK: `POST#${postId}`,
        SK: `COMMENT#${commentId}`,
        GSI1PK: parentId ? `COMMENT#${parentId}` : `POST#${postId}`,
        GSI1SK: `CREATED#${now}`,
        ...comment,
      },
    });

    await docClient.send(command);
    logger.info('Comment created', { commentId, postId });
    
    return comment;
  }

  static async getByPost(postId: string, limit: number = 50): Promise<Comment[]> {
    const command = new QueryCommand({
      TableName: COMMENTS_TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `POST#${postId}`,
        ':sk': 'COMMENT#',
      },
      Limit: limit,
      ScanIndexForward: false, // newest first
    });

    const result = await docClient.send(command);
    return (result.Items || []) as Comment[];
  }

  static async getReplies(commentId: string, limit: number = 50): Promise<Comment[]> {
    const command = new QueryCommand({
      TableName: COMMENTS_TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `COMMENT#${commentId}`,
      },
      Limit: limit,
      ScanIndexForward: true, // oldest first for replies
    });

    const result = await docClient.send(command);
    return (result.Items || []) as Comment[];
  }

  static async getById(postId: string, commentId: string): Promise<Comment | null> {
    const command = new GetCommand({
      TableName: COMMENTS_TABLE,
      Key: {
        PK: `POST#${postId}`,
        SK: `COMMENT#${commentId}`,
      },
    });

    const result = await docClient.send(command);
    return result.Item as Comment | null;
  }

  static async update(postId: string, commentId: string, content: string): Promise<Comment> {
    const now = new Date().toISOString();

    const command = new UpdateCommand({
      TableName: COMMENTS_TABLE,
      Key: {
        PK: `POST#${postId}`,
        SK: `COMMENT#${commentId}`,
      },
      UpdateExpression: 'SET content = :content, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':content': content,
        ':updatedAt': now,
      },
      ReturnValues: 'ALL_NEW',
    });

    const result = await docClient.send(command);
    logger.info('Comment updated', { commentId });
    
    return result.Attributes as Comment;
  }

  static async delete(postId: string, commentId: string): Promise<void> {
    const now = new Date().toISOString();

    // Soft delete
    const command = new UpdateCommand({
      TableName: COMMENTS_TABLE,
      Key: {
        PK: `POST#${postId}`,
        SK: `COMMENT#${commentId}`,
      },
      UpdateExpression: 'SET isDeleted = :isDeleted, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':isDeleted': true,
        ':updatedAt': now,
      },
    });

    await docClient.send(command);
    logger.info('Comment deleted', { commentId });
  }
}
