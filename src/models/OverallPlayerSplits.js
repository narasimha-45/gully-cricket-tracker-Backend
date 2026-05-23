// ======================================================
// models/OverallPlayerSplits.js
// ======================================================

import mongoose from "mongoose";

/* ======================================================
   COMMON SPLIT SCHEMA
====================================================== */

const SplitSchema = new mongoose.Schema(
  {
    matches: { type: Number, default: 0 },

    innings: { type: Number, default: 0 },

    runs: { type: Number, default: 0 },

    balls: { type: Number, default: 0 },

    outs: { type: Number, default: 0 },

    wickets: { type: Number, default: 0 },

    fours: { type: Number, default: 0 },

    sixes: { type: Number, default: 0 },

    bestBowling: {
      wickets: {
        type: Number,
        default: 0,
      },

      runs: {
        type: Number,
        default: 9999,
      },
    },
  },
  { _id: false },
);

/* ======================================================
   BATTING INNINGS
====================================================== */

const BattingInningsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
    },

    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: true,
    },

    seasonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Season",
    },

    inningsNumber: {
      type: Number,
      required: true,
    },

    playedFor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeamProfile",
      required: true,
    },

    opponent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeamProfile",
      required: true,
    },

    battingPosition: {
      type: Number,
      required: true,
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

    out: {
      type: Boolean,
      default: false,
    },

    won: {
      type: Boolean,
      default: false,
    },

    date: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

/* ======================================================
   BOWLING INNINGS
====================================================== */

const BowlingInningsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
    },

    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: true,
    },

    seasonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Season",
    },

    inningsNumber: {
      type: Number,
      required: true,
    },

    playedFor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeamProfile",
      required: true,
    },

    opponent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeamProfile",
      required: true,
    },

    wickets: {
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

    won: {
      type: Boolean,
      default: false,
    },

    date: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

/* ======================================================
   BATTING SPLITS
====================================================== */

const BattingSplitsSchema = new mongoose.Schema(
  {
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

    byMatchResult: {
      type: Map,
      of: SplitSchema,
      default: {},
    },

    byInnings: {
      type: Map,
      of: SplitSchema,
      default: {},
    },
  },
  { _id: false },
);

/* ======================================================
   BOWLING SPLITS
====================================================== */

const BowlingSplitsSchema = new mongoose.Schema(
  {
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

    byMatchResult: {
      type: Map,
      of: SplitSchema,
      default: {},
    },

    byInnings: {
      type: Map,
      of: SplitSchema,
      default: {},
    },
  },
  { _id: false },
);

/* ======================================================
   MAIN SCHEMA
====================================================== */

const OverallPlayerSplitsSchema = new mongoose.Schema(
  {
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlayerProfile",
      required: true,
      unique: true,
    },

    batting: {
      type: BattingSplitsSchema,
      default: () => ({}),
    },

    bowling: {
      type: BowlingSplitsSchema,
      default: () => ({}),
    },

    battingInnings: {
      type: [BattingInningsSchema],
      default: [],
    },

    bowlingInnings: {
      type: [BowlingInningsSchema],
      default: [],
    },
  },
  { timestamps: true },
);

/* ======================================================
   INDEXES
====================================================== */

// Single indexes

OverallPlayerSplitsSchema.index({
  "battingInnings.inningsNumber": 1,
});

OverallPlayerSplitsSchema.index({
  "battingInnings.battingPosition": 1,
});

OverallPlayerSplitsSchema.index({
  "battingInnings.won": 1,
});

OverallPlayerSplitsSchema.index({
  "bowlingInnings.inningsNumber": 1,
});

OverallPlayerSplitsSchema.index({
  "bowlingInnings.won": 1,
});

// Compound indexes

OverallPlayerSplitsSchema.index({
  "battingInnings.battingPosition": 1,
  "battingInnings.won": 1,
});

OverallPlayerSplitsSchema.index({
  "battingInnings.inningsNumber": 1,
  "battingInnings.won": 1,
});

OverallPlayerSplitsSchema.index({
  "battingInnings.battingPosition": 1,
  "battingInnings.inningsNumber": 1,
});

OverallPlayerSplitsSchema.index({
  "bowlingInnings.inningsNumber": 1,
  "bowlingInnings.won": 1,
});

/* ======================================================
   MODEL
====================================================== */

const OverallPlayerSplits =
  mongoose.models.OverallPlayerSplits ||
  mongoose.model("OverallPlayerSplits", OverallPlayerSplitsSchema);

export default OverallPlayerSplits;
