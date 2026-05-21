import mongoose from "mongoose";

const SeasonPlayerRivalrySchema = new mongoose.Schema(
  {
    seasonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Season",
      required: true,
    },

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
  }
);

SeasonPlayerRivalrySchema.index(
  {
    seasonId: 1,
    batterId: 1,
    bowlerId: 1,
  },
  {
    unique: true,
  }
);

const SeasonPlayerRivalry =
  mongoose.models.SeasonPlayerRivalry ||
  mongoose.model(
    "SeasonPlayerRivalry",
    SeasonPlayerRivalrySchema
  );

export default SeasonPlayerRivalry;
