import express from "express";
import {
  exportReportCSV,
  getReportAnalytics,
} from "../controllers/reportController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/reports/analytics:
 *   get:
 *     summary: Get aggregated analytics data
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [7days, 30days, 90days, all]
 *         description: Time range for analytics
 *     responses:
 *       200:
 *         description: Analytics data
 */
router.get("/analytics", authenticateToken, getReportAnalytics);

/**
 * @swagger
 * /api/reports/export:
 *   get:
 *     summary: Export report data as CSV
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [7days, 30days, 90days, all]
 *         description: Time range for export
 *     responses:
 *       200:
 *         description: CSV file download
 */
router.get("/export", authenticateToken, exportReportCSV);

export default router;
