import mongoose from "mongoose";

const PlayerProfileSchema = new mongoose.Schema(
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
      sparse: true,
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

PlayerProfileSchema.pre("validate", async function () {
  // Generate slug automatically
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "");
  }

  // Auto set displayName
  if (!this.displayName && this.name) {
    this.displayName = this.name
      .split(" ")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1),
      )
      .join(" ");
  }
});

/* =========================================
   MODEL
========================================= */

const PlayerProfile =
  mongoose.models.PlayerProfile ||
  mongoose.model(
    "PlayerProfile",
    PlayerProfileSchema,
  );

export default PlayerProfile;