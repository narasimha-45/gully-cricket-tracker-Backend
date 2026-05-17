import OverallPlayerStats from "../../../models/OverallPlayerStats.js";

import PlayerSeasonStats from "../../../models/PlayerSeasonStats.js";

import PlayerMatchPerformance from "../../../models/PlayerMatchPerformance.js";

import PlayerProfile from "../../../models/PlayerProfile.js";

import TeamProfile from "../../../models/TeamProfile.js";

import OverallTeamStats from "../../../models/OverallTeamStats.js";

import TeamSeasonStats from "../../../models/TeamSeasonStats.js";

/* ======================================================
   BULK FLUSH
====================================================== */

export const flushAccumulators = async (accumulators) => {
  /* =========================================
       PLAYER OVERALL STATS
    ========================================= */

  if (accumulators.overallStats.size > 0) {
    await OverallPlayerStats.bulkWrite(
      Array.from(accumulators.overallStats.values()),
    );
  }

  /* =========================================
       PLAYER SEASON STATS
    ========================================= */

  if (accumulators.seasonStats.size > 0) {
    await PlayerSeasonStats.bulkWrite(
      Array.from(accumulators.seasonStats.values()),
    );
  }

  /* =========================================
       PLAYER MATCH PERFORMANCE
    ========================================= */

  if (accumulators.matchPerformances.size > 0) {
    await PlayerMatchPerformance.bulkWrite(
      Array.from(accumulators.matchPerformances.values()),
    );
  }

  /* =========================================
       PLAYER PROFILES
    ========================================= */

  if (accumulators.playerProfiles.size > 0) {
    await PlayerProfile.bulkWrite(
      Array.from(accumulators.playerProfiles.values()),
    );
  }

  /* =========================================
       TEAM PROFILES
    ========================================= */

  if (accumulators.teamProfiles.size > 0) {
    await TeamProfile.bulkWrite(Array.from(accumulators.teamProfiles.values()));
  }

  /* =========================================
       OVERALL TEAM STATS
    ========================================= */

  if (accumulators.overallTeamStats.size > 0) {
    await OverallTeamStats.bulkWrite(
      Array.from(accumulators.overallTeamStats.values()),
    );
  }

  /* =========================================
       SEASON TEAM STATS
    ========================================= */

  if (accumulators.seasonTeamStats.size > 0) {
    await TeamSeasonStats.bulkWrite(
      Array.from(accumulators.seasonTeamStats.values()),
    );
  }
};
