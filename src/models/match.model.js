import mongoose from "mongoose";

/* ======================================================
   WICKET
====================================================== */

const WicketSchema =
  new mongoose.Schema(
    {
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
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "PlayerProfile",
      },

      helperId: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "PlayerProfile",
      },
    },
    {
      _id: false,
    }
  );

/* ======================================================
   BALL
====================================================== */

const BallSchema =
  new mongoose.Schema(
    {
      over: {
        type: Number,
      },

      ballInOver: {
        type: Number,
      },

      actualBallNum: {
        type: Number,
      },

      strikerId: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "PlayerProfile",
      },

      nonStrikerId: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "PlayerProfile",
      },

      bowlerId: {
        type:
          mongoose.Schema.Types
            .ObjectId,

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
        type: WicketSchema,

        default: null,
      },

      timestamp: {
        type: Number,
      },
    },
    {
      _id: false,
    }
  );

/* ======================================================
   ANALYTICS
====================================================== */

const AnalyticsSchema =
  new mongoose.Schema(
    {
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

      processed: {
        type: Boolean,

        default: false,
      },

      processedAt: {
        type: Date,

        default: null,
      },
    },
    {
      _id: false,
    }
  );

/* ======================================================
   INNINGS
====================================================== */

const InningsSchema =
  new mongoose.Schema(
    {
      inningsNumber: {
        type: Number,
      },

      battingTeamId: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "TeamProfile",
      },

      bowlingTeamId: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "TeamProfile",
      },

      battingOrder: [
        {
          type:
            mongoose.Schema.Types
              .ObjectId,

          ref: "PlayerProfile",
        },
      ],

      totalRuns: {
        type: Number,

        default: 0,
      },

      wickets: {
        type: Number,

        default: 0,
      },

      balls: {
        type: Number,

        default: 0,
      },

      battingStats: {
        type:
          mongoose.Schema.Types
            .Mixed,

        default: {},
      },

      bowlingStats: {
        type:
          mongoose.Schema.Types
            .Mixed,

        default: {},
      },

      extras: {
        wides: {
          type: Number,

          default: 0,
        },

        noBalls: {
          type: Number,

          default: 0,
        },
      },

      dismissals: {
        type:
          mongoose.Schema.Types
            .Mixed,

        default: {},
      },

      ballByBall: {
        type: [BallSchema],

        default: [],
      },

      analytics: {
        type: AnalyticsSchema,

        default: () => ({}),
      },

      completed: {
        type: Boolean,

        default: true,
      },
    },
    {
      _id: false,
    }
  );

/* ======================================================
   TEAM
====================================================== */

const TeamSchema =
  new mongoose.Schema(
    {
      teamId: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "TeamProfile",
      },

      players: [
        {
          type:
            mongoose.Schema.Types
              .ObjectId,

          ref: "PlayerProfile",
        },
      ],
    },
    {
      _id: false,
    }
  );

/* ======================================================
   TOSS
====================================================== */

const TossSchema =
  new mongoose.Schema(
    {
      winnerTeamId: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "TeamProfile",
      },

      decision: {
        type: String,

        enum: [
          "BAT",
          "BOWL",
          "bat",
          "bowl",
          "Bat",
          "Bowl"
        ],
      },
    },
    {
      _id: false,
    }
  );

/* ======================================================
   RESULT
====================================================== */

const ResultSchema =
  new mongoose.Schema(
    {
      winnerTeamId: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "TeamProfile",
      },

      type: {
        type: String,

        enum: [
          "RUNS",
          "WICKETS",
          "TIE",
          "NO_RESULT",
          "SUPER_OVER"
        ],
      },

      margin: {
        type:
          mongoose.Schema.Types
            .Mixed,
      },

      manOfTheMatchId: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "PlayerProfile",
      },
    },
    {
      _id: false,
    }
  );

/* ======================================================
   MATCH
====================================================== */

const MatchSchema =
  new mongoose.Schema(
    {
      seasonId: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "Season",

        required: true,
      },

      matchType: {
        type: String,

        enum: [
          "OVERS",
          "TEST",
          "CUSTOM",
        ],

        default: "OVERS",
      },

      teams: {
        teamA: {
          type: TeamSchema,

          required: true,
        },

        teamB: {
          type: TeamSchema,

          required: true,
        },
      },

      toss: {
        type: TossSchema,

        default: null,
      },

      rules: {
        type:
          mongoose.Schema.Types
            .Mixed,

        default: {},
      },

      totalOvers: {
        type: Number,
      },

      innings: {
        type: [InningsSchema],

        default: [],
      },

      result: {
        type: ResultSchema,

        default: null,
      },

      status: {
        type: String,

        enum: [
          "LIVE",
          "COMPLETED",
        ],

        default: "LIVE",
      },

      completedAt: {
        type: Date,

        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

/* =====================================================
   INDEXES
===================================================== */

MatchSchema.index({
  seasonId: 1,

  completedAt: -1,
});

MatchSchema.index({
  status: 1,
});

MatchSchema.index({
  "result.winnerTeamId": 1,
});

/* =====================================================
   MODEL
===================================================== */

const Match =
  mongoose.models.Match ||
  mongoose.model(
    "Match",
    MatchSchema
  );

export default Match;