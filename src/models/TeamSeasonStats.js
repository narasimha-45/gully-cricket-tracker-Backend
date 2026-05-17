import mongoose from "mongoose";

const TeamSeasonStatsSchema = new mongoose.Schema(
  {
    seasonId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Season",

      required: true,
    },

    name: {
      type: String,

      required: true,

      trim: true,

      lowercase: true,
    },

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

      points: {
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
    },
  },
  {
    timestamps: true,
  },
);

/* =========================================
   UNIQUE
========================================= */

TeamSeasonStatsSchema.index(
  {
    seasonId: 1,
    name: 1,
  },
  {
    unique: true,
  },
);

/* =========================================
   LEADERBOARDS
========================================= */

TeamSeasonStatsSchema.index({
  seasonId: 1,
  "stats.points": -1,
});

TeamSeasonStatsSchema.index({
  seasonId: 1,
  "stats.wins": -1,
});

TeamSeasonStatsSchema.index({
  seasonId: 1,
  "stats.runsScored": -1,
});

/* ========================================= */

const TeamSeasonStats =
  mongoose.models.TeamSeasonStats ||
  mongoose.model("TeamSeasonStats", TeamSeasonStatsSchema);

export default TeamSeasonStats;
