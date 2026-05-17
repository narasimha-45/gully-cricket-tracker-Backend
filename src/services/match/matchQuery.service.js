import Match from "../../models/match.model.js";


/* ======================================================
   GET MATCH SCORECARD
====================================================== */

export const getMatchScorecard = async (matchId) => {
  const match = await Match.findById(matchId).lean();

  if (!match) {
    throw new Error("Match not found");
  }

  /* =========================================
       VIEW MODEL
    ========================================= */

  return {
    matchInfo: {
      id: match._id,

      seasonId: match.seasonId,

      venue: match.venue,

      date: match.createdAt,

      toss: match.toss,

      result: match.result,

      teams: match.teams,

      totalOvers: match.totalOvers,
    },

    innings: match.innings || [],

    manOfTheMatch: match.result?.manOfTheMatch || null,
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

  return matches.map((match) => ({
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

  return matches.map((match) => ({
    id: match._id,

    teams: match.teams,

    result: match.result,

    createdAt: match.createdAt,

    status: match.status,

    innings: match.innings || [],
  }));
};
