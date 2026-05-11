import mongoose from "mongoose";

const seasonSchema =
  new mongoose.Schema(
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
  mongoose.model(
    "Season",
    seasonSchema
  );

export default Season;