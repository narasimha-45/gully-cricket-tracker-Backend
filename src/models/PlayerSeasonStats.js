// models/PlayerSeasonStats.js

import mongoose from "mongoose";

/* =========================================
   BATTING
========================================= */

const BattingSchema = new mongoose.Schema(
  {
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

    /* HIGHEST SCORE */

    highestScore: {
      runs: {
        type: Number,
        default: 0,
      },

      matchId: {
        type: mongoose.Schema.Types.ObjectId,

        ref: "Match",

        default: null,
      },
    },

    /* SCORE BUCKETS */

    scoreRanges: {
      type: [Number],

      default: () => Array(11).fill(0),
    },

    /* HOW PLAYER GOT OUT */

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
    },

    /* WHICH BOWLERS DISMISSED HIM */

    dismissedBy: {
      type: Map,

      of: {
        total: {
          type: Number,
          default: 0,
        },

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
      },

      default: {},
    },
  },
  { _id: false },
);

/* =========================================
   BOWLING
========================================= */

const BowlingSchema = new mongoose.Schema(
  {
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

    /* BEST BOWLING */

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

        default: null,
      },
    },

    /* WICKET TYPES */

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

    /* WICKET HAULS */

    wicketHauls: {
      w3: {
        type: Number,
        default: 0,
      },

      w4: {
        type: Number,
        default: 0,
      },

      w5: {
        type: Number,
        default: 0,
      },
    },

    /* WHICH BATTERS HE DISMISSED */

    dismissedBatters: {
      type: Map,

      of: {
        total: {
          type: Number,
          default: 0,
        },

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

      default: {},
    },
  },
  { _id: false },
);

/* =========================================
   FIELDING
========================================= */

const FieldingSchema = new mongoose.Schema(
  {
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
  { _id: false },
);

/* =========================================
   ACHIEVEMENTS
========================================= */

const AchievementSchema = new mongoose.Schema(
  {
    mom: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

/* =========================================
   MAIN SCHEMA
========================================= */

const PlayerSeasonStatsSchema = new mongoose.Schema(
  {
    seasonId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Season",

      required: true,
    },

    name: {
      type: String,

      required: true,

      trim: true,

      lowercase: true,
    },

    totalMatches: {
      type: Number,

      default: 0,
    },

    batting: {
      type: BattingSchema,

      default: () => ({}),
    },

    bowling: {
      type: BowlingSchema,

      default: () => ({}),
    },

    fielding: {
      type: FieldingSchema,

      default: () => ({}),
    },

    achievements: {
      type: AchievementSchema,

      default: () => ({}),
    },
  },
  {
    timestamps: true,
  },
);

/* =========================================
   UNIQUE
========================================= */

PlayerSeasonStatsSchema.index(
  {
    seasonId: 1,
    name: 1,
  },
  {
    unique: true,
  },
);

/* =========================================
   LEADERBOARDS
========================================= */

PlayerSeasonStatsSchema.index({
  seasonId: 1,
  "batting.runs": -1,
});

PlayerSeasonStatsSchema.index({
  seasonId: 1,
  "bowling.wickets": -1,
});

PlayerSeasonStatsSchema.index({
  seasonId: 1,
  "fielding.catches": -1,
});

PlayerSeasonStatsSchema.index({
  seasonId: 1,
  "achievements.mom": -1,
});

/* ========================================= */

const PlayerSeasonStats =
  mongoose.models.PlayerSeasonStats ||
  mongoose.model("PlayerSeasonStats", PlayerSeasonStatsSchema);

export default PlayerSeasonStats;
