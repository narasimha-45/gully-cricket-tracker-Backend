import express from "express";
import {
  completeMatch,
  getMatchById,
  getMatchesBySeasonController,
} from "../controllers/match.controller.js";

const router = express.Router();

/**
 * Save completed match
 */
router.post("/complete", completeMatch);

/**
 * Get completed matches for a season
 */
router.get("/season/:seasonId", getMatchesBySeasonController);

router.get("/:matchId", getMatchById);

export default router;
