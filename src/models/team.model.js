import mongoose from "mongoose";

const TeamSchema = new mongoose.Schema(
  {
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
  },
  { timestamps: true }
);

/* 🔥 IMPORTANT: team name must be unique per season */
TeamSchema.index({ name: 1, seasonId: 1 }, { unique: true });

const Team =
  mongoose.models.Team || mongoose.model("Team", TeamSchema);

export default Team;
