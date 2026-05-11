import { createAccumulators } from "./shared/bulkAccumulator.js";

import { flushAccumulators } from "./shared/bulkFlusher.js";

import { processTeamStats } from "./processTeamStats.service.js";

import { processBatting } from "./processBatting.service.js";

import { processBowling } from "./processBowling.service.js";

import { processFielding } from "./processFielding.service.js";

import { processPlayerProfiles } from "./processPlayerProfile.service.js";

import { invalidateMatchCaches } from "../stats/cache.service.js";

/* ======================================================
   PROCESS MATCH
====================================================== */

export const processCompletedMatch = async (match) => {
  /* =========================================
       CREATE ACCUMULATORS
    ========================================= */

  const accumulators = createAccumulators();

  /* =========================================
       PROCESSORS
    ========================================= */

  await processTeamStats(match, accumulators);

  await processBatting(match, accumulators);

  await processBowling(match, accumulators);

  await processFielding(match, accumulators);

  await processPlayerProfiles(match, accumulators);

  /* =========================================
       FLUSH DATABASE
    ========================================= */

  await flushAccumulators(accumulators);

  /* =========================================
       INVALIDATE CACHE
    ========================================= */

  await invalidateMatchCaches(match);

  return true;
};
