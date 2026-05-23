export const createAccumulators =
  () => ({
    /* =========================================
       TEAM STATS
    ========================================= */

    overallTeamStats:
      new Map(),

    seasonTeamStats:
      new Map(),

    /* =========================================
       PLAYER STATS
    ========================================= */

    overallPlayerStats:
      new Map(),

    seasonPlayerStats:
      new Map(),

    /* =========================================
       PLAYER SPLITS
    ========================================= */

    overallPlayerSplits:
      new Map(),

    seasonPlayerSplits:
      new Map(),

    /* =========================================
       RIVALRIES
    ========================================= */

    overallPlayerRivalries:
      new Map(),

    seasonPlayerRivalries:
      new Map(),

    /* =========================================
       PARTNERSHIPS
    ========================================= */

    overallPartnerships:
      new Map(),

    seasonPartnerships:
      new Map(),

    /* =========================================
       PARTNERSHIP RECORDS
    ========================================= */

    partnershipInnings:
      [],
  });