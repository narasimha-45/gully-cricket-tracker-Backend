import OverallPlayerStats from "../../../models/OverallPlayerStats.js";

import SeasonPlayerStats from "../../../models/SeasonPlayerStats.js";

import OverallTeamStats from "../../../models/OverallTeamStats.js";

import SeasonTeamStats from "../../../models/SeasonTeamStats.js";

import OverallPlayerRivalry from "../../../models/OverallPlayerRivalry.js";

import SeasonPlayerRivalry from "../../../models/SeasonPlayerRivalry.js";

import OverallPlayerSplits from "../../../models/OverallPlayerSplits.js";

import SeasonPlayerSplits from "../../../models/SeasonPlayerSplits.js";

import OverallPartnershipAggregate from "../../../models/OverallPartnershipAggregate.js";

import SeasonPartnershipAggregate from "../../../models/SeasonPartnershipAggregate.js";

import PartnershipInnings from "../../../models/PartnershipInnings.js";

/* ======================================================
   SAFE BULK OPS BUILDER
====================================================== */

const buildBulkOps = ({ documents, filterBuilder, label }) => {
  if (!documents || !(documents instanceof Map)) {
    return [];
  }

  const operations = [];

  for (const document of documents.values()) {
    try {
      /*
       * Validate document exists
       */

      if (!document) {
        console.log(`[${label}] Skipping undefined document`);

        continue;
      }

      /*
       * Build filter
       */

      const filter = filterBuilder(document);

      /*
       * Defensive filter validation
       */

      const hasUndefined = Object.values(filter).some(
        (value) => value === undefined || value === null,
      );

      if (hasUndefined) {
        console.log(`[${label}] Invalid filter`, filter);

        console.log(`[${label}] Document`, JSON.stringify(document, null, 2));

        continue;
      }

      operations.push({
        updateOne: {
          filter,

          update: {
            $set: document,
          },

          upsert: true,
        },
      });
    } catch (err) {
      console.log(`[${label}] Failed building bulk op`);

      console.log(err);

      console.log(JSON.stringify(document, null, 2));
    }
  }

  return operations;
};

/* ======================================================
   SAFE BULK WRITE
====================================================== */

const safeBulkWrite = async ({ model, operations, label }) => {
  if (!operations.length) {
    return;
  }

  try {
    await model.bulkWrite(operations);

    console.log(`[${label}] Flushed ${operations.length} docs`);
  } catch (err) {
    console.log(`[${label}] Bulk Write Failed`);

    console.log(err);

    throw err;
  }
};

/* ======================================================
   FLUSH ACCUMULATORS
====================================================== */

export const flushAccumulators = async (accumulators) => {
  /* =========================================
       BUILD OPERATIONS
    ========================================= */

  const overallPlayerStatsOps = buildBulkOps({
    documents: accumulators.overallPlayerStats,

    label: "OVERALL_PLAYER_STATS",

    filterBuilder: (document) => ({
      playerId: document.playerId,
    }),
  });

  const seasonPlayerStatsOps = buildBulkOps({
    documents: accumulators.seasonPlayerStats,

    label: "SEASON_PLAYER_STATS",

    filterBuilder: (document) => ({
      seasonId: document.seasonId,

      playerId: document.playerId,
    }),
  });

  const overallTeamStatsOps = buildBulkOps({
    documents: accumulators.overallTeamStats,

    label: "OVERALL_TEAM_STATS",

    filterBuilder: (document) => ({
      teamId: document.teamId,
    }),
  });

  const seasonTeamStatsOps = buildBulkOps({
    documents: accumulators.seasonTeamStats,

    label: "SEASON_TEAM_STATS",

    filterBuilder: (document) => ({
      seasonId: document.seasonId,

      teamId: document.teamId,
    }),
  });

  const overallRivalriesOps = buildBulkOps({
    documents: accumulators.overallPlayerRivalries,

    label: "OVERALL_RIVALRIES",

    filterBuilder: (document) => ({
      batterId: document.batterId,

      bowlerId: document.bowlerId,
    }),
  });

  const seasonRivalriesOps = buildBulkOps({
    documents: accumulators.seasonPlayerRivalries,

    label: "SEASON_RIVALRIES",

    filterBuilder: (document) => ({
      seasonId: document.seasonId,

      batterId: document.batterId,

      bowlerId: document.bowlerId,
    }),
  });

  const overallPlayerSplitsOps = buildBulkOps({
    documents: accumulators.overallPlayerSplits,

    label: "OVERALL_PLAYER_SPLITS",

    filterBuilder: (document) => ({
      playerId: document.playerId,
    }),
  });

  const seasonPlayerSplitsOps = buildBulkOps({
    documents: accumulators.seasonPlayerSplits,

    label: "SEASON_PLAYER_SPLITS",

    filterBuilder: (document) => ({
      seasonId: document.seasonId,

      playerId: document.playerId,
    }),
  });

  const overallPartnershipOps = buildBulkOps({
    documents: accumulators.overallPartnerships,

    label: "OVERALL_PARTNERSHIPS",

    filterBuilder: (document) => ({
      player1Id: document.player1Id,

      player2Id: document.player2Id,
    }),
  });

  const seasonPartnershipOps = buildBulkOps({
    documents: accumulators.seasonPartnerships,

    label: "SEASON_PARTNERSHIPS",

    filterBuilder: (document) => ({
      seasonId: document.seasonId,

      player1Id: document.player1Id,

      player2Id: document.player2Id,
    }),
  });

  /* =========================================
       EXECUTE WRITES
    ========================================= */

  await Promise.all([
    safeBulkWrite({
      model: OverallPlayerStats,

      operations: overallPlayerStatsOps,

      label: "OVERALL_PLAYER_STATS",
    }),

    safeBulkWrite({
      model: SeasonPlayerStats,

      operations: seasonPlayerStatsOps,

      label: "SEASON_PLAYER_STATS",
    }),

    safeBulkWrite({
      model: OverallTeamStats,

      operations: overallTeamStatsOps,

      label: "OVERALL_TEAM_STATS",
    }),

    safeBulkWrite({
      model: SeasonTeamStats,

      operations: seasonTeamStatsOps,

      label: "SEASON_TEAM_STATS",
    }),

    safeBulkWrite({
      model: OverallPlayerRivalry,

      operations: overallRivalriesOps,

      label: "OVERALL_RIVALRIES",
    }),

    safeBulkWrite({
      model: SeasonPlayerRivalry,

      operations: seasonRivalriesOps,

      label: "SEASON_RIVALRIES",
    }),

    safeBulkWrite({
      model: OverallPlayerSplits,

      operations: overallPlayerSplitsOps,

      label: "OVERALL_PLAYER_SPLITS",
    }),

    safeBulkWrite({
      model: SeasonPlayerSplits,

      operations: seasonPlayerSplitsOps,

      label: "SEASON_PLAYER_SPLITS",
    }),

    safeBulkWrite({
      model: OverallPartnershipAggregate,

      operations: overallPartnershipOps,

      label: "OVERALL_PARTNERSHIPS",
    }),

    safeBulkWrite({
      model: SeasonPartnershipAggregate,

      operations: seasonPartnershipOps,

      label: "SEASON_PARTNERSHIPS",
    }),

    accumulators.partnershipInnings?.length
      ? PartnershipInnings.insertMany(accumulators.partnershipInnings)
      : Promise.resolve(),
  ]);
};
