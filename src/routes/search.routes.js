import express from "express";
import { globalSearch } from "../controllers/search.controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Global search
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query for players, teams, or seasons
 *     responses:
 *       200:
 *         description: Search results
 */
router.get("/", globalSearch);

export default router;
