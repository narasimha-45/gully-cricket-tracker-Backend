import express from "express";

import {
  submitMatch,
  getMatchScorecard,
  getRecentMatches,
  getSeasonMatches,
} from "../controllers/match.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { matchSchema } from "../validations/match.validation.js";

const router = express.Router();

/**
 * @swagger
 * /api/matches/submit:
 *   post:
 *     summary: Submit a completed match
 *     tags: [Matches]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               matchInfo:
 *                 type: object
 *               innings:
 *                 type: array
 *     responses:
 *       201:
 *         description: Match submitted successfully
 */
router.post(
  "/submit",

  validate(matchSchema),

  submitMatch,
);

/**
 * @swagger
 * /api/matches/recent:
 *   get:
 *     summary: Get recent matches
 *     tags: [Matches]
 *     responses:
 *       200:
 *         description: List of recent matches
 */
router.get("/recent", getRecentMatches);

/**
 * @swagger
 * /api/matches/season/{seasonId}:
 *   get:
 *     summary: Get matches by season
 *     tags: [Matches]
 *     parameters:
 *       - in: path
 *         name: seasonId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of matches in the season
 */
router.get("/season/:seasonId", getSeasonMatches);

/**
 * @swagger
 * /api/matches/{matchId}:
 *   get:
 *     summary: Get full match scorecard
 *     tags: [Matches]
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Match scorecard details
 */
router.get("/:matchId", getMatchScorecard);

export default router;
