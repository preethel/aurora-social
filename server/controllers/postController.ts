import { Request, Response } from "express";
import prisma from "../config/db.js";
import {
  deleteScreenshot,
  uploadScreenshot,
} from "../services/uploadService.js";

// Helper function to convert internal storage URLs to publicly accessible URLs
function convertToPublicUrl(
  url: string | null | undefined
): string | null | undefined {
  if (!url) return url;

  // Check if using Azurite (local development)
  const isAzurite =
    url.includes("azurite:10000") || url.includes("devstoreaccount1");

  if (isAzurite) {
    // For local development: replace container name with localhost
    return url.replace("http://azurite:10000", "http://localhost:10000");
  }

  // For production: Azure Blob Storage URLs are already public
  return url;
}

export const getPosts = async (req: Request, res: Response) => {
  try {
    const { limit = "50", cursor } = req.query;
    const take = parseInt(limit as string);

    // Build query options
    const queryOptions: any = {
      take: take + 1, // Fetch one extra to determine if there are more
      orderBy: { createdAt: "desc" },
    };

    // Add cursor for pagination
    if (cursor) {
      queryOptions.cursor = { id: cursor as string };
      queryOptions.skip = 1; // Skip the cursor itself
    }

    const posts = await prisma.post.findMany(queryOptions);

    // Check if there are more posts
    const hasMore = posts.length > take;
    const postsToReturn = hasMore ? posts.slice(0, take) : posts;
    const nextCursor = hasMore
      ? postsToReturn[postsToReturn.length - 1].id
      : null;

    // Convert internal storage URLs to publicly accessible URLs
    const postsWithPublicUrls = postsToReturn.map((post) => ({
      ...post,
      screenshot: convertToPublicUrl(post.screenshot),
    }));

    res.json({
      posts: postsWithPublicUrls,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("Get posts error:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

export const createPost = async (req: Request, res: Response) => {
  try {
    const {
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
      postType,
    } = req.body;

    let screenshotUrl = screenshot;

    // If screenshot is base64 data, upload it and get URL
    if (screenshot && screenshot.startsWith("data:image/")) {
      // Generate temporary ID for filename (will use actual post ID after creation)
      const tempId = `temp_${Date.now()}`;
      screenshotUrl = await uploadScreenshot(screenshot, tempId);
    }

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
        screenshot: screenshotUrl,
        redirectLink,
        category,
        postType,
      },
    });

    // Convert internal storage URL to publicly accessible URL
    const postWithPublicUrl = {
      ...post,
      screenshot: convertToPublicUrl(post.screenshot),
    };

    res.status(201).json(postWithPublicUrl);
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ error: "Failed to create post" });
  }
};

export const updatePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };

    // If screenshot is base64 data, upload it and get URL
    if (data.screenshot && data.screenshot.startsWith("data:image/")) {
      // Get old post to delete old screenshot if exists
      const oldPost = await prisma.post.findUnique({ where: { id } });
      if (oldPost?.screenshot) {
        await deleteScreenshot(oldPost.screenshot);
      }

      data.screenshot = await uploadScreenshot(data.screenshot, id);
    }

    const post = await prisma.post.update({
      where: { id },
      data,
    });

    // Convert internal storage URL to publicly accessible URL
    const postWithPublicUrl = {
      ...post,
      screenshot: convertToPublicUrl(post.screenshot),
    };

    res.json(postWithPublicUrl);
  } catch (error) {
    console.error("Update post error:", error);
    res.status(500).json({ error: "Failed to update post" });
  }
};

export const deletePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get post to delete screenshot if exists
    const post = await prisma.post.findUnique({ where: { id } });
    if (post?.screenshot) {
      await deleteScreenshot(post.screenshot);
    }

    await prisma.post.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({ error: "Failed to delete post" });
  }
};

export const updatePostInsights = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { impressions, engagement } = req.body;

    // Validate at least one field is provided
    if (impressions === undefined && engagement === undefined) {
      return res
        .status(400)
        .json({
          error:
            "At least one insight field (impressions or engagement) is required",
        });
    }

    // Build update data object
    const updateData: any = {};
    if (impressions !== undefined) {
      updateData.impressions = impressions;
    }
    if (engagement !== undefined) {
      updateData.engagement = engagement;
    }

    const post = await prisma.post.update({
      where: { id },
      data: updateData,
    });

    // Convert internal storage URL to publicly accessible URL
    const postWithPublicUrl = {
      ...post,
      screenshot: convertToPublicUrl(post.screenshot),
    };

    res.json(postWithPublicUrl);
  } catch (error) {
    console.error("Update insights error:", error);
    res.status(500).json({ error: "Failed to update post insights" });
  }
};
