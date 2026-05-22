import Match from "../../models/match.model.js";
import { denormalizeMatch } from "./denormalizeMatch.js";

/* ======================================================
   GET MATCH SCORECARD
====================================================== */

export const getMatchScorecard = async (matchId) => {
  const match = await Match.findById(matchId).lean();

  if (!match) {
    throw new Error("Match not found");
  }

  const denormMatch = await denormalizeMatch(match);

  /* =========================================
       VIEW MODEL
    ========================================= */

  return {
    matchInfo: {
      id: denormMatch._id,

      seasonId: denormMatch.seasonId,

      venue: denormMatch.venue,

      date: denormMatch.createdAt,

      toss: denormMatch.toss,

      result: denormMatch.result,

      teams: denormMatch.teams,

      totalOvers: denormMatch.totalOvers,
    },

    innings: denormMatch.innings || [],

    manOfTheMatch: denormMatch.result?.manOfTheMatch || null,
  };
};

/* ======================================================
   RECENT MATCHES
====================================================== */

export const getRecentMatches = async () => {
  const matches = await Match.find({})
    .sort({
      createdAt: -1,
    })
    .limit(10)
    .lean();

  const denormMatches = await denormalizeMatch(matches);

  return denormMatches.map((match) => ({
    id: match._id,

    seasonId: match.seasonId,

    teams: match.teams,

    result: match.result,

    createdAt: match.createdAt,
  }));
};

/* ======================================================
   MATCHES BY SEASON
====================================================== */

export const getSeasonMatches = async (seasonId) => {
  const matches = await Match.find({
    seasonId,
  })
    .sort({
      createdAt: -1,
    })
    .lean();

  const denormMatches = await denormalizeMatch(matches);

  return denormMatches.map((match) => ({
    id: match._id,

    teams: match.teams,

    result: match.result,

    createdAt: match.createdAt,

    status: match.status,

    innings: match.innings || [],
  }));
};
