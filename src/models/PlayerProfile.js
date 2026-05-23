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

      slug: {
        type: String,
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

      teamsPlayedFor: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "TeamProfile",
        },
      ],

      debutSeasonId: {
        type: mongoose.Schema.Types.ObjectId,
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
    },
  );

/* =========================================
   INDEXES
========================================= */

PlayerProfileSchema.index({
  name: "text",
  displayName: "text",
});

/* =========================================
   HOOKS
========================================= */

PlayerProfileSchema.pre("save", function () {
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-");
  }

  if (!this.displayName) {
    this.displayName = this.name;
  }
});

const PlayerProfile =
  mongoose.models.PlayerProfile ||
  mongoose.model(
    "PlayerProfile",
    PlayerProfileSchema,
  );

export default PlayerProfile;