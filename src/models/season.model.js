import mongoose from "mongoose";

const seasonSchema = new mongoose.Schema(
  {
    seasonName: {
      type: String,
      required: true,
      trim: true,
    },

    matches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Match",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Season =
  mongoose.models.Season || mongoose.model("Season", seasonSchema);

export default Season;
