import { SocialPost } from '../types';
import api from './api';

export const getPosts = async (): Promise<SocialPost[]> => {
    const response = await api.get('/posts');
    return response.data;
};

export const createPost = async (post: SocialPost): Promise<SocialPost> => {
    const response = await api.post('/posts', post);
    return response.data;
};

export const updatePost = async (id: string, post: Partial<SocialPost>): Promise<SocialPost> => {
    const response = await api.put(`/posts/${id}`, post);
    return response.data;
};

export const deletePost = async (id: string): Promise<void> => {
    await api.delete(`/posts/${id}`);
};
