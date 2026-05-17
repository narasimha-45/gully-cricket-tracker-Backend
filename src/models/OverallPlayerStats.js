// models/OverallPlayerStats.js

import mongoose from "mongoose";

const OverallPlayerStatsSchema = new mongoose.Schema(
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

    totalMatches: {
      type: Number,

      default: 0,
    },

    /* =========================================
       BATTING
    ========================================= */

    batting: {
      matches: {
        type: Number,
        default: 0,
      },

      innings: {
        type: Number,
        default: 0,
      },

      outs: {
        type: Number,
        default: 0,
      },

      notOuts: {
        type: Number,
        default: 0,
      },

      runs: {
        type: Number,
        default: 0,
      },

      balls: {
        type: Number,
        default: 0,
      },

      fours: {
        type: Number,
        default: 0,
      },

      sixes: {
        type: Number,
        default: 0,
      },

      ducks: {
        type: Number,
        default: 0,
      },

      /* HIGHEST SCORE */

      highestScore: {
        runs: {
          type: Number,
          default: 0,
        },

        seasonId: {
          type: mongoose.Schema.Types.ObjectId,

          ref: "Season",

          default: null,
        },

        matchId: {
          type: mongoose.Schema.Types.ObjectId,

          ref: "Match",

          default: null,
        },
      },

      /* SCORE BUCKETS */

      scoreRanges: {
        type: [Number],

        default: () => Array(11).fill(0),
      },

      /* HOW PLAYER GOT OUT */

      dismissalTypes: {
        bowled: {
          type: Number,
          default: 0,
        },

        caught: {
          type: Number,
          default: 0,
        },

        lbw: {
          type: Number,
          default: 0,
        },

        runOut: {
          type: Number,
          default: 0,
        },

        stumped: {
          type: Number,
          default: 0,
        },

        hitWicket: {
          type: Number,
          default: 0,
        },
      },

      /* WHICH BOWLERS DISMISSED HIM */

      dismissedBy: {
        type: Map,

        of: {
          total: {
            type: Number,
            default: 0,
          },

          bowled: {
            type: Number,
            default: 0,
          },

          caught: {
            type: Number,
            default: 0,
          },

          lbw: {
            type: Number,
            default: 0,
          },

          runOut: {
            type: Number,
            default: 0,
          },

          stumped: {
            type: Number,
            default: 0,
          },

          hitWicket: {
            type: Number,
            default: 0,
          },
        },

        default: {},
      },
    },

    /* =========================================
       BOWLING
    ========================================= */

    bowling: {
      matches: {
        type: Number,
        default: 0,
      },

      innings: {
        type: Number,
        default: 0,
      },

      balls: {
        type: Number,
        default: 0,
      },

      runs: {
        type: Number,
        default: 0,
      },

      wickets: {
        type: Number,
        default: 0,
      },

      maidens: {
        type: Number,
        default: 0,
      },

      /* BEST BOWLING */

      bestBowling: {
        wickets: {
          type: Number,
          default: 0,
        },

        runs: {
          type: Number,
          default: 0,
        },

        seasonId: {
          type: mongoose.Schema.Types.ObjectId,

          ref: "Season",

          default: null,
        },

        matchId: {
          type: mongoose.Schema.Types.ObjectId,

          ref: "Match",

          default: null,
        },
      },

      /* WICKET TYPES */

      wicketTypes: {
        bowled: {
          type: Number,
          default: 0,
        },

        caught: {
          type: Number,
          default: 0,
        },

        lbw: {
          type: Number,
          default: 0,
        },

        stumped: {
          type: Number,
          default: 0,
        },

        hitWicket: {
          type: Number,
          default: 0,
        },
      },

      /* WHICH BATTERS HE DISMISSED */

      dismissedBatters: {
        type: Map,

        of: {
          total: {
            type: Number,
            default: 0,
          },

          bowled: {
            type: Number,
            default: 0,
          },

          caught: {
            type: Number,
            default: 0,
          },

          lbw: {
            type: Number,
            default: 0,
          },

          stumped: {
            type: Number,
            default: 0,
          },

          hitWicket: {
            type: Number,
            default: 0,
          },
        },

        default: {},
      },
    },

    /* =========================================
       FIELDING
    ========================================= */

    fielding: {
      catches: {
        type: Number,
        default: 0,
      },

      runOuts: {
        type: Number,
        default: 0,
      },

      stumpings: {
        type: Number,
        default: 0,
      },
    },

    /* =========================================
       ACHIEVEMENTS
    ========================================= */

    achievements: {
      mom: {
        type: Number,
        default: 0,
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

/* LEADERBOARDS */

OverallPlayerStatsSchema.index({
  "batting.runs": -1,
});

OverallPlayerStatsSchema.index({
  "bowling.wickets": -1,
});

OverallPlayerStatsSchema.index({
  "fielding.catches": -1,
});

OverallPlayerStatsSchema.index({
  "achievements.mom": -1,
});

/* ========================================= */

const OverallPlayerStats =
  mongoose.models.OverallPlayerStats ||
  mongoose.model("OverallPlayerStats", OverallPlayerStatsSchema);

export default OverallPlayerStats;
