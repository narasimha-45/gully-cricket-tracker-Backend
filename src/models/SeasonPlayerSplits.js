import mongoose from "mongoose";

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

const SeasonPlayerSplitsSchema = new mongoose.Schema(
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

    byPosition: {
      type: Map,

      of: SplitSchema,

      default: {},
    },

    byOpponent: {
      type: Map,

      of: SplitSchema,

      default: {},
    },

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

SeasonPlayerSplitsSchema.index(
  {
    seasonId: 1,
    playerId: 1,
  },
  {
    unique: true,
  }
);

const SeasonPlayerSplits =
  mongoose.models.SeasonPlayerSplits ||
  mongoose.model(
    "SeasonPlayerSplits",
    SeasonPlayerSplitsSchema
  );

export default SeasonPlayerSplits;