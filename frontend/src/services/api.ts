import axios from 'axios';

const API_URL = (typeof window === 'undefined' && process.env.API_URL) 
    ? process.env.API_URL 
    : (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080');

export interface Post {
    id: string;
    title: string;
    subtitle?: string;
    content: string;
    author_id: string;
    author?: {
        id?: string;
        name: string;
        avatar_url: string;
    };
    created_at: string;
    published_at?: string;
    reading_time?: number;
    image_url?: string;
    cover_image?: string;
    tags?: string[];
    // Social
    claps_count?: number;
    is_bookmarked?: boolean;
}

export interface ProfileUpdate {
    name?: string;
    bio?: string;
    avatar_url?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: {
        code: string;
        message: string;
    };
}

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Helper to set auth token
export const setAuthToken = (token: string | null) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common['Authorization'];
    }
};

export const getPosts = async (): Promise<Post[]> => {
    const response = await api.get<ApiResponse<Post[]>>('/api/v1/posts');
    if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to fetch posts');
    }
    return response.data.data;
};

export const getPostsByTag = async (
    tag?: string, 
    searchQuery?: string, 
    page: number = 1, 
    limit: number = 10
): Promise<{ posts: Post[], hasMore: boolean }> => {
    const params = new URLSearchParams();
    if (tag) params.set('tag', tag);
    if (searchQuery) params.set('q', searchQuery);
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    
    const url = `/api/v1/posts?${params.toString()}`;
    const response = await api.get<ApiResponse<Post[]>>(url);
    if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to fetch posts');
    }
    const posts = response.data.data;
    return { 
        posts, 
        hasMore: posts.length >= limit 
    };
};

export const createPost = async (title: string, content: string, tags?: string[], coverImage?: string): Promise<Post> => {
    const response = await api.post<ApiResponse<Post>>('/api/v1/posts', { 
        title, 
        content,
        tags,
        cover_image: coverImage
    });
    if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to create post');
    }
    return response.data.data;
};

export const getPost = async (postId: string): Promise<Post> => {
    const response = await api.get<ApiResponse<Post>>(`/api/v1/posts/${postId}`);
    if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Post not found');
    }
    return response.data.data;
};

export const updatePost = async (postId: string, title: string, content: string, tags?: string[], coverImage?: string): Promise<Post> => {
    const response = await api.put<ApiResponse<Post>>(`/api/v1/posts/${postId}`, { 
        title, 
        content,
        tags,
        cover_image: coverImage
    });
    if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to update post');
    }
    return response.data.data;
};

export const deletePost = async (postId: string): Promise<void> => {
    const response = await api.delete<ApiResponse<any>>(`/api/v1/posts/${postId}`);
    if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to delete post');
    }
};

export const toggleClap = async (postId: string): Promise<{ clapped: boolean; claps_count: number }> => {
    const response = await api.post<ApiResponse<{ clapped: boolean; claps_count: number }>>(`/api/v1/posts/${postId}/clap`);
    if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to toggle clap');
    }
    return response.data.data;
};

export const toggleBookmark = async (postId: string): Promise<{ bookmarked: boolean }> => {
    const response = await api.post<ApiResponse<{ bookmarked: boolean }>>(`/api/v1/posts/${postId}/bookmark`);
    if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to toggle bookmark');
    }
    return response.data.data;
};

export const toggleFollow = async (userId: string): Promise<{ following: boolean }> => {
    const response = await api.post<ApiResponse<{ following: boolean }>>(`/api/v1/users/${userId}/follow`);
    if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to follow user');
    }
    return response.data.data;
};

export interface User {
    id: string;
    name: string;
    email: string;
    bio: string;
    avatar_url: string;
    followers: number;
    following: number;
    is_following?: boolean;
}

export const getUser = async (id: string): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(`/api/v1/users/${id}`);
    if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to fetch user');
    }
    return response.data.data;
};

export interface Notification {
    id: string;
    user_id: string;
    type: 'clap' | 'follow' | 'bookmark' | 'comment';
    actor_id: string;
    actor_name: string;
    actor_avatar_url: string;
    post_id?: string;
    post_title?: string;
    created_at: string;
    read: boolean;
}

export const getNotifications = async (): Promise<{ notifications: Notification[]; total: number; unread_count: number }> => {
    const response = await api.get<ApiResponse<{ notifications: Notification[]; total: number; unread_count: number }>>('/api/v1/notifications');
    if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to fetch notifications');
    }
    return response.data.data;
};

export const markNotificationRead = async (id: string): Promise<boolean> => {
    const response = await api.post<ApiResponse<any>>(`/api/v1/notifications/${id}/read`);
    return response.data.success;
};
// ... existing methods ...

export interface Comment {
    id: string;
    post_id: string;
    user_id: string;
    content: string;
    created_at: string;
    author: {
        id: string;
        name: string;
        avatar_url: string;
    }
}

export const getComments = async (postId: string): Promise<{ comments: Comment[], total: number }> => {
    const response = await api.get<ApiResponse<{ comments: Comment[], total: number }>>(`/api/v1/posts/${postId}/comments`);
    if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to fetch comments');
    }
    return response.data.data;
};

export const createComment = async (postId: string, content: string): Promise<Comment> => {
    const response = await api.post<ApiResponse<Comment>>(`/api/v1/posts/${postId}/comments`, { content });
    if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to create comment');
    }
    return response.data.data;
};

export const deleteComment = async (postId: string, commentId: string): Promise<void> => {
    const response = await api.delete<ApiResponse<any>>(`/api/v1/posts/${postId}/comments/${commentId}`);
    if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to delete comment');
    }
};

export const updateProfile = async (profile: ProfileUpdate): Promise<{
    id: string;
    email: string;
    name: string;
    bio: string;
    avatar_url: string;
}> => {
    const response = await api.put<ApiResponse<any>>('/api/v1/users/me', profile);
    if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to update profile');
    }
    return response.data.data;
};
