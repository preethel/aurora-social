import { Request, Response } from "express";
import prisma from "../config/db.js";

export const getReportAnalytics = async (req: Request, res: Response) => {
  try {
    const { timeRange = "30days" } = req.query;

    // Calculate date filter
    let dateFilter: any = {};
    if (timeRange !== "all") {
      const now = new Date();
      const past = new Date();
      const daysToSubtract =
        timeRange === "7days" ? 7 : timeRange === "30days" ? 30 : 90;
      past.setDate(now.getDate() - daysToSubtract);

      // Convert to epoch timestamp for comparison
      const pastTimestamp = BigInt(past.getTime());
      dateFilter = {
        createdAt: {
          gte: pastTimestamp,
        },
      };
    }

    // Get total count with date filter
    const totalPosts = await prisma.post.count({
      where: dateFilter,
    });

    // Group by brand - get top brands
    const brandAggregation = await prisma.post.groupBy({
      by: ["brandName"],
      where: dateFilter,
      _count: {
        brandName: true,
      },
      orderBy: {
        _count: {
          brandName: "desc",
        },
      },
      take: 20, // Top 20 brands
    });

    // Group by platform
    const platformAggregation = await prisma.post.groupBy({
      by: ["platform"],
      where: dateFilter,
      _count: {
        platform: true,
      },
      orderBy: {
        _count: {
          platform: "desc",
        },
      },
    });

    // Group by creator - get top creators
    const creatorAggregation = await prisma.post.groupBy({
      by: ["creatorName"],
      where: dateFilter,
      _count: {
        creatorName: true,
      },
      orderBy: {
        _count: {
          creatorName: "desc",
        },
      },
      take: 20, // Top 20 creators
    });

    // Get timeline data - posts per day (last 90 days max)
    const daysToSubtract =
      timeRange === "7days" ? 7 : timeRange === "30days" ? 30 : 90;
    const timelineDays = timeRange === "all" ? 90 : daysToSubtract;
    const timelineStartDate = new Date();
    timelineStartDate.setDate(timelineStartDate.getDate() - timelineDays);
    const timelineStartTimestamp = BigInt(timelineStartDate.getTime());

    const timelinePosts = await prisma.post.findMany({
      where: {
        createdAt: {
          gte: timelineStartTimestamp,
        },
      },
      select: {
        date: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Process timeline data - group by date
    const timelineMap: Record<string, number> = {};
    timelinePosts.forEach((post) => {
      if (post.date) {
        timelineMap[post.date] = (timelineMap[post.date] || 0) + 1;
      }
    });

    const timelineData = Object.entries(timelineMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Format response
    const brandData = brandAggregation.map((item) => ({
      name: item.brandName || "Unknown",
      count: item._count.brandName,
    }));

    const platformData = platformAggregation.map((item) => ({
      name: item.platform,
      count: item._count.platform,
    }));

    const creatorData = creatorAggregation.map((item) => ({
      name: item.creatorName || "Unknown",
      count: item._count.creatorName,
    }));

    // Top performers
    const topBrand = brandData[0] || { name: "N/A", count: 0 };
    const topPlatform = platformData[0] || { name: "N/A", count: 0 };
    const topCreator = creatorData[0] || { name: "N/A", count: 0 };

    res.json({
      total: totalPosts,
      topBrand,
      topPlatform,
      topCreator,
      brandData,
      platformData,
      creatorData,
      timelineData,
    });
  } catch (error) {
    console.error("Report analytics error:", error);
    res.status(500).json({ error: "Failed to generate analytics" });
  }
};

export const exportReportCSV = async (req: Request, res: Response) => {
  try {
    const { timeRange = "30days" } = req.query;

    // Calculate date filter
    let dateFilter: any = {};
    if (timeRange !== "all") {
      const now = new Date();
      const past = new Date();
      const daysToSubtract =
        timeRange === "7days" ? 7 : timeRange === "30days" ? 30 : 90;
      past.setDate(now.getDate() - daysToSubtract);

      const pastTimestamp = BigInt(past.getTime());
      dateFilter = {
        createdAt: {
          gte: pastTimestamp,
        },
      };
    }

    // Get posts with selected fields only
    const posts = await prisma.post.findMany({
      where: dateFilter,
      select: {
        id: true,
        date: true,
        brandName: true,
        platform: true,
        creatorName: true,
        currency: true,
        redirectLink: true,
        mediaType: true,
        content: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10000, // Limit to 10k rows for safety
    });

    // Generate CSV
    const headers = [
      "ID",
      "Date",
      "Brand",
      "Platform",
      "Creator",
      "Currency",
      "URL/Content",
    ];
    const csvContent = [
      headers.join(","),
      ...posts.map((p) =>
        [
          p.id,
          p.date,
          `"${p.brandName || ""}"`,
          p.platform,
          `"${p.creatorName || ""}"`,
          p.currency || "",
          `"${
            p.mediaType === "screenshot"
              ? p.redirectLink || ""
              : "Embed Content"
          }"`,
        ].join(",")
      ),
    ].join("\n");

    // Set headers for file download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=social_ops_report_${timeRange}_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`
    );

    res.send(csvContent);
  } catch (error) {
    console.error("CSV export error:", error);
    res.status(500).json({ error: "Failed to export CSV" });
  }
};
