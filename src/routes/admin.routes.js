import express from "express";

import { rebuildAllAnalytics } from "../controllers/admin.controller.js";

const router = express.Router();

/* ======================================================
   REBUILD ANALYTICS
====================================================== */

/**
 * @swagger
 * /api/admin/rebuild-analytics:
 *   post:
 *     summary: Rebuild all analytics
 *     description: Recalculates all player and team statistics from raw match data. Use this after data migrations or backfills.
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Analytics rebuilt successfully
 */
router.post("/rebuild-analytics", rebuildAllAnalytics);

export default router;
