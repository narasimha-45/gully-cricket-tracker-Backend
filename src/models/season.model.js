import mongoose from "mongoose";

const SeasonSchema = new mongoose.Schema(
  {
    seasonName: {
      type: String,
      required: true,
      trim: true,
    },

    matchesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Season =
  mongoose.models.Season ||
  mongoose.model("Season", SeasonSchema);

export default Season;