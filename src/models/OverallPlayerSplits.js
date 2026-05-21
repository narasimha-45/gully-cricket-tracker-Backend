import mongoose from "mongoose";

/* =====================================================
   REUSABLE SPLIT SCHEMA
===================================================== */

const SplitSchema = new mongoose.Schema(
  {
    matches: {
      type: Number,
      default: 0,
    },

    innings: {
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

    outs: {
      type: Number,
      default: 0,
    },

    wickets: {
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
  },
  {
    _id: false,
  }
);

/* =====================================================
   OVERALL PLAYER SPLITS
===================================================== */

const OverallPlayerSplitsSchema =
  new mongoose.Schema(
    {
      playerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PlayerProfile",
        required: true,
        unique: true,
      },

      /* =================================================
         POSITION SPLITS
      ================================================= */

      byPosition: {
        type: Map,

        of: SplitSchema,

        default: {},
      },

      /* =================================================
         OPPONENT SPLITS
      ================================================= */

      byOpponent: {
        type: Map,

        of: SplitSchema,

        default: {},
      },

      /* =================================================
         TEAM SPLITS
      ================================================= */

      byTeam: {
        type: Map,

        of: SplitSchema,

        default: {},
      },

      /* =================================================
         INNINGS CONTEXT
      =================================================

         Keys:
         "FIRST"
         "SECOND"
      ================================================= */

      battingInnings: {
        type: Map,

        of: SplitSchema,

        default: {},
      },

      bowlingInnings: {
        type: Map,

        of: SplitSchema,

        default: {},
      },

      /* =================================================
         MATCH RESULT CONTEXT
      =================================================

         Keys:
         "WON"
         "LOST"
         "TIED"
      ================================================= */

      byMatchResult: {
        type: Map,

        of: SplitSchema,

        default: {},
      },
    },
    {
      timestamps: true,
    }
  );

/* =====================================================
   INDEXES
===================================================== */

OverallPlayerSplitsSchema.index({
  playerId: 1,
});

const OverallPlayerSplits =
  mongoose.models
    .OverallPlayerSplits ||
  mongoose.model(
    "OverallPlayerSplits",
    OverallPlayerSplitsSchema
  );

export default OverallPlayerSplits;