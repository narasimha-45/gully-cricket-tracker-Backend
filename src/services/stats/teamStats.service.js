import mongoose from "mongoose";

import TeamProfile from "../../models/TeamProfile.js";

import OverallTeamStats from "../../models/OverallTeamStats.js";

import SeasonTeamStats from "../../models/SeasonTeamStats.js";

/* ======================================================
   HELPERS
====================================================== */

const ballsToOvers = (balls = 0) => {
  const overs = Math.floor(balls / 6);

  const remaining = balls % 6;

  return `${overs}.${remaining}`;
};

const calculateNRR = (stats = {}) => {
  const {
    runsScored = 0,
    ballsFaced = 0,
    runsConceded = 0,
    ballsBowled = 0,
  } = stats;

  if (ballsFaced <= 0 || ballsBowled <= 0) {
    return 0;
  }

  const scoredRate = runsScored / (ballsFaced / 6);

  const concededRate = runsConceded / (ballsBowled / 6);

  return Number((scoredRate - concededRate).toFixed(3));
};

/* ======================================================
   DERIVED STATS
====================================================== */

const getDerivedStats = (stats = {}) => {
  return {
    battingAverage:
      stats.wicketsLost > 0
        ? Number((stats.runsScored / stats.wicketsLost).toFixed(2))
        : Number((stats.runsScored || 0).toFixed(2)),

    battingStrikeRate:
      stats.ballsFaced > 0
        ? Number(((stats.runsScored / stats.ballsFaced) * 100).toFixed(2))
        : 0,

    bowlingAverage:
      stats.wicketsTaken > 0
        ? Number((stats.runsConceded / stats.wicketsTaken).toFixed(2))
        : 0,

    economy:
      stats.ballsBowled > 0
        ? Number(((stats.runsConceded / stats.ballsBowled) * 6).toFixed(2))
        : 0,

    oversFaced: ballsToOvers(stats.ballsFaced || 0),

    oversBowled: ballsToOvers(stats.ballsBowled || 0),

    netRunRate: calculateNRR(stats),
  };
};

/* ======================================================
   RESOLVE TEAM
====================================================== */

const resolveTeam = async (teamIdOrName) => {
  /* --------------------------------------
     By ID
  -------------------------------------- */

  if (mongoose.Types.ObjectId.isValid(teamIdOrName)) {
    const team = await TeamProfile.findById(teamIdOrName).lean();

    if (!team) {
      throw new Error("Team not found");
    }

    return team;
  }

  /* --------------------------------------
     By Name
  -------------------------------------- */

  const team = await TeamProfile.findOne({
    name: {
      $regex: new RegExp(`^${teamIdOrName}$`, "i"),
    },
  }).lean();

  if (!team) {
    throw new Error("Team not found");
  }

  return team;
};

/* ======================================================
   TEAM PROFILE
====================================================== */

export const getTeamProfile = async (teamIdOrName, query = {}) => {
  const { seasonId } = query;

  const profile = await resolveTeam(teamIdOrName);

  /* ======================================
       SEASON STATS
    ====================================== */

  if (seasonId && seasonId !== "overall") {
    const stats = await SeasonTeamStats.findOne({
      seasonId: new mongoose.Types.ObjectId(seasonId),

      teamId: profile._id,
    }).lean();

    return {
      profile,

      stats: stats?.stats || null,

      derived: stats ? getDerivedStats(stats.stats) : null,
    };
  }

  /* ======================================
       OVERALL STATS
    ====================================== */

  const stats = await OverallTeamStats.findOne({
    teamId: profile._id,
  }).lean();

  return {
    profile,

    stats: stats?.stats || null,

    derived: stats ? getDerivedStats(stats.stats) : null,
  };
};

/* ======================================================
   SEARCH TEAMS
====================================================== */

export const searchTeams = async (query) => {
  if (!query?.trim()) {
    return [];
  }

  const teams = await TeamProfile.find({
    name: {
      $regex: query,
      $options: "i",
    },
  })
    .limit(10)
    .lean();

  return teams.map((team) => ({
    teamId: team._id,

    name: team.name,

    totalMatches: team.totalMatches || 0,

    seasonsPlayed: team.seasonsPlayed || [],
  }));
};
