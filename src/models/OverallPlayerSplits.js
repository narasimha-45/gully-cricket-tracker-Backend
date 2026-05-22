import mongoose from "mongoose";

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
  },
  { _id: false },
);

const BattingInningsSchema = new mongoose.Schema(
  {
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: "Match" },
    inningsNumber: Number,
    playedFor: { type: mongoose.Schema.Types.ObjectId, ref: "TeamProfile" },
    opponent: { type: mongoose.Schema.Types.ObjectId, ref: "TeamProfile" },
    battingPosition: Number,
    runs: Number,
    balls: Number,
    fours: Number,
    sixes: Number,
    out: Boolean,
    won: Boolean,
    date: Date,
  },
  { _id: false },
);

const BowlingInningsSchema = new mongoose.Schema(
  {
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: "Match" },
    inningsNumber: Number,
    playedFor: { type: mongoose.Schema.Types.ObjectId, ref: "TeamProfile" },
    opponent: { type: mongoose.Schema.Types.ObjectId, ref: "TeamProfile" },
    wickets: Number,
    balls: Number,
    runs: Number,
    won: Boolean,
    date: Date,
  },
  { _id: false },
);

const BattingSplitsSchema = new mongoose.Schema(
  {
    byPosition: { type: mongoose.Schema.Types.Mixed, default: {} },
    byOpponent: { type: mongoose.Schema.Types.Mixed, default: {} },
    byTeam: { type: mongoose.Schema.Types.Mixed, default: {} },
    byMatchResult: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const BowlingSplitsSchema = new mongoose.Schema(
  {
    byOpponent: { type: mongoose.Schema.Types.Mixed, default: {} },
    byTeam: { type: mongoose.Schema.Types.Mixed, default: {} },
    byMatchResult: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const OverallPlayerSplitsSchema = new mongoose.Schema(
  {
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlayerProfile",
      required: true,
      unique: true,
    },

    batting: { type: BattingSplitsSchema, default: () => ({}) },
    bowling: { type: BowlingSplitsSchema, default: () => ({}) },

    battingInnings: { type: [BattingInningsSchema], default: [] },
    bowlingInnings: { type: [BowlingInningsSchema], default: [] },
  },
  { timestamps: true },
);

OverallPlayerSplitsSchema.index({ playerId: 1 });

const OverallPlayerSplits =
  mongoose.models.OverallPlayerSplits ||
  mongoose.model("OverallPlayerSplits", OverallPlayerSplitsSchema);

export default OverallPlayerSplits;