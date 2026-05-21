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

      /*
        POSITION KEYS:
        "1", "2", "3", ...
      */

      byPosition: {
        type: Map,

        of: SplitSchema,

        default: {},
      },

      /*
        OPPONENT TEAM ID STRING
      */

      byOpponent: {
        type: Map,

        of: SplitSchema,

        default: {},
      },

      /*
        TEAM ID STRING
      */

      byTeam: {
        type: Map,

        of: SplitSchema,

        default: {},
      },
    },
    {
      timestamps: true,
    }
  );

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