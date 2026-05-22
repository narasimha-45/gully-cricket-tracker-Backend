import mongoose from "mongoose";

const MatchReferenceSchema = new mongoose.Schema(
  {
    count: {
      type: Number,
      default: 0,
    },

    recentMatches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Match",
      },
    ],
  },
  {
    _id: false,
  },
);

const TeamStatsSchema = new mongoose.Schema(
  {
    played: {
      type: Number,
      default: 0,
    },

    wins: {
      type: Number,
      default: 0,
    },

    losses: {
      type: Number,
      default: 0,
    },

    ties: {
      type: Number,
      default: 0,
    },

    noResults: {
      type: Number,
      default: 0,
    },

    wonBattingFirst: {
      type: MatchReferenceSchema,
      default: () => ({}),
    },

    lostBattingFirst: {
      type: MatchReferenceSchema,
      default: () => ({}),
    },

    wonBowlingFirst: {
      type: MatchReferenceSchema,
      default: () => ({}),
    },

    lostBowlingFirst: {
      type: MatchReferenceSchema,
      default: () => ({}),
    },

    successfulChases: {
      type: MatchReferenceSchema,
      default: () => ({}),
    },

    failedChases: {
      type: MatchReferenceSchema,
      default: () => ({}),
    },

    defendedTotals: {
      type: MatchReferenceSchema,
      default: () => ({}),
    },

    failedDefends: {
      type: MatchReferenceSchema,
      default: () => ({}),
    },

    runsScored: {
      type: Number,
      default: 0,
    },

    wicketsLost: {
      type: Number,
      default: 0,
    },

    ballsFaced: {
      type: Number,
      default: 0,
    },

    runsConceded: {
      type: Number,
      default: 0,
    },

    wicketsTaken: {
      type: Number,
      default: 0,
    },

    ballsBowled: {
      type: Number,
      default: 0,
    },

    biggestWins: {
      byRuns: {
        margin: {
          type: Number,
          default: 0,
        },

        matchId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Match",
          default: null,
        },
      },

      byWickets: {
        margin: {
          type: Number,
          default: 0,
        },

        matchId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Match",
          default: null,
        },
      },
    },

    highestScore: {
      runs: {
        type: Number,
        default: 0,
      },

      wickets: {
        type: Number,
        default: 0,
      },

      overs: {
        type: Number,
        default: 0,
      },

      matchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Match",
      },
    },

    lowestScore: {
      runs: {
        type: Number,
        default: null,
      },

      wickets: {
        type: Number,
        default: null,
      },

      overs: {
        type: Number,
        default: 0,
      },

      matchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Match",
      },
    },

    highestSuccessfulChase: {
      target: {
        type: Number,
        default: 0,
      },

      achieved: {
        type: Number,
        default: 0,
      },

      matchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Match",
      },
    },

    lowestDefendedScore: {
      defended: {
        type: Number,
        default: 0,
      },

      matchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Match",
      },
    },
  },
  {
    _id: false,
  },
);

const OverallTeamStatsSchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeamProfile",
      required: true,
      unique: true,
    },

    seasonsPlayed: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Season",
      },
    ],

    stats: {
      type: TeamStatsSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  },
);

const OverallTeamStats =
  mongoose.models.OverallTeamStats ||
  mongoose.model("OverallTeamStats", OverallTeamStatsSchema);

export default OverallTeamStats;
