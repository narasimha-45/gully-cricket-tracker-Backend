import express from "express";

import {
  getPlayerProfile,
  getPlayerMatches,
  getPlayerSeasonStats,
  searchPlayers,
  getBattingLeaderboard,
  getBowlingLeaderboard,
  getFieldingLeaderboard,
  getMomLeaderboard,
  getBatterVsBowler,
  getTeamHeadToHead,
  getPlayerHeadToHead,
} from "../controllers/stats.controller.js";

const router = express.Router();

/* ======================================================
   SEARCH PLAYERS
====================================================== */

router.get("/search/players", searchPlayers);

/* ======================================================
   PLAYER PROFILE
====================================================== */

router.get("/player/:name", getPlayerProfile);

/* ======================================================
   PLAYER MATCH HISTORY
====================================================== */

router.get("/player/:name/matches", getPlayerMatches);

/* ======================================================
   PLAYER SEASON STATS
====================================================== */

router.get("/player/:name/season/:seasonId", getPlayerSeasonStats);

/* ======================================================
   LEADERBOARDS
====================================================== */

router.get(
  "/leaderboard/batting/:seasonId",
  getBattingLeaderboard
);

router.get(
  "/leaderboard/bowling/:seasonId",
  getBowlingLeaderboard
);

router.get(
  "/leaderboard/fielding/:seasonId",
  getFieldingLeaderboard
);

router.get(
  "/leaderboard/mom/:seasonId",
  getMomLeaderboard
);


/* ======================================================
   RIVALRIES
====================================================== */

router.get(
  "/rivalry",
  getBatterVsBowler
);

router.get(
  "/head-to-head/team",
  getTeamHeadToHead
);

router.get(
  "/head-to-head/player",
  getPlayerHeadToHead
);


export default router;
