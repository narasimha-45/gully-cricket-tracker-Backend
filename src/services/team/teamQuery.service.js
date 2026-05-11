import Team from "../../models/team.model.js";

import Match from "../../models/match.model.js";

/* ======================================================
   TEAM PROFILE
====================================================== */

export const getTeamProfile = async (teamName) => {
  const team = await Team.findOne({
    name: teamName,
  }).lean();

  if (!team) {
    throw new Error("Team not found");
  }

  /* =========================================
       DERIVED
    ========================================= */

  const netRunRate =
    team.stats.ballsFaced > 0 && team.stats.ballsBowled > 0
      ? (
          team.stats.runsScored / (team.stats.ballsFaced / 6) -
          team.stats.runsConceded / (team.stats.ballsBowled / 6)
        ).toFixed(2)
      : 0;

  return {
    team,

    derived: {
      netRunRate,
    },
  };
};

/* ======================================================
   TEAM MATCH HISTORY
====================================================== */

export const getTeamMatches = async (teamName, query = {}) => {
  const page = Number(query.page) || 1;

  const limit = Number(query.limit) || 10;

  const skip = (page - 1) * limit;

  return await Match.find({
    $or: [
      {
        "teams.teamA.name": teamName,
      },
      {
        "teams.teamB.name": teamName,
      },
    ],
  })
    .sort({
      createdAt: -1,
    })
    .skip(skip)
    .limit(limit)
    .lean();
};

/* ======================================================
   SEASON TEAMS
====================================================== */

export const getSeasonTeams = async (seasonId) => {
  return await Team.find({
    seasonId,
  })
    .sort({
      "stats.points": -1,
    })
    .lean();
};

/* ======================================================
   POINTS TABLE
====================================================== */

export const getPointsTable = async (seasonId) => {
  const teams = await Team.find({
    seasonId,
  }).lean();

  return teams
    .map((team) => {
      const nrr =
        team.stats.ballsFaced > 0 && team.stats.ballsBowled > 0
          ? (
              team.stats.runsScored / (team.stats.ballsFaced / 6) -
              team.stats.runsConceded / (team.stats.ballsBowled / 6)
            ).toFixed(2)
          : 0;

      return {
        ...team,

        derived: {
          netRunRate: nrr,
        },
      };
    })
    .sort((a, b) => {
      /* POINTS */

      if (b.stats.points !== a.stats.points) {
        return b.stats.points - a.stats.points;
      }

      /* NRR */

      return b.derived.netRunRate - a.derived.netRunRate;
    });
};
