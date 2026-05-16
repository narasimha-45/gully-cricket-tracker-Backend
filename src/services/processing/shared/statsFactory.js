import { createScoreArray } from "./helpers.js";

/* ======================================================
   CREATE EMPTY STATS
====================================================== */

export const createEmptyStats = () => {
  return {
    totalMatches: 0,

    batting: {
      innings: 0,
      outs: 0,
      notOuts: 0,

      runs: 0,
      balls: 0,

      fours: 0,
      sixes: 0,

      ducks: 0,

      highestScore: {
        runs: 0,
        matchId: null,
        seasonId: null,
      },

      scoreRanges: createScoreArray(),

      dismissalTypes: {
        bowled: 0,
        caught: 0,
        lbw: 0,
        runOut: 0,
        stumped: 0,
        hitWicket: 0,
      },

      dismissedBy: {},
    },

    bowling: {
      innings: 0,

      balls: 0,
      runs: 0,
      wickets: 0,
      maidens: 0,

      bestBowling: {
        wickets: 0,
        runs: 999,
        matchId: null,
        seasonId: null,
      },

      wicketTypes: {
        bowled: 0,
        caught: 0,
        lbw: 0,
        stumped: 0,
        hitWicket: 0,
      },

      wicketHauls: {
        w3: 0,
        w4: 0,
        w5: 0,
      },

      dismissedBatters: {},
    },

    fielding: {
      catches: 0,
      runOuts: 0,
      stumpings: 0,
    },

    achievements: {
      mom: 0,
    },
  };
};
