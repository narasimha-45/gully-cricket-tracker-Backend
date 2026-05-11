import PlayerProfile
  from "../../models/PlayerProfile.js";

import OverallPlayerStats
  from "../../models/OverallPlayerStats.js";

import PlayerSeasonStats
  from "../../models/PlayerSeasonStats.js";

import PlayerMatchPerformance
  from "../../models/PlayerMatchPerformance.js";

/* ======================================================
   HELPERS
====================================================== */

const normalize = (name) =>
  name.trim().toLowerCase();

/* ======================================================
   DERIVED STATS
====================================================== */

const getDerivedStats = (
  stats
) => {
  /* BATTING */

  const battingAverage =
    stats.batting.outs > 0
      ? (
          stats.batting.runs /
          stats.batting.outs
        ).toFixed(2)
      : 0;

  const strikeRate =
    stats.batting.balls > 0
      ? (
          (stats.batting.runs /
            stats.batting.balls) *
          100
        ).toFixed(2)
      : 0;

  /* BOWLING */

  const economy =
    stats.bowling.balls > 0
      ? (
          (stats.bowling.runs /
            stats.bowling.balls) *
          6
        ).toFixed(2)
      : 0;

  const bowlingAverage =
    stats.bowling.wickets > 0
      ? (
          stats.bowling.runs /
          stats.bowling.wickets
        ).toFixed(2)
      : 0;

  return {
    battingAverage,
    strikeRate,
    economy,
    bowlingAverage,
  };
};

/* ======================================================
   PLAYER PROFILE
====================================================== */

export const getPlayerProfile =
  async (name) => {
    const normalized =
      normalize(name);

    const profile =
      await PlayerProfile.findOne({
        name: normalized,
      }).lean();

    const stats =
      await OverallPlayerStats.findOne({
        name: normalized,
      }).lean();

    if (!profile || !stats) {
      throw new Error(
        "Player not found"
      );
    }

    return {
      profile,

      stats,

      derived:
        getDerivedStats(stats),
    };
  };

/* ======================================================
   PLAYER MATCH HISTORY
====================================================== */

export const getPlayerMatches =
  async (
    name,
    query = {}
  ) => {
    const page =
      Number(query.page) || 1;

    const limit =
      Number(query.limit) || 10;

    const skip =
      (page - 1) * limit;

    const matches =
      await PlayerMatchPerformance.find({
        name: normalize(name),
      })
        .sort({
          matchDate: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean();

    return matches;
  };

/* ======================================================
   PLAYER SEASON STATS
====================================================== */

export const getPlayerSeasonStats =
  async (
    name,
    seasonId
  ) => {
    const stats =
      await PlayerSeasonStats.findOne({
        seasonId,

        name: normalize(name),
      }).lean();

    if (!stats) {
      throw new Error(
        "Player season stats not found"
      );
    }

    return {
      stats,

      derived:
        getDerivedStats(stats),
    };
  };

/* ======================================================
   SEARCH PLAYERS
====================================================== */

export const searchPlayers =
  async (query) => {
    if (!query) {
      return [];
    }

    return await PlayerProfile.find({
      name: {
        $regex: query,
        $options: "i",
      },
    })
      .limit(10)
      .lean();
  };
