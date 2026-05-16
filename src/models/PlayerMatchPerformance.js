// models/PlayerMatchPerformance.js

import mongoose from "mongoose";

const PlayerMatchPerformanceSchema = new mongoose.Schema(
  {
    /* PLAYER */

    name: {
      type: String,

      required: true,

      trim: true,

      lowercase: true,
    },

    /* MATCH INFO */

    matchId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Match",

      required: true,
    },

    seasonId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Season",

      required: true,
    },

    matchDate: {
      type: Date,

      required: true,
    },

    /* TEAM INFO */

    playedFor: {
      type: String,

      required: true,

      trim: true,
    },

    opponent: {
      type: String,

      required: true,

      trim: true,
    },

    /* RESULT */

    result: {
      won: {
        type: Boolean,

        default: false,
      },

      mom: {
        type: Boolean,

        default: false,
      },
    },

    /* BATTING */

    batting: {
      played: {
        type: Boolean,

        default: false,
      },

      innings: {
        type: Boolean,

        default: false,
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

      dismissal: {
        type: {
          type: String,

          enum: [
            "BOWLED",
            "CAUGHT",
            "LBW",
            "RUN_OUT",
            "STUMPED",
            "HIT_WICKET",
            "NOT_OUT",
          ],

          default: "NOT_OUT",
        },

        bowler: {
          type: String,

          default: null,
        },

        fielder: {
          type: String,

          default: null,
        },
      },
    },

    /* BOWLING */

    bowling: {
      bowled: {
        type: Boolean,

        default: false,
      },

      balls: {
        type: Number,

        default: 0,
      },

      maidens: {
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
      dismissedBatters: [
        {
          name: { type: String, trim: true, lowercase: true },
          type: {
            type: String,
            enum: ["BOWLED", "CAUGHT", "LBW", "STUMPED", "HIT_WICKET"],
          },
        },
      ],
    },

    /* FIELDING */

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
  },
  {
    timestamps: true,
  },
);

/* =========================================
   INDEXES
========================================= */

/* ONE PLAYER ENTRY PER MATCH */

PlayerMatchPerformanceSchema.index(
  {
    name: 1,
    matchId: 1,
  },
  {
    unique: true,
  },
);

/* PLAYER HISTORY */

PlayerMatchPerformanceSchema.index({
  name: 1,
  matchDate: -1,
});

/* SEASON HISTORY */

PlayerMatchPerformanceSchema.index({
  seasonId: 1,
  matchDate: -1,
});

/* BATTING RECORDS */

PlayerMatchPerformanceSchema.index({
  "batting.runs": -1,
});

/* BOWLING RECORDS */

PlayerMatchPerformanceSchema.index({
  "bowling.wickets": -1,
});

/* MOM SEARCH */

PlayerMatchPerformanceSchema.index({
  "result.mom": 1,
});

/* TEAM HISTORY */

PlayerMatchPerformanceSchema.index({
  playedFor: 1,
});

/* ========================================= */

const PlayerMatchPerformance =
  mongoose.models.PlayerMatchPerformance ||
  mongoose.model("PlayerMatchPerformance", PlayerMatchPerformanceSchema);

export default PlayerMatchPerformance;
