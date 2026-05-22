/* ======================================================
   DEFAULT MATCH REF
====================================================== */

export const defaultMatchRef =
  () => ({
    count: 0,

    recentMatches: [],
  });

/* ======================================================
   DEFAULT TEAM STATS
====================================================== */

export const defaultTeamStats =
  () => ({
    played: 0,

    wins: 0,

    losses: 0,

    ties: 0,

    noResults: 0,

    points: 0,

    /* =========================================
       MATCH RESULTS
    ========================================= */

    wonBattingFirst:
      defaultMatchRef(),

    lostBattingFirst:
      defaultMatchRef(),

    wonBowlingFirst:
      defaultMatchRef(),

    lostBowlingFirst:
      defaultMatchRef(),

    successfulChases:
      defaultMatchRef(),

    failedChases:
      defaultMatchRef(),

    defendedTotals:
      defaultMatchRef(),

    failedDefends:
      defaultMatchRef(),

    /* =========================================
       TEAM TOTALS
    ========================================= */

    runsScored: 0,

    wicketsLost: 0,

    ballsFaced: 0,

    runsConceded: 0,

    wicketsTaken: 0,

    ballsBowled: 0,

    /* =========================================
       RECORDS
    ========================================= */

    biggestWins: {
      byRuns: {
        margin: 0,

        matchId: null,
      },

      byWickets: {
        margin: 0,

        matchId: null,
      },
    },

    highestScore: {
      runs: 0,

      wickets: 0,

      balls: 0,

      matchId: null,
    },

    lowestScore: {
      runs: null,

      wickets: 0,

      balls: 0,

      matchId: null,
    },

    highestSuccessfulChase:
      {
        target: 0,

        achieved: 0,

        matchId: null,
      },

    lowestDefendedScore: {
      defended: 0,

      matchId: null,
    },
  });

/* ======================================================
   DEFAULT PLAYER STATS
====================================================== */

export const defaultPlayerStats =
  () => ({
    totalMatches: 0,

    wins: 0,

    losses: 0,

    ties: 0,

    noResults: 0,

    recentPerformances:
      [],

    /* =========================================
       BATTING
    ========================================= */

    batting: {
      innings: 0,

      outs: 0,

      notOuts: 0,

      runs: 0,

      balls: 0,

      fours: 0,

      sixes: 0,

      ducks: 0,

      scoreBuckets:
        Array(10).fill(0),

      highestScore: {
        runs: 0,

        matchId: null,
      },

      milestones: {
        thirtyPlus: 0,

        fiftyPlus: 0,

        hundredPlus: 0,
      },

      dismissalTypes: {
        bowled: 0,

        caught: 0,

        lbw: 0,

        runOut: 0,

        stumped: 0,

        hitWicket: 0,

        notOut: 0,
      },

      mostDismissedBy:
        [],
    },

    /* =========================================
       BOWLING
    ========================================= */

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
      },

      wicketTypes: {
        bowled: 0,

        caught: 0,

        lbw: 0,

        stumped: 0,

        hitWicket: 0,
      },

      wicketHauls: {
        threeWickets: 0,

        fiveWickets: 0,
      },

      mostDismissedBatters:
        [],
    },

    /* =========================================
       FIELDING
    ========================================= */

    fielding: {
      catches: 0,

      stumpings: 0,

      runOuts: 0,
    },

    /* =========================================
       ACHIEVEMENTS
    ========================================= */

    achievements: {
      mom: 0,
    },
  });

/* ======================================================
   DEFAULT PLAYER SPLIT
====================================================== */

export const defaultPlayerSplit =
  () => ({
    matches: 0,

    innings: 0,

    runs: 0,

    balls: 0,

    outs: 0,

    wickets: 0,

    fours: 0,

    sixes: 0,
  });

/* ======================================================
   DEFAULT PLAYER SPLITS
====================================================== */

export const defaultPlayerSplits =
  () => ({
    battingPosition:
      {},

    byOpponent: {},

    byTeam: {},

    battingInnings: [],

    bowlingInnings: [],

    byMatchResult:
      {},
  });

/* ======================================================
   DEFAULT RIVALRY
====================================================== */

export const defaultRivalry =
  () => ({
    balls: 0,

    runs: 0,

    wickets: 0,

    fours: 0,

    sixes: 0,

    dismissals: {
      bowled: 0,

      caught: 0,

      lbw: 0,

      runOut: 0,

      stumped: 0,

      hitWicket: 0,
    },
  });

/* ======================================================
   DEFAULT PARTNERSHIP AGGREGATE
====================================================== */

export const defaultPartnershipAggregate =
  () => ({
    innings: 0,

    runs: 0,

    balls: 0,

    fours: 0,

    sixes: 0,

    wins: 0,

    losses: 0,

    highest: {
      runs: 0,

      matchId: null,
    },
  });