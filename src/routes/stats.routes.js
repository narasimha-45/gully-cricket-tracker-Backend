import express from "express";

import {
  getPlayerProfile,
  getPlayerMatches,
  getPlayerSeasonStats,
  searchPlayers,
  getTeamProfile,
  searchTeams,
  getSeasonBattingLeaderboard,
  getSeasonBowlingLeaderboard,
  getSeasonFieldingLeaderboard,
  getOverallBattingLeaderboard,
  getOverallBowlingLeaderboard,
  getOverallFieldingLeaderboard,
  getMomLeaderboard,
  getBatterVsBowler,
  getTeamHeadToHead,
  getPlayerHeadToHead,
} from "../controllers/stats.controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/stats/search/players:
 *   get:
 *     summary: Search for players
 *     tags: [Stats]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Player name search query
 *     responses:
 *       200:
 *         description: List of matching players
 */
router.get("/search/players", searchPlayers);

/**
 * @swagger
 * /api/stats/search/teams:
 *   get:
 *     summary: Search for teams
 *     tags: [Stats]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Team name search query
 *     responses:
 *       200:
 *         description: List of matching teams
 */
router.get("/search/teams", searchTeams);

/* ======================================================
   PLAYER PROFILE
====================================================== */

/**
 * @swagger
 * /api/stats/player/{name}:
 *   get:
 *     summary: Get player profile and overall stats
 *     tags: [Stats]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Player name
 *     responses:
 *       200:
 *         description: Player profile and career stats
 */
router.get("/player/:name", getPlayerProfile);

/* ======================================================
   TEAM PROFILE
====================================================== */

/**
 * @swagger
 * /api/stats/team/{idOrName}:
 *   get:
 *     summary: Get team profile and stats
 *     tags: [Stats]
 *     parameters:
 *       - in: path
 *         name: idOrName
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID or Name
 *       - in: query
 *         name: seasonId
 *         schema:
 *           type: string
 *         description: Optional Season ID to filter stats
 *     responses:
 *       200:
 *         description: Team profile and stats retrieved successfully
 */
router.get("/team/:idOrName", getTeamProfile);

/* ======================================================
   PLAYER MATCH HISTORY
====================================================== */

/**
 * @swagger
 * /api/stats/player/{name}/matches:
 *   get:
 *     summary: Get player match history
 *     tags: [Stats]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of player's recent match performances
 */
router.get("/player/:name/matches", getPlayerMatches);

/* ======================================================
   PLAYER SEASON STATS
====================================================== */

/**
 * @swagger
 * /api/stats/player/{name}/season/{seasonId}:
 *   get:
 *     summary: Get player stats for a specific season
 *     tags: [Stats]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: seasonId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Player's statistics for the season
 */
router.get("/player/:name/season/:seasonId", getPlayerSeasonStats);

/* ======================================================
   LEADERBOARDS
====================================================== */

/**
 * @swagger
 * /api/stats/leaderboard/batting/{seasonId}:
 *   get:
 *     summary: Get batting leaderboard for a season
 *     tags: [Leaderboards]
 *     parameters:
 *       - in: path
 *         name: seasonId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Batting leaderboard data
 */
router.get(
  "/leaderboard/batting/:seasonId",
  getSeasonBattingLeaderboard
);

/**
 * @swagger
 * /api/stats/leaderboard/bowling/{seasonId}:
 *   get:
 *     summary: Get bowling leaderboard for a season
 *     tags: [Leaderboards]
 *     parameters:
 *       - in: path
 *         name: seasonId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bowling leaderboard data
 */
router.get(
  "/leaderboard/bowling/:seasonId",
  getSeasonBowlingLeaderboard
);

/**
 * @swagger
 * /api/stats/leaderboard/fielding/{seasonId}:
 *   get:
 *     summary: Get fielding leaderboard for a season
 *     tags: [Leaderboards]
 *     parameters:
 *       - in: path
 *         name: seasonId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Fielding leaderboard data
 */
router.get(
  "/leaderboard/fielding/:seasonId",
  getSeasonFieldingLeaderboard
);

/**
 * @swagger
 * /api/stats/leaderboard/mom/{seasonId}:
 *   get:
 *     summary: Get MOM leaderboard for a season
 *     tags: [Leaderboards]
 *     parameters:
 *       - in: path
 *         name: seasonId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Man of the Match leaderboard data
 */
router.get(
  "/leaderboard/mom/:seasonId",
  getMomLeaderboard
);

/**
 * @swagger
 * /api/stats/leaderboard/batting:
 *   get:
 *     summary: Get overall batting leaderboard
 *     tags: [Leaderboards]
 *     responses:
 *       200:
 *         description: Overall batting leaderboard data
 */
router.get(
  "/leaderboard/batting",
  getOverallBattingLeaderboard
);

/**
 * @swagger
 * /api/stats/leaderboard/bowling:
 *   get:
 *     summary: Get overall bowling leaderboard
 *     tags: [Leaderboards]
 *     responses:
 *       200:
 *         description: Overall bowling leaderboard data
 */
router.get(
  "/leaderboard/bowling",
  getOverallBowlingLeaderboard
);

/**
 * @swagger
 * /api/stats/leaderboard/fielding:
 *   get:
 *     summary: Get overall fielding leaderboard
 *     tags: [Leaderboards]
 *     responses:
 *       200:
 *         description: Overall fielding leaderboard data
 */
router.get(
  "/leaderboard/fielding",
  getOverallFieldingLeaderboard
);




/* ======================================================
   RIVALRIES
====================================================== */

/**
 * @swagger
 * /api/stats/rivalry:
 *   get:
 *     summary: Get batter vs bowler rivalry stats
 *     tags: [Rivalries]
 *     parameters:
 *       - in: query
 *         name: batter
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: bowler
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rivalry statistics
 */
router.get(
  "/rivalry",
  getBatterVsBowler
);

/**
 * @swagger
 * /api/stats/head-to-head/team:
 *   get:
 *     summary: Get team head-to-head stats
 *     tags: [Rivalries]
 *     responses:
 *       200:
 *         description: Team head-to-head statistics
 */
router.get(
  "/head-to-head/team",
  getTeamHeadToHead
);

/**
 * @swagger
 * /api/stats/head-to-head/player:
 *   get:
 *     summary: Get player head-to-head stats
 *     tags: [Rivalries]
 *     responses:
 *       200:
 *         description: Player head-to-head statistics
 */
router.get(
  "/head-to-head/player",
  getPlayerHeadToHead
);


export default router;
