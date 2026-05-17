import { createAccumulators } from "./shared/bulkAccumulator.js";

import { flushAccumulators } from "./shared/bulkFlusher.js";

import { processTeamStats } from "./processTeamStats.service.js";

import { processBatting } from "./processBatting.service.js";

import { processBowling } from "./processBowling.service.js";

import { processFielding } from "./processFielding.service.js";

import { processPlayerProfiles } from "./processPlayerProfile.service.js";

import { invalidateMatchCaches } from "../stats/cache.service.js";

import { processBallAnalytics } from "./processBallAnalytics.service.js";

import { processRivalries } from "./processRivalries.service.js";

/* ======================================================
   PROCESS MATCH
====================================================== */

export const processCompletedMatch = async (match, state) => {
  /* =========================================
       CREATE ACCUMULATORS
    ========================================= */

  const accumulators = createAccumulators();

  /* =========================================
       PROCESSORS
    ========================================= */

  console.log("Processing Team Stats................");
  await processTeamStats(match, state, accumulators);
  console.log("Team Stats Processed Successfully");

  console.log("Processing Batting................");
  await processBatting(match, state, accumulators);
  console.log("Batting Processed Successfully");

  console.log("Processing Bowling................");
  await processBowling(match, state, accumulators);
  console.log("Bowling Processed Successfully");

  console.log("Processing Fielding................");
  await processFielding(match, state, accumulators);
  console.log("Fielding Processed Successfully");

  console.log("Processing Player Profiles................");
  await processPlayerProfiles(match, state, accumulators);
  console.log("Player Profiles Processed Successfu lly");

  console.log("Processing Ball Analytics................");
  await processBallAnalytics(match, state, accumulators);
  console.log("Ball Analytics Processed Successfully");

  console.log("Processing Player Rivalries................");
  await processRivalries(match, state, accumulators);
  console.log("Player Rivalries Processed Successfully");

  /* =========================================
       FLUSH DATABASE
    ========================================= */
  console.log("Flushing Accumulators................");
  await flushAccumulators(accumulators);
  console.log("Accumulators Flushed Successfully");

  /* =========================================
       INVALIDATE CACHE
    ========================================= */
  console.log("Invalidating Caches................");

  await invalidateMatchCaches(match);

  return true;
};
