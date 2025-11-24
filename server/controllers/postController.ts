import { Request, Response } from 'express';
import prisma from '../config/db.js';

export const getPosts = async (req: Request, res: Response) => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(posts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
};

export const createPost = async (req: Request, res: Response) => {
  try {
    const {
      platform, brandName, accountName, currency, creatorName, postedBy,
      remarks, content, date, createdAt, mediaType, screenshot,
      redirectLink, category, postType
    } = req.body;

    const post = await prisma.post.create({
      data: {
        platform,
        brandName,
        accountName,
        currency,
        creatorName,
        postedBy,
        remarks,
        content,
        date,
        createdAt,
        mediaType,
        screenshot,
        redirectLink,
        category,
        postType
      }
    });
    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
};

export const updatePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const post = await prisma.post.update({
      where: { id },
      data: req.body
    });
    res.json(post);
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
};

export const deletePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.post.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
};
