import mongoose from "mongoose";

const PlayerProfileSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,

        required: true,

        unique: true,

        trim: true,

        lowercase: true,
      },

      seasonsPlayed: [
        {
          type:
            mongoose.Schema.Types
              .ObjectId,

          ref: "Season",
        },
      ],

      teamsPlayedFor: [
        {
          type: String,
        },
      ],

      debutSeasonId: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "Season",

        default: null,
      },

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

const PlayerProfile =
  mongoose.models.PlayerProfile ||
  mongoose.model(
    "PlayerProfile",
    PlayerProfileSchema
  );

export default PlayerProfile;