import mongoose from "mongoose";

const TeamProfileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    displayName: {
      type: String,
      trim: true,
    },

    seasonsPlayed: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Season",
      },
    ],

    totalMatches: {
      type: Number,
      default: 0,
    },

    lastMatchAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const TeamProfile =
  mongoose.models.TeamProfile ||
  mongoose.model("TeamProfile", TeamProfileSchema);

export default TeamProfile;