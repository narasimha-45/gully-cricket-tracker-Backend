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

    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PlayerProfile",
      },
    ],

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
  },
);

/* =========================================
   INDEXES
========================================= */

TeamProfileSchema.index({
  name: "text",
  displayName: "text",
});

/* =========================================
   HOOKS
========================================= */

TeamProfileSchema.pre(
  "validate",
  async function () {
    // Generate slug
    if (!this.slug && this.name) {
      this.slug = this.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "");
    }

    // Generate display name
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
  },
);

/* =========================================
   MODEL
========================================= */

const TeamProfile =
  mongoose.models.TeamProfile ||
  mongoose.model(
    "TeamProfile",
    TeamProfileSchema,
  );

export default TeamProfile;