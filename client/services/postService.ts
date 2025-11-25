import { SocialPost } from "../types";
import api from "./api";

export const getPosts = async (): Promise<SocialPost[]> => {
  const response = await api.get("/posts");
  // API now returns {posts: [], nextCursor, hasMore} format for pagination
  // Extract the posts array from the response
  if (response.data && Array.isArray(response.data.posts)) {
    return response.data.posts;
  }
  // Fallback for old format (if API returns array directly)
  if (Array.isArray(response.data)) {
    return response.data;
  }
  // Default to empty array if unexpected format
  console.error("Unexpected posts response format:", response.data);
  return [];
};

export const createPost = async (post: SocialPost): Promise<SocialPost> => {
  const response = await api.post("/posts", post);
  return response.data;
};

export const updatePost = async (
  id: string,
  post: Partial<SocialPost>
): Promise<SocialPost> => {
  const response = await api.put(`/posts/${id}`, post);
  return response.data;
};

export const deletePost = async (id: string): Promise<void> => {
  await api.delete(`/posts/${id}`);
};
