/* ======================================================
   CREATE ACCUMULATORS
====================================================== */

export const createAccumulators = () => {
  return {
    /* PLAYERS */

    overallStats: new Map(),

    seasonStats: new Map(),

    playerProfiles: new Map(),

    matchPerformances: new Map(),

    /* TEAMS */

    teamProfiles: new Map(),

    overallTeamStats: new Map(),

    seasonTeamStats: new Map(),
  };
};
