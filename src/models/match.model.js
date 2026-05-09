import mongoose from "mongoose";

const MatchSchema = new mongoose.Schema(
  {
    seasonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Season",
      required: true,
    },

    matchType: {
      type: String,
      enum: ["OVERS", "TEST", "CUSTOM"],
      required: true,
      default: "OVERS",
    },

    teams: {
      teamA: {
        name: String,
        players: [String],
      },
      teamB: {
        name: String,
        players: [String],
      },
    },

    toss: {
      winner: String,
      decision: String,
    },

    rules: mongoose.Schema.Types.Mixed,

    totalOvers: {
      type: Number,
      required: function () {
        return this.matchType === "OVERS";
      },
    },

    innings: mongoose.Schema.Types.Mixed,

    result: {
      winner: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ["RUNS", "WICKETS"],
        required: true,
      },
      margin: {
        type: Number,
        required: true,
      },
      manOfTheMatch: {
        type: String, // player name
        required: false, // older matches won’t have this
      },
    },

    status: {
      type: String,
      enum: ["LIVE", "COMPLETED"],
      default: "LIVE",
    },

    completedAt: Date,
  },
  { timestamps: true }
);

MatchSchema.index({ seasonId: 1, completedAt: -1 });

const Match = mongoose.models.Match || mongoose.model("Match", MatchSchema);

export default Match;
