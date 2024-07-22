// Shared types
export interface Comment {
  commentId: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface Notification {
  notificationId: string;
  userId: string;
  type: 'comment' | 'clap' | 'follow' | 'mention';
  actorId: string;
  actorName: string;
  postId?: string;
  postTitle?: string;
  commentId?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  ttl: number;
}

export interface ImageProcessingEvent {
  bucket: string;
  key: string;
  size: number;
  etag: string;
}

export interface AuthContext {
  userId: string;
  email: string;
  name: string;
}
