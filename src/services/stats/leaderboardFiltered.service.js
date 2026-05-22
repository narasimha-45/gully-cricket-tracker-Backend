import mongoose from "mongoose";
import OverallPlayerSplits from "../../models/OverallPlayerSplits.js";
import SeasonPlayerSplits from "../../models/SeasonPlayerSplits.js";

/* ======================================================
   HELPERS
====================================================== */

const getDerivedStats = (stats) => {
  const battingAverage =
    stats.outs > 0 ? (stats.runs / stats.outs).toFixed(2) : 0;

  const strikeRate =
    stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(2) : 0;

  const economy =
    stats.balls > 0 ? ((stats.runs / stats.balls) * 6).toFixed(2) : 0;

  const bowlingAverage =
    stats.wickets > 0 ? (stats.runs / stats.wickets).toFixed(2) : 0;

  return {
    battingAverage,
    strikeRate,
    economy,
    bowlingAverage,
  };
};

/* ======================================================
   FILTERED BATTING LEADERBOARD
====================================================== */

export const getFilteredBattingLeaderboard = async (query = {}) => {
  const { seasonId, innings, result, position } = query;

  const Model = seasonId ? SeasonPlayerSplits : OverallPlayerSplits;
  const matchFilters = {};

  if (seasonId) {
    matchFilters.seasonId = new mongoose.Types.ObjectId(seasonId);
  }

  // Parse filters
  const parsedInnings = innings
    ? String(innings)
        .split(",")
        .map(Number)
        .filter((n) => !isNaN(n))
    : null;
  const parsedPosition = position
    ? String(position)
        .split(",")
        .map(Number)
        .filter((n) => !isNaN(n))
    : null;
  const parsedResult = result
    ? String(result)
        .split(",")
        .map((r) => r.trim().toLowerCase())
    : null;

  const unwindMatch = {};

  if (parsedInnings && parsedInnings.length > 0) {
    unwindMatch["battingInnings.inningsNumber"] = { $in: parsedInnings };
  }

  if (parsedPosition && parsedPosition.length > 0) {
    unwindMatch["battingInnings.battingPosition"] = { $in: parsedPosition };
  }

  if (parsedResult && parsedResult.length > 0) {
    const wantsWon =
      parsedResult.includes("won") || parsedResult.includes("wins");
    const wantsLost =
      parsedResult.includes("lost") || parsedResult.includes("losses");

    if (wantsWon && !wantsLost) {
      unwindMatch["battingInnings.won"] = true;
    } else if (wantsLost && !wantsWon) {
      unwindMatch["battingInnings.won"] = false;
    }
  }

  const pipeline = [];

  if (Object.keys(matchFilters).length > 0) {
    pipeline.push({ $match: matchFilters });
  }

  pipeline.push({ $unwind: "$battingInnings" });

  if (Object.keys(unwindMatch).length > 0) {
    pipeline.push({ $match: unwindMatch });
  }

  pipeline.push({
    $group: {
      _id: "$playerId",
      runs: { $sum: "$battingInnings.runs" },
      balls: { $sum: "$battingInnings.balls" },
      fours: { $sum: "$battingInnings.fours" },
      sixes: { $sum: "$battingInnings.sixes" },
      outs: {
        $sum: {
          $cond: [{ $eq: ["$battingInnings.out", true] }, 1, 0],
        },
      },
      innings: { $sum: 1 },
      highestScore: { $max: "$battingInnings.runs" },
      ducks: {
        $sum: {
          $cond: [
            {
              $and: [
                { $eq: ["$battingInnings.runs", 0] },
                { $eq: ["$battingInnings.out", true] },
              ],
            },
            1,
            0,
          ],
        },
      },
    },
  });

  pipeline.push({
    $lookup: {
      from: "playerprofiles",
      localField: "_id",
      foreignField: "_id",
      as: "profile",
    },
  });

  pipeline.push({ $unwind: "$profile" });

  pipeline.push({
    $sort: { runs: -1 },
  });

  const results = await Model.aggregate(pipeline);

  return results.map((player) => ({
    name: player.profile.name,
    runs: player.runs,
    innings: player.innings,
    highestScore: player.highestScore,
    fours: player.fours,
    sixes: player.sixes,
    ducks: player.ducks,
    derived: getDerivedStats({
      runs: player.runs,
      balls: player.balls,
      outs: player.outs,
    }),
  }));
};

/* ======================================================
   FILTERED BOWLING LEADERBOARD
====================================================== */

export const getFilteredBowlingLeaderboard = async (query = {}) => {
  const { seasonId, innings, result } = query;

  const Model = seasonId ? SeasonPlayerSplits : OverallPlayerSplits;
  const matchFilters = {};

  if (seasonId) {
    matchFilters.seasonId = new mongoose.Types.ObjectId(seasonId);
  }

  // Parse filters
  const parsedInnings = innings
    ? String(innings)
        .split(",")
        .map(Number)
        .filter((n) => !isNaN(n))
    : null;
  const parsedResult = result
    ? String(result)
        .split(",")
        .map((r) => r.trim().toLowerCase())
    : null;

  const unwindMatch = {};

  if (parsedInnings && parsedInnings.length > 0) {
    unwindMatch["bowlingInnings.inningsNumber"] = { $in: parsedInnings };
  }

  if (parsedResult && parsedResult.length > 0) {
    const wantsWon =
      parsedResult.includes("won") || parsedResult.includes("wins");
    const wantsLost =
      parsedResult.includes("lost") || parsedResult.includes("losses");

    if (wantsWon && !wantsLost) {
      unwindMatch["bowlingInnings.won"] = true;
    } else if (wantsLost && !wantsWon) {
      unwindMatch["bowlingInnings.won"] = false;
    }
  }

  const pipeline = [];

  if (Object.keys(matchFilters).length > 0) {
    pipeline.push({ $match: matchFilters });
  }

  pipeline.push({ $unwind: "$bowlingInnings" });

  if (Object.keys(unwindMatch).length > 0) {
    pipeline.push({ $match: unwindMatch });
  }

  pipeline.push({
    $group: {
      _id: "$playerId",
      wickets: { $sum: "$bowlingInnings.wickets" },
      runs: { $sum: "$bowlingInnings.runs" },
      balls: { $sum: "$bowlingInnings.balls" },
      innings: { $sum: 1 },
    },
  });

  pipeline.push({
    $lookup: {
      from: "playerprofiles",
      localField: "_id",
      foreignField: "_id",
      as: "profile",
    },
  });

  pipeline.push({ $unwind: "$profile" });

  pipeline.push({
    $sort: { wickets: -1 },
  });

  const results = await Model.aggregate(pipeline);

  return results.map((player) => ({
    name: player.profile.name,
    wickets: player.wickets,
    innings: player.innings,
    balls: player.balls,
    maidens: 0, // Maidens are not tracked per innings yet
    runs: player.runs,
    derived: getDerivedStats({
      runs: player.runs,
      balls: player.balls,
      wickets: player.wickets,
    }),
  }));
};

/* ======================================================
   FILTERED FIELDING LEADERBOARD
====================================================== */

import SeasonPlayerStats from "../../models/SeasonPlayerStats.js";

import OverallPlayerStats from "../../models/OverallPlayerStats.js";

export const getFilteredFieldingLeaderboard = async (query = {}) => {
  const { seasonId } = query;

  const Model = seasonId ? SeasonPlayerStats : OverallPlayerStats;

  const filters = {};

  if (seasonId) {
    filters.seasonId = seasonId;
  }

  const players = await Model.find(filters)
    .populate("playerId", "displayName name")
    .sort({
      "achievements.mom": -1,

      "fielding.catches": -1,

      "fielding.stumpings": -1,

      "fielding.runOuts": -1,

      
    })
    .lean();
  console.log("players", players);

  return players.map((player) => ({
    playerId: player.playerId?._id,

    name: player.playerId?.displayName || player.playerId?.name,

    catches: player.fielding?.catches || 0,

    stumpings: player.fielding?.stumpings || 0,

    runOuts: player.fielding?.runOuts || 0,

    manOfTheMatch: player.achievements?.mom || 0,
  }));
};
