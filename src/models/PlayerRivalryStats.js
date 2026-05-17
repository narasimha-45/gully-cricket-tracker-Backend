import mongoose from "mongoose";

const PlayerRivalryStatsSchema = new mongoose.Schema(
  {
    batter: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    bowler: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    seasonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Season",
      default: null,
    },

    stats: {
      balls: {
        type: Number,
        default: 0,
      },

      runs: {
        type: Number,
        default: 0,
      },

      dots: {
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

      dismissals: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  },
); /* =========================================
   UNIQUE MATCHUP
========================================= */

PlayerRivalryStatsSchema.index(
  {
    batter: 1,
    bowler: 1,
    seasonId: 1,
  },
  {
    unique: true,
  },
);

/* =========================================
   LOOKUPS
========================================= */

PlayerRivalryStatsSchema.index({
  batter: 1,
});
PlayerRivalryStatsSchema.index({
  bowler: 1,
});

PlayerRivalryStatsSchema.index({
  "stats.runs": -1,
});

const PlayerRivalryStats =
  mongoose.models.PlayerRivalryStats ||
  mongoose.model("PlayerRivalryStats", PlayerRivalryStatsSchema);

export default PlayerRivalryStats;
