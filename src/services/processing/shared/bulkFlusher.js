import OverallPlayerStats from "../../../models/OverallPlayerStats.js";

import PlayerSeasonStats from "../../../models/PlayerSeasonStats.js";

import PlayerMatchPerformance from "../../../models/PlayerMatchPerformance.js";

import PlayerProfile from "../../../models/PlayerProfile.js";

import Team from "../../../models/team.model.js";

/* ======================================================
   BULK FLUSH
====================================================== */

export const flushAccumulators = async (accumulators) => {
  /* =========================================
       OVERALL STATS
    ========================================= */

  if (accumulators.overallStats.size > 0) {
    await OverallPlayerStats.bulkWrite(
      Array.from(accumulators.overallStats.values()),
    );
  }

  /* =========================================
       SEASON STATS
    ========================================= */

  if (accumulators.seasonStats.size > 0) {
    await PlayerSeasonStats.bulkWrite(
      Array.from(accumulators.seasonStats.values()),
    );
  }

  /* =========================================
       MATCH PERFORMANCE
    ========================================= */

  if (accumulators.matchPerformances.size > 0) {
    await PlayerMatchPerformance.bulkWrite(
      Array.from(accumulators.matchPerformances.values()),
    );
  }

  /* =========================================
       PLAYER PROFILE
    ========================================= */

  if (accumulators.playerProfiles.size > 0) {
    await PlayerProfile.bulkWrite(
      Array.from(accumulators.playerProfiles.values()),
    );
  }

  /* =========================================
       TEAMS
    ========================================= */

  if (accumulators.teams.size > 0) {
    await Team.bulkWrite(Array.from(accumulators.teams.values()));
  }
};
