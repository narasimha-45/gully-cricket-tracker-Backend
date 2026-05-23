import mongoose from "mongoose";

import OverallTeamStats from "../../models/OverallTeamStats.js";
import SeasonTeamStats from "../../models/SeasonTeamStats.js";

/* ======================================================
   HELPERS
====================================================== */

const calculateNRR = ({
  runsScored = 0,
  ballsFaced = 0,
  runsConceded = 0,
  ballsBowled = 0,
}) => {
  if (ballsFaced <= 0 || ballsBowled <= 0) {
    return 0;
  }

  const scoredRate = runsScored / (ballsFaced / 6);

  const concededRate = runsConceded / (ballsBowled / 6);

  return Number((scoredRate - concededRate).toFixed(2));
};

const sortByPointsAndNrr = (a, b) => {
  if (b.stats.points !== a.stats.points) {
    return b.stats.points - a.stats.points;
  }

  return b.derived.netRunRate - a.derived.netRunRate;
};

const formatTeamRecord = (team) => {
  return {
    teamId: team.teamId || team._id,

    name: team.name,

    stats: {
      played: team.stats?.played || 0,

      wins: team.stats?.wins || 0,

      losses: team.stats?.losses || 0,

      ties: team.stats?.ties || 0,

      noResults: team.stats?.noResults || 0,

      points: team.stats?.points || 0,

      highestSuccessfulChase: team.stats?.highestSuccessfulChase || null,

      lowestTotalDefended: team.stats?.lowestTotalDefended || null,
    },

    derived: {
      netRunRate: calculateNRR({
        runsScored: team.stats?.runsScored || 0,

        ballsFaced: team.stats?.ballsFaced || 0,

        runsConceded: team.stats?.runsConceded || 0,

        ballsBowled: team.stats?.ballsBowled || 0,
      }),
    },
  };
};

/* ======================================================
   TEAM STANDINGS
====================================================== */

export const getTeamStandings = async (seasonId) => {
  /* ======================================
       SEASON STANDINGS
    ====================================== */

  if (seasonId && seasonId !== "all") {
    const teams = await SeasonTeamStats.find({
      seasonId: new mongoose.Types.ObjectId(seasonId),
    }).lean();

    return teams.map(formatTeamRecord).sort(sortByPointsAndNrr);
  }

  /* ======================================
       OVERALL STANDINGS
    ====================================== */

  const aggregateTeams = await OverallTeamStats.aggregate([
    {
      $group: {
        _id: "$teamId",

        teamId: {
          $first: "$teamId",
        },

        played: {
          $sum: "$stats.played",
        },

        wins: {
          $sum: "$stats.wins",
        },

        losses: {
          $sum: "$stats.losses",
        },

        ties: {
          $sum: "$stats.ties",
        },

        noResults: {
          $sum: "$stats.noResults",
        },

        points: {
          $sum: "$stats.points",
        },

        runsScored: {
          $sum: "$stats.runsScored",
        },

        ballsFaced: {
          $sum: "$stats.ballsFaced",
        },

        runsConceded: {
          $sum: "$stats.runsConceded",
        },

        ballsBowled: {
          $sum: "$stats.ballsBowled",
        },

        highestSuccessfulChase: {
          $max: "$stats.highestSuccessfulChase",
        },

        lowestTotalDefended: {
          $min: "$stats.lowestTotalDefended",
        },
      },
    },

    /* =====================================
       TEAM LOOKUP
    ====================================== */

    {
      $lookup: {
        from: "teamprofiles",

        localField: "teamId",

        foreignField: "_id",

        as: "team",
      },
    },

    {
      $unwind: {
        path: "$team",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $addFields: {
        name: "$team.name",
      },
    },
  ]);

  const formatted = aggregateTeams.map((team) =>
    formatTeamRecord({
      teamId: team.teamId,

      name: team.name,

      stats: {
        played: team.played,

        wins: team.wins,

        losses: team.losses,

        ties: team.ties,

        noResults: team.noResults,

        points: team.points,

        runsScored: team.runsScored,

        ballsFaced: team.ballsFaced,

        runsConceded: team.runsConceded,

        ballsBowled: team.ballsBowled,

        highestSuccessfulChase: team.highestSuccessfulChase,

        lowestTotalDefended: team.lowestTotalDefended,
      },
    }),
  );

  return formatted.sort(sortByPointsAndNrr);
};
