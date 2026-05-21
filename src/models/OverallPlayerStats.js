import mongoose from "mongoose";

const RivalPlayerSchema = new mongoose.Schema(
  {
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlayerProfile",
      required: true,
    },

    count: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: false,
  }
);

const OverallPlayerStatsSchema = new mongoose.Schema(
  {
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlayerProfile",
      required: true,
      unique: true,
    },

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

    batting: {
      innings: {
        type: Number,
        default: 0,
      },

      outs: {
        type: Number,
        default: 0,
      },

      notOuts: {
        type: Number,
        default: 0,
      },

      runs: {
        type: Number,
        default: 0,
      },

      balls: {
        type: Number,
        default: 0,
      },

      fours: {
        type: Number,
        default: 0,
      },

      sixes: {
        type: Number,
        default: 0,
      },

      ducks: {
        type: Number,
        default: 0,
      },

      highestScore: {
        runs: {
          type: Number,
          default: 0,
        },

        matchId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Match",
        },
      },

      scoreBuckets: {
        type: [Number],
        default: () => Array(10).fill(0),
      },

      milestones: {
        thirtyPlus: {
          type: Number,
          default: 0,
        },

        fiftyPlus: {
          type: Number,
          default: 0,
        },

        hundredPlus: {
          type: Number,
          default: 0,
        },
      },

      dismissalTypes: {
        bowled: {
          type: Number,
          default: 0,
        },

        caught: {
          type: Number,
          default: 0,
        },

        lbw: {
          type: Number,
          default: 0,
        },

        runOut: {
          type: Number,
          default: 0,
        },

        stumped: {
          type: Number,
          default: 0,
        },

        hitWicket: {
          type: Number,
          default: 0,
        },

        notOut: {
          type: Number,
          default: 0,
        },
      },

      mostDismissedBy: {
        type: [RivalPlayerSchema],
        default: [],
      },
    },

    bowling: {
      innings: {
        type: Number,
        default: 0,
      },

      balls: {
        type: Number,
        default: 0,
      },

      runs: {
        type: Number,
        default: 0,
      },

      wickets: {
        type: Number,
        default: 0,
      },

      maidens: {
        type: Number,
        default: 0,
      },

      bestBowling: {
        wickets: {
          type: Number,
          default: 0,
        },

        runs: {
          type: Number,
          default: 0,
        },

        matchId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Match",
        },
      },

      wicketTypes: {
        bowled: {
          type: Number,
          default: 0,
        },

        caught: {
          type: Number,
          default: 0,
        },

        lbw: {
          type: Number,
          default: 0,
        },

        stumped: {
          type: Number,
          default: 0,
        },

        hitWicket: {
          type: Number,
          default: 0,
        },
      },

      wicketHauls: {
        threeWickets: {
          type: Number,
          default: 0,
        },

        fiveWickets: {
          type: Number,
          default: 0,
        },
      },

      mostDismissedBatters: {
        type: [RivalPlayerSchema],
        default: [],
      },
    },

    fielding: {
      catches: {
        type: Number,
        default: 0,
      },

      runOuts: {
        type: Number,
        default: 0,
      },

      stumpings: {
        type: Number,
        default: 0,
      },
    },

    achievements: {
      mom: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

OverallPlayerStatsSchema.index({
  "batting.runs": -1,
});

OverallPlayerStatsSchema.index({
  "bowling.wickets": -1,
});

const OverallPlayerStats =
  mongoose.models.OverallPlayerStats ||
  mongoose.model(
    "OverallPlayerStats",
    OverallPlayerStatsSchema
  );

export default OverallPlayerStats;