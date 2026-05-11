/* ======================================================
   BULK ACCUMULATORS
====================================================== */

export const createAccumulators = () => {
  return {
    overallStats: new Map(),

    seasonStats: new Map(),

    matchPerformances: new Map(),

    playerProfiles: new Map(),

    teams: new Map(),
  };
};
