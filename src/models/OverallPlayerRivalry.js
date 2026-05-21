import mongoose from "mongoose";

const OverallPlayerRivalrySchema = new mongoose.Schema(
  {
    batterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlayerProfile",
      required: true,
    },

    bowlerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlayerProfile",
      required: true,
    },

    sourceMatches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Match",
      },
    ],

    dismissals: {
      total: Number,
      bowled: Number,
      caught: Number,
      lbw: Number,
      stumped: Number,
      hitWicket: Number,
    },

    ballByBall: {
      innings: Number,
      balls: Number,
      runs: Number,
      dots: Number,
      fours: Number,
      sixes: Number,
    },
  },
  {
    timestamps: true,
  },
);

OverallPlayerRivalrySchema.index(
  {
    batterId: 1,
    bowlerId: 1,
  },
  {
    unique: true,
  },
);

const OverallPlayerRivalry =
  mongoose.models.OverallPlayerRivalry ||
  mongoose.model("OverallPlayerRivalry", OverallPlayerRivalrySchema);

export default OverallPlayerRivalry;
