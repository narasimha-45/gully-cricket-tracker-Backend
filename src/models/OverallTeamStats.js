import mongoose from "mongoose";

const OverallTeamStatsSchema = new mongoose.Schema(
  {
    name: {
      type: String,

      required: true,

      unique: true,

      trim: true,

      lowercase: true,
    },

    seasonsPlayed: [
      {
        type: mongoose.Schema.Types.ObjectId,

        ref: "Season",
      },
    ],

    stats: {
      /* MATCHES */

      played: {
        type: Number,
        default: 0,
      },

      wins: {
        type: Number,
        default: 0,
      },

      losses: {
        type: Number,
        default: 0,
      },

      ties: {
        type: Number,
        default: 0,
      },

      noResults: {
        type: Number,
        default: 0,
      },

      /* BATTING */

      runsScored: {
        type: Number,
        default: 0,
      },

      wicketsLost: {
        type: Number,
        default: 0,
      },

      ballsFaced: {
        type: Number,
        default: 0,
      },

      foursScored: {
        type: Number,
        default: 0,
      },

      sixesScored: {
        type: Number,
        default: 0,
      },

      dotBallsPlayed: {
        type: Number,
        default: 0,
      },

      /* BOWLING */

      runsConceded: {
        type: Number,
        default: 0,
      },

      wicketsTaken: {
        type: Number,
        default: 0,
      },

      ballsBowled: {
        type: Number,
        default: 0,
      },

      foursConceded: {
        type: Number,
        default: 0,
      },

      sixesConceded: {
        type: Number,
        default: 0,
      },

      dotBallsBowled: {
        type: Number,
        default: 0,
      },

      /* BIGGEST WIN */

      biggestWin: {
        margin: {
          type: Number,
          default: 0,
        },

        type: {
          type: String,

          enum: ["RUNS", "WICKETS"],

          default: null,
        },

        matchId: {
          type: mongoose.Schema.Types.ObjectId,

          ref: "Match",

          default: null,
        },
      },

      /* HIGHEST SCORE */

      highestScore: {
        runs: {
          type: Number,
          default: 0,
        },

        wickets: {
          type: Number,
          default: 0,
        },

        overs: {
          type: Number,
          default: 0,
        },

        matchId: {
          type: mongoose.Schema.Types.ObjectId,

          ref: "Match",

          default: null,
        },
      },

      /* LOWEST SCORE */

      lowestScore: {
        runs: {
          type: Number,
          default: null,
        },

        wickets: {
          type: Number,
          default: null,
        },

        overs: {
          type: Number,
          default: 0,
        },

        matchId: {
          type: mongoose.Schema.Types.ObjectId,

          ref: "Match",

          default: null,
        },
      },

      /* PARTNERSHIPS */

      highestPartnership: {
        runs: {
          type: Number,
          default: 0,
        },

        batters: [
          {
            type: String,
          },
        ],

        wicket: {
          type: Number,
          default: 0,
        },

        matchId: {
          type: mongoose.Schema.Types.ObjectId,

          ref: "Match",

          default: null,
        },
      },

      /* OVER RECORDS */

      mostRunsInOver: {
        runs: {
          type: Number,
          default: 0,
        },

        over: {
          type: Number,
          default: 0,
        },

        bowler: {
          type: String,
          default: null,
        },

        matchId: {
          type: mongoose.Schema.Types.ObjectId,

          ref: "Match",

          default: null,
        },
      },
    },
  },
  {
    timestamps: true,
  },
);

/* =========================================
   INDEXES
========================================= */

OverallTeamStatsSchema.index({
  "stats.wins": -1,
});

OverallTeamStatsSchema.index({
  "stats.runsScored": -1,
});

OverallTeamStatsSchema.index({
  "stats.wicketsTaken": -1,
});

/* ========================================= */

const OverallTeamStats =
  mongoose.models.OverallTeamStats ||
  mongoose.model("OverallTeamStats", OverallTeamStatsSchema);

export default OverallTeamStats;
