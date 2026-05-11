import express from "express";

import {
   
  getTeamProfile,

  getTeamMatches,

  getSeasonTeams,

  getPointsTable,

} from "../controllers/team.controller.js";

const router = express.Router();


/* ======================================================
   SEASON TEAMS
   GET /api/teams/season/:seasonId
====================================================== */

router.get(
  "/season/:seasonId",
  getSeasonTeams
);

/* ======================================================
   POINTS TABLE
   GET /api/teams/points-table/:seasonId
====================================================== */

router.get(
  "/points-table/:seasonId",
  getPointsTable
);

/* ======================================================
   TEAM PROFILE
   GET /api/teams/:teamName
====================================================== */

router.get(
  "/:teamName",
  getTeamProfile
);

/* ======================================================
   TEAM MATCH HISTORY
   GET /api/teams/:teamName/matches
====================================================== */

router.get(
  "/:teamName/matches",
  getTeamMatches
);

export default router;