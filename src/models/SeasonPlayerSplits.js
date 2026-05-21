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
   SEASON PLAYER SPLITS
===================================================== */

const SeasonPlayerSplitsSchema =
  new mongoose.Schema(
    {
      seasonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Season",
        required: true,
      },

      playerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PlayerProfile",
        required: true,
      },

      /* =================================================
         POSITION SPLITS
      =================================================

         Keys:
         "1", "2", "3", ...
      ================================================= */

      byPosition: {
        type: Map,

        of: SplitSchema,

        default: {},
      },

      /* =================================================
         OPPONENT SPLITS
      =================================================

         Keys:
         Team ID string
      ================================================= */

      byOpponent: {
        type: Map,

        of: SplitSchema,

        default: {},
      },

      /* =================================================
         TEAM SPLITS
      =================================================

         Keys:
         Team ID string
      ================================================= */

      byTeam: {
        type: Map,

        of: SplitSchema,

        default: {},
      },

      /* =================================================
         BATTING INNINGS SPLITS
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

      /* =================================================
         BOWLING INNINGS SPLITS
      =================================================

         Keys:
         "FIRST"
         "SECOND"
      ================================================= */

      bowlingInnings: {
        type: Map,

        of: SplitSchema,

        default: {},
      },

      /* =================================================
         MATCH RESULT SPLITS
      =================================================

         Keys:
         "WON"
         "LOST"
         "TIED"
         "NO_RESULT"
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

SeasonPlayerSplitsSchema.index(
  {
    seasonId: 1,
    playerId: 1,
  },
  {
    unique: true,
  }
);

SeasonPlayerSplitsSchema.index({
  seasonId: 1,
});

SeasonPlayerSplitsSchema.index({
  playerId: 1,
});

const SeasonPlayerSplits =
  mongoose.models
    .SeasonPlayerSplits ||
  mongoose.model(
    "SeasonPlayerSplits",
    SeasonPlayerSplitsSchema
  );

export default SeasonPlayerSplits;