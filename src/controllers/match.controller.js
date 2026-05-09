import { getMatchesBySeason } from "../services/match.service.js";

import { processCompletedMatch } from "../services/processCompletedMatch.service.js";

export const completeMatch = async (req, res) => {
  try {
    const match = await processCompletedMatch(req.body);

    res.status(201).json({
      success: true,
      data: match,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to process completed match",
    });
  }
};

/**
 * Get completed matches by season
 * GET /api/matches/season/:seasonId
 */
export const getMatchesBySeasonController = async (req, res) => {
  try {
    const { seasonId } = req.params;

    const matches = await getMatchesBySeason(seasonId);

    res.json({
      success: true,
      data: matches,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch matches",
    });
  }
};

import Match from "../models/match.model.js";

export const getMatchById = async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId);
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch match" });
  }
};
