import mongoose from "mongoose";

/* =====================================================
   SHARED SUB SCHEMAS
===================================================== */

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

const RecentPerformanceSchema =
  new mongoose.Schema(
    {
      matchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Match",
      },

      playedFor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeamProfile",
      },

      opponent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeamProfile",
      },

      runs: {
        type: Number,
        default: 0,
      },

      ballsFaced: {
        type: Number,
        default: 0,
      },

      wickets: {
        type: Number,
        default: 0,
      },

      ballsBowled: {
        type: Number,
        default: 0,
      },

      oversBowled: {
        type: Number,
        default: 0,
      },

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

      won: {
        type: Boolean,
        default: false,
      },

      mom: {
        type: Boolean,
        default: false,
      },

      date: Date,
    },
    {
      _id: false,
    }
  );

/* =====================================================
   SEASON PLAYER STATS
===================================================== */

const SeasonPlayerStatsSchema =
  new mongoose.Schema(
    {
      seasonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Season",
        required: true,
      },

      playerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PlayerProfile",
        required: true,
      },

      totalMatches: {
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

      /* =================================================
         BATTING
      ================================================= */

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
            type:
              mongoose.Schema.Types.ObjectId,

            ref: "Match",
          },
        },

        scoreBuckets: {
          type: [Number],

          default: () =>
            Array(10).fill(0),
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

      /* =================================================
         BOWLING
      ================================================= */

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
            type:
              mongoose.Schema.Types.ObjectId,

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

      /* =================================================
         FIELDING
      ================================================= */

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

      /* =================================================
         ACHIEVEMENTS
      ================================================= */

      achievements: {
        mom: {
          type: Number,
          default: 0,
        },
      },

      /* =================================================
         RECENT FORM
      ================================================= */

      recentPerformances: {
        type: [RecentPerformanceSchema],
        default: [],
      },
    },
    {
      timestamps: true,
    }
  );

/* =====================================================
   INDEXES
===================================================== */

SeasonPlayerStatsSchema.index(
  {
    seasonId: 1,
    playerId: 1,
  },
  {
    unique: true,
  }
);

SeasonPlayerStatsSchema.index({
  seasonId: 1,
  "batting.runs": -1,
});

SeasonPlayerStatsSchema.index({
  seasonId: 1,
  "bowling.wickets": -1,
});

SeasonPlayerStats.index(
  {
    seasonId: 1,
    "fielding.catches": -1,
  }
);

SeasonPlayerStats.index(
  {
    seasonId: 1,
    "achievements.mom": -1,
  }
);


const SeasonPlayerStats =
  mongoose.models.SeasonPlayerStats ||
  mongoose.model(
    "SeasonPlayerStats",
    SeasonPlayerStatsSchema
  );

export default SeasonPlayerStats;