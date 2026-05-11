import express from "express";

import {
  getPlayerProfile,
  getPlayerMatches,
  getPlayerSeasonStats,
  searchPlayers,
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
  getSeasonBattingLeaderboard
);

router.get(
  "/leaderboard/bowling/:seasonId",
  getSeasonBowlingLeaderboard
);

router.get(
  "/leaderboard/fielding/:seasonId",
  getSeasonFieldingLeaderboard
);

router.get(
  "/leaderboard/mom/:seasonId",
  getMomLeaderboard
);

router.get(
  "/leaderboard/batting",
  getOverallBattingLeaderboard
);

router.get(
  "/leaderboard/bowling",
  getOverallBowlingLeaderboard
);

router.get(
  "/leaderboard/fielding",
  getOverallFieldingLeaderboard
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
