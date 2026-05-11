// models/Team.js

import mongoose from "mongoose";

const TeamSchema = new mongoose.Schema(
  {
    /* =========================================
       TEAM INFO
    ========================================= */

    name: {
      type: String,

      required: true,

      trim: true,
    },

    seasonId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Season",

      required: true,
    },

    players: [
      {
        type: mongoose.Schema.Types.ObjectId,

        ref: "Player",
      },
    ],

    /* =========================================
       TEAM STATS
    ========================================= */

    stats: {
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

      /* BIGGEST WIN */

      biggestWin: {
        margin: {
          type: Number,

          default: 0,
        },

        type: {
          type: String,

          enum: [
            "RUNS",
            "WICKETS",
          ],

          default: null,
        },

        matchId: {
          type: mongoose.Schema.Types.ObjectId,

          ref: "Match",

          default: null,
        },
      },

      /* HIGHEST TEAM SCORE */

      highestScore: {
        runs: {
          type: Number,

          default: 0,
        },

        wickets: {
          type: Number,

          default: 0,
        },

        matchId: {
          type: mongoose.Schema.Types.ObjectId,

          ref: "Match",

          default: null,
        },
      },

      /* LOWEST TEAM SCORE */

      lowestScore: {
        runs: {
          type: Number,

          default: null,
        },

        wickets: {
          type: Number,

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
  }
);

/* =========================================
   UNIQUE TEAM NAME PER SEASON
========================================= */

TeamSchema.index(
  {
    name: 1,
    seasonId: 1,
  },
  {
    unique: true,
  }
);


/* ========================================= */

const Team =
  mongoose.models.Team ||
  mongoose.model(
    "Team",
    TeamSchema
  );

export default Team;