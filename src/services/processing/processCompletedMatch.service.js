import { createAccumulators } from "./shared/bulkAccumulator.js";

import { flushAccumulators } from "./shared/bulkFlusher.js";

import { processTeamStats } from "./processTeamStats.service.js";

import { processPlayerStats } from "./processPlayerStats.service.js";

import { processPlayerSplits } from "./processPlayerSplits.service.js";

import { processRivalries } from "./processRivalries.service.js";

import { processPartnershipAggregates } from "./processPartnershipAggregates.service.js";

import { processPartnershipRecords } from "./processPartnershipRecords.service.js";

import { processBallAnalytics } from "./processBallAnalytics.service.js";

import { invalidateMatchCaches } from "../stats/cache.service.js";

/* ======================================================
   PROCESS COMPLETED MATCH
====================================================== */

export const processCompletedMatch = async (
  match
) => {
  console.log("========================================");

  console.log("PROCESSING COMPLETED MATCH");

  console.log("========================================");

  /* =========================================
     CREATE ACCUMULATORS
  ========================================= */

  const accumulators =
    createAccumulators();
    
    
  /* =========================================
     PROCESS TEAM STATS
  ========================================= */

  console.log(
    "Processing Team Stats................"
  );

  await processTeamStats(
    match,
    accumulators
  );

  console.log(
    "Team Stats Processed Successfully"
  );

  /* =========================================
     PROCESS PLAYER STATS
  ========================================= */

  console.log(
    "Processing Player Stats................"
  );

  await processPlayerStats(
    match,
    accumulators
  );

  console.log(
    "Player Stats Processed Successfully"
  );

  /* =========================================
     PROCESS PLAYER SPLITS
  ========================================= */

  console.log(
    "Processing Player Splits................"
  );

  await processPlayerSplits(
    match,
    accumulators
  );

  console.log(
    "Player Splits Processed Successfully"
  );

  /* =========================================
     PROCESS RIVALRIES
  ========================================= */

  console.log(
    "Processing Rivalries................"
  );

  await processRivalries(
    match,
    accumulators
  );

  console.log(
    "Rivalries Processed Successfully"
  );

  /* =========================================
     PROCESS PARTNERSHIP AGGREGATES
  ========================================= */

  console.log(
    "Processing Partnership Aggregates................"
  );

  await processPartnershipAggregates(
    match,
    accumulators
  );

  console.log(
    "Partnership Aggregates Processed Successfully"
  );

  /* =========================================
     PROCESS PARTNERSHIP RECORDS
  ========================================= */

  console.log(
    "Processing Partnership Records................"
  );

  await processPartnershipRecords(
    match,
    accumulators
  );

  console.log(
    "Partnership Records Processed Successfully"
  );

  /* =========================================
     PROCESS BALL ANALYTICS
  ========================================= */

  const hasBallData = Boolean(
    match?.innings?.some(
      (innings) =>
        innings?.ballByBall?.length
    )
  );

  if (hasBallData) {
    console.log(
      "Processing Ball Analytics................"
    );

    await processBallAnalytics(
      match,
      accumulators
    );

    console.log(
      "Ball Analytics Processed Successfully"
    );
  }

  /* =========================================
     FLUSH DATABASE
  ========================================= */

  console.log(
    "Flushing Accumulators................"
  );

  await flushAccumulators(
    accumulators
  );

  console.log(
    "Accumulators Flushed Successfully"
  );

  /* =========================================
     INVALIDATE CACHE
  ========================================= */

  console.log(
    "Invalidating Match Caches................"
  );

  await invalidateMatchCaches(match);

  console.log(
    "Caches Invalidated Successfully"
  );

  console.log("========================================");

  console.log(
    "MATCH PROCESSING COMPLETED"
  );

  console.log("========================================");

  return true;
};