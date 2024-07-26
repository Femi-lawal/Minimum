import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';

export interface Post {
    id: string;
    title: string;
    content: string;
    author_id: string;
    created_at: string;
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

export const getPosts = async (): Promise<Post[]> => {
    const response = await api.get<ApiResponse<Post[]>>('/api/v1/posts');
    if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to fetch posts');
    }
    return response.data.data;
};

export const createPost = async (title: string, content: string): Promise<Post> => {
    const response = await api.post<ApiResponse<Post>>('/api/v1/posts', { title, content });
    if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to create post');
    }
    return response.data.data;
};
