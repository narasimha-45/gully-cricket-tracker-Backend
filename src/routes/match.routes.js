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

/* ======================================================
   SUBMIT COMPLETED MATCH
   POST /api/matches/submit
====================================================== */

router.post(
  "/submit",

  validate(matchSchema),

  submitMatch,
);

/* ======================================================
   RECENT MATCHES
   GET /api/matches/recent
====================================================== */

router.get("/recent", getRecentMatches);

/* ======================================================
   MATCHES BY SEASON
   GET /api/matches/season/:seasonId
====================================================== */

router.get("/season/:seasonId", getSeasonMatches);

/* ======================================================
   FULL MATCH SCORECARD
   GET /api/matches/:matchId
====================================================== */

router.get("/:matchId", getMatchScorecard);

export default router;
