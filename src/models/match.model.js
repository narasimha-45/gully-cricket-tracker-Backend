import mongoose from "mongoose";

const BallSchema = new mongoose.Schema(
  {
    over: Number,
    ballInOver: Number,
    actualBallNum: Number,

    strikerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlayerProfile",
    },

    nonStrikerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlayerProfile",
    },

    bowlerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlayerProfile",
    },

    runs: {
      type: Number,
      default: 0,
    },

    type: {
      type: String,
      enum: [
        "RUN",
        "WIDE",
        "NO_BALL",
        "BYE",
        "LEG_BYE",
        "WICKET",
      ],
    },

    isWicket: {
      type: Boolean,
      default: false,
    },

    wicket: {
      type: {
        type: String,
        enum: [
          "BOWLED",
          "CAUGHT",
          "LBW",
          "RUN_OUT",
          "STUMPED",
          "HIT_WICKET",
        ],
      },

      outBatsmanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PlayerProfile",
      },

      helperId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PlayerProfile",
      },
    },

    timestamp: Number,
  },
  {
    _id: false,
  }
);

const InningsSchema = new mongoose.Schema(
  {
    battingTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeamProfile",
    },

    bowlingTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeamProfile",
    },

    battingOrder: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PlayerProfile",
      },
    ],

    totalRuns: Number,
    wickets: Number,
    balls: Number,

    battingStats: mongoose.Schema.Types.Mixed,

    bowlingStats: mongoose.Schema.Types.Mixed,

    extras: {
      wides: Number,
      noBalls: Number,
    },

    dismissals: mongoose.Schema.Types.Mixed,

    ballByBall: [BallSchema],

    analytics: {
      hasBallByBall: {
        type: Boolean,
        default: false,
      },

      hasRivalries: {
        type: Boolean,
        default: false,
      },

      hasPartnerships: {
        type: Boolean,
        default: false,
      },
    },

    completed: Boolean,
  },
  {
    _id: false,
  }
);

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
      default: "OVERS",
    },

    teams: {
      teamA: {
        teamId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "TeamProfile",
        },

        players: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PlayerProfile",
          },
        ],
      },

      teamB: {
        teamId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "TeamProfile",
        },

        players: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PlayerProfile",
          },
        ],
      },
    },

    toss: {
      winnerTeamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeamProfile",
      },

      decision: String,
    },

    rules: mongoose.Schema.Types.Mixed,

    totalOvers: Number,

    innings: [InningsSchema],

    result: {
      winnerTeamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeamProfile",
      },

      type: String,

      margin: mongoose.Schema.Types.Mixed,

      manOfTheMatchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PlayerProfile",
      },
    },

    status: {
      type: String,
      enum: ["LIVE", "COMPLETED"],
      default: "LIVE",
    },

    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

MatchSchema.index({
  seasonId: 1,
  completedAt: -1,
});

const Match =
  mongoose.models.Match ||
  mongoose.model("Match", MatchSchema);

export default Match;