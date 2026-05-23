import mongoose from "mongoose";

import OverallPlayerSplits from "../../models/OverallPlayerSplits.js";
import SeasonPlayerSplits from "../../models/SeasonPlayerSplits.js";

import OverallPlayerStats from "../../models/OverallPlayerStats.js";
import SeasonPlayerStats from "../../models/SeasonPlayerStats.js";
import TeamProfile from "../../models/TeamProfile.js";
/* ======================================================
   CONSTANTS
====================================================== */

const MAX_LIMIT = 1000;

/* ======================================================
   HELPERS
====================================================== */

/* ======================================================
   TEAM RESOLVER
====================================================== */

const resolveTeamId = async (team) => {
  if (!team) {
    return null;
  }

  /* --------------------------------------
     Already ObjectId
  -------------------------------------- */

  if (mongoose.Types.ObjectId.isValid(team)) {
    return new mongoose.Types.ObjectId(team);
  }

  /* --------------------------------------
     Resolve by name
  -------------------------------------- */

  const profile = await TeamProfile.findOne({
    name: {
      $regex: new RegExp(`^${team}$`, "i"),
    },
  }).lean();

  return profile?._id || null;
};

const getLimit = (value) => {
  const parsed = Number(value) || 20;

  return Math.min(parsed, MAX_LIMIT);
};

const getModel = ({ seasonId, seasonModel, overallModel }) => {
  return seasonId ? seasonModel : overallModel;
};

const buildSeasonMatch = (seasonId) => {
  if (!seasonId) {
    return null;
  }

  return {
    seasonId: new mongoose.Types.ObjectId(seasonId),
  };
};

const buildDerivedStats = ({ runs = 0, balls = 0, outs = 0, wickets = 0 }) => {
  return {
    battingAverage:
      outs > 0 ? Number((runs / outs).toFixed(2)) : Number(runs.toFixed(2)),

    strikeRate: balls > 0 ? Number(((runs / balls) * 100).toFixed(2)) : 0,

    economy: balls > 0 ? Number(((runs / balls) * 6).toFixed(2)) : 0,

    bowlingAverage: wickets > 0 ? Number((runs / wickets).toFixed(2)) : 0,
  };
};

/* ======================================================
   FILTER BUILDERS
====================================================== */

const buildPositionFilter = (position) => {
  if (!position) {
    return null;
  }

  const normalized = String(position).trim().toLowerCase();

  if (normalized === "opening" || normalized === "openers") {
    return { $in: [1, 2] };
  }

  if (normalized === "middle" || normalized === "middle-order") {
    return { $in: [3, 4, 5] };
  }

  if (normalized === "finisher" || normalized === "finishers") {
    return { $gte: 6 };
  }

  const parsed = normalized
    .split(",")
    .map(Number)
    .filter((n) => !isNaN(n));

  if (parsed.length === 0) {
    return null;
  }

  return { $in: parsed };
};

const buildResultFilter = (result) => {
  if (!result) {
    return null;
  }

  const normalized = String(result).trim().toLowerCase();

  if (normalized === "won" || normalized === "wins") {
    return true;
  }

  if (normalized === "lost" || normalized === "losses") {
    return false;
  }

  return null;
};

const buildInningsFilter = (innings) => {
  if (!innings) {
    return null;
  }

  const normalized = String(innings).trim().toLowerCase();

  if (
    normalized === "first" ||
    normalized === "batting-first" ||
    normalized === "bowling-first"
  ) {
    return { $in: [1] };
  }

  if (
    normalized === "second" ||
    normalized === "chasing" ||
    normalized === "defending"
  ) {
    return { $in: [2] };
  }

  const parsed = normalized
    .split(",")
    .map(Number)
    .filter((n) => !isNaN(n));

  if (parsed.length === 0) {
    return null;
  }

  return { $in: parsed };
};

/* ======================================================
   LOOKUPS
====================================================== */

const playerLookupStages = [
  {
    $lookup: {
      from: "playerprofiles",
      localField: "_id",
      foreignField: "_id",
      as: "profile",
    },
  },

  {
    $unwind: "$profile",
  },
];

/* ======================================================
   COMMON PIPELINE BUILDER
====================================================== */

const buildCommonPipeline = async ({
  seasonId,
  unwindField,
  innings,
  result,
  position,
  team,
  opponent,
}) => {
  const pipeline = [];

  /* ======================================
     SEASON
  ====================================== */

  const seasonMatch = buildSeasonMatch(seasonId);

  if (seasonMatch) {
    pipeline.push({
      $match: seasonMatch,
    });
  }

  /* ======================================
     UNWIND
  ====================================== */

  pipeline.push({
    $unwind: `$${unwindField}`,
  });

  const filters = {};

  /* ======================================
     INNINGS
  ====================================== */

  const inningsFilter = buildInningsFilter(innings);

  if (inningsFilter) {
    filters[`${unwindField}.inningsNumber`] = inningsFilter;
  }

  /* ======================================
     RESULT
  ====================================== */

  const resultFilter = buildResultFilter(result);

  if (resultFilter !== null) {
    filters[`${unwindField}.won`] = resultFilter;
  }

  /* ======================================
     POSITION
  ====================================== */

  if (position && unwindField === "battingInnings") {
    const positionFilter = buildPositionFilter(position);

    if (positionFilter) {
      filters[`${unwindField}.battingPosition`] = positionFilter;
    }
  }

  /* ======================================
     TEAM
  ====================================== */

  if (team) {
    const teamId = await resolveTeamId(team);

    if (teamId) {
      filters[`${unwindField}.playedFor`] = teamId;
    }
  }

  /* ======================================
     OPPONENT
  ====================================== */

  if (opponent) {
    const opponentId = await resolveTeamId(opponent);

    if (opponentId) {
      filters[`${unwindField}.opponent`] = opponentId;
    }
  }

  /* ======================================
     APPLY FILTERS
  ====================================== */

  if (Object.keys(filters).length > 0) {
    pipeline.push({
      $match: filters,
    });
  }

  return pipeline;
};

/* ======================================================
   BATTING LEADERBOARD
====================================================== */

export const getFilteredBattingLeaderboard = async (query = {}) => {
  const { seasonId, innings, result, position, team, opponent, limit } = query;

  const Model = getModel({
    seasonId,
    seasonModel: SeasonPlayerSplits,
    overallModel: OverallPlayerSplits,
  });

  const pipeline = await buildCommonPipeline({
    seasonId,
    unwindField: "battingInnings",
    innings,
    result,
    position,
    team,
    opponent,
  });

  pipeline.push({
    $group: {
      _id: "$playerId",

      runs: {
        $sum: "$battingInnings.runs",
      },

      balls: {
        $sum: "$battingInnings.balls",
      },

      fours: {
        $sum: "$battingInnings.fours",
      },

      sixes: {
        $sum: "$battingInnings.sixes",
      },

      innings: {
        $sum: 1,
      },

      outs: {
        $sum: {
          $cond: [
            {
              $eq: ["$battingInnings.out", true],
            },
            1,
            0,
          ],
        },
      },

      highestScore: {
        $max: "$battingInnings.runs",
      },

      ducks: {
        $sum: {
          $cond: [
            {
              $and: [
                {
                  $eq: ["$battingInnings.runs", 0],
                },

                {
                  $eq: ["$battingInnings.out", true],
                },
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
    $addFields: {
      strikeRate: {
        $cond: [
          {
            $gt: ["$balls", 0],
          },

          {
            $multiply: [
              {
                $divide: ["$runs", "$balls"],
              },
              100,
            ],
          },

          0,
        ],
      },
    },
  });

  pipeline.push(...playerLookupStages);

  pipeline.push({
    $sort: {
      runs: -1,
      strikeRate: -1,
    },
  });

  pipeline.push({
    $limit: getLimit(limit),
  });

  const results = await Model.aggregate(pipeline);

  return results.map((player) => ({
    playerId: player._id,

    name: player.profile.displayName || player.profile.name,

    runs: player.runs,

    innings: player.innings,

    balls: player.balls,

    highestScore: player.highestScore,

    fours: player.fours,

    sixes: player.sixes,

    ducks: player.ducks,

    derived: buildDerivedStats({
      runs: player.runs,
      balls: player.balls,
      outs: player.outs,
    }),
  }));
};

/* ======================================================
   BOWLING LEADERBOARD
====================================================== */

/* ======================================================
   BOWLING LEADERBOARD
====================================================== */

export const getFilteredBowlingLeaderboard = async (query = {}) => {
  const { seasonId, innings, result, team, opponent,limit } = query;

  const Model = getModel({
    seasonId,
    seasonModel: SeasonPlayerSplits,
    overallModel: OverallPlayerSplits,
  });

  const pipeline = await buildCommonPipeline({
    seasonId,
    unwindField: "bowlingInnings",
    innings,
    result,
    team,
    opponent,
  });

  /* =========================================
       SORT FOR BEST BOWLING PICKUP
    ========================================= */

  pipeline.push({
    $sort: {
      "bowlingInnings.wickets": -1,
      "bowlingInnings.runs": 1,
    },
  });

  /* =========================================
       GROUP
    ========================================= */

  pipeline.push({
    $group: {
      _id: "$playerId",

      wickets: {
        $sum: "$bowlingInnings.wickets",
      },

      runs: {
        $sum: "$bowlingInnings.runs",
      },

      balls: {
        $sum: "$bowlingInnings.balls",
      },

      innings: {
        $sum: 1,
      },

      maidens: {
        $sum: {
          $cond: [
            {
              $eq: ["$bowlingInnings.runs", 0],
            },

            1,

            0,
          ],
        },
      },

      bestBowling: {
        $first: {
          wickets: "$bowlingInnings.wickets",

          runs: "$bowlingInnings.runs",
        },
      },

      fiveWickets: {
        $sum: {
          $cond: [
            {
              $gte: ["$bowlingInnings.wickets", 5],
            },

            1,

            0,
          ],
        },
      },

      threeWickets: {
        $sum: {
          $cond: [
            {
              $gte: ["$bowlingInnings.wickets", 3],
            },

            1,

            0,
          ],
        },
      },
    },
  });

  /* =========================================
       DERIVED
    ========================================= */

  pipeline.push({
    $addFields: {
      economy: {
        $cond: [
          {
            $gt: ["$balls", 0],
          },

          {
            $multiply: [
              {
                $divide: ["$runs", "$balls"],
              },

              6,
            ],
          },

          999,
        ],
      },

      bowlingAverage: {
        $cond: [
          {
            $gt: ["$wickets", 0],
          },

          {
            $divide: ["$runs", "$wickets"],
          },

          999,
        ],
      },

      strikeRate: {
        $cond: [
          {
            $gt: ["$wickets", 0],
          },

          {
            $divide: ["$balls", "$wickets"],
          },

          999,
        ],
      },
    },
  });

  /* =========================================
       PLAYER LOOKUP
    ========================================= */

  pipeline.push(...playerLookupStages);

  /* =========================================
       SORT
    ========================================= */

  pipeline.push({
    $sort: {
      wickets: -1,
      economy: 1,
    },
  });

  /* =========================================
       LIMIT
    ========================================= */

  pipeline.push({
    $limit: getLimit(limit),
  });

  /* =========================================
       EXECUTE
    ========================================= */

  const results = await Model.aggregate(pipeline);

  /* =========================================
       RESPONSE
    ========================================= */

  return results.map((player) => ({
    playerId: player._id,

    name: player.profile.displayName || player.profile.name,

    wickets: player.wickets || 0,

    innings: player.innings || 0,

    balls: player.balls || 0,

    runs: player.runs || 0,

    maidens: player.maidens || 0,

    fiveWickets: player.fiveWickets || 0,

    threeWickets: player.threeWickets || 0,

    bestBowling: player.bestBowling || {
      wickets: 0,
      runs: 0,
    },

    derived: {
      economy: Number(player.economy?.toFixed(2)) || 0,

      bowlingAverage: Number(player.bowlingAverage?.toFixed(2)) || 0,

      strikeRate: Number(player.strikeRate?.toFixed(2)) || 0,
    },
  }));
};

/* ======================================================
   FIELDING LEADERBOARD
====================================================== */

export const getFilteredFieldingLeaderboard = async (query = {}) => {
  const { seasonId, limit } = query;

  const Model = getModel({
    seasonId,
    seasonModel: SeasonPlayerStats,
    overallModel: OverallPlayerStats,
  });

  const filters = {};

  if (seasonId) {
    filters.seasonId = seasonId;
  }

  const players = await Model.find(filters)
    .populate("playerId", "displayName name")
    .sort({
      "fielding.catches": -1,
      "fielding.stumpings": -1,
      "fielding.runOuts": -1,
    })
    .limit(getLimit(limit))
    .lean();

  return players.map((player) => ({
    playerId: player.playerId?._id,

    name: player.playerId?.displayName || player.playerId?.name,

    catches: player.fielding?.catches || 0,

    stumpings: player.fielding?.stumpings || 0,

    runOuts: player.fielding?.runOuts || 0,

    manOfTheMatch: player.achievements?.mom || 0,
  }));
};
