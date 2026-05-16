import express from "express";

import {
  getTeamProfile,
  getTeamMatches,
  getSeasonTeams,
  getPointsTable,
  getTeamStandings,
} from "../controllers/team.controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/teams/standings:
 *   get:
 *     summary: Get team standings
 *     tags: [Teams]
 *     parameters:
 *       - in: query
 *         name: seasonId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Team standings data
 */
router.get("/standings", getTeamStandings);

/**
 * @swagger
 * /api/teams/season/{seasonId}:
 *   get:
 *     summary: Get all teams in a season
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: seasonId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of teams in the season
 */
router.get(
  "/season/:seasonId",
  getSeasonTeams
);

/**
 * @swagger
 * /api/teams/points-table/{seasonId}:
 *   get:
 *     summary: Get points table for a season
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: seasonId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Points table data
 */
router.get(
  "/points-table/:seasonId",
  getPointsTable
);

/**
 * @swagger
 * /api/teams/{teamName}:
 *   get:
 *     summary: Get team profile by name
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: teamName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Team profile data
 */
router.get(
  "/:teamName",
  getTeamProfile
);

/**
 * @swagger
 * /api/teams/{teamName}/matches:
 *   get:
 *     summary: Get team match history
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: teamName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of team matches
 */
router.get(
  "/:teamName/matches",
  getTeamMatches
);

export default router;