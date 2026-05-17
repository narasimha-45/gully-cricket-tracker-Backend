import { normalizeName } from "./shared/helpers.js";

import { createEmptyStats } from "./shared/statsFactory.js";

/* ======================================================
   PROCESS FIELDING
====================================================== */

export const processFielding = async (match, state, accumulators) => {
  // Exclude Super Over innings from fielding stats
  const inningsToProcess = (match.innings || []).filter((inn) => !inn.isSuperOver);

  for (const innings of inningsToProcess) {
    for (const dismissal of Object.values(innings.dismissals || {})) {
      /* ===================================
           INVALID
        =================================== */

      if (!dismissal) continue;

      /* ===================================
           NO FIELDER
        =================================== */

      if (!dismissal.fielder) {
        continue;
      }

      const name = normalizeName(dismissal.fielder);

      /* ===================================
           LOAD OR CREATE STATS
        =================================== */

      let overallStats = state.overallStatsMap.get(name);

      if (!overallStats) {
        overallStats = {
          name,

          ...createEmptyStats(),
        };

        state.overallStatsMap.set(name, overallStats);
      }

      let seasonStats = state.seasonStatsMap.get(name);

      if (!seasonStats) {
        seasonStats = {
          seasonId: match.seasonId,

          name,

          ...createEmptyStats(),
        };

        state.seasonStatsMap.set(name, seasonStats);
      }

      /* ===================================
           FIELDING EVENTS
        =================================== */

      for (const stats of [overallStats, seasonStats]) {
        switch (dismissal.type) {
          /* CATCH */

          case "CAUGHT":
            stats.fielding.catches += 1;

            break;

          /* RUN OUT */

          case "RUN_OUT":
            stats.fielding.runOuts += 1;

            break;

          /* STUMPING */

          case "STUMPED":
            stats.fielding.stumpings += 1;

            break;

          default:
            break;
        }
      }

      /* ===================================
           MATCH PERFORMANCE
        =================================== */

      const performanceKey = `${name}_${match._id}`;

      const existing = accumulators.matchPerformances.get(performanceKey);

      accumulators.matchPerformances.set(performanceKey, {
        updateOne: {
          filter: {
            name,
            matchId: match._id,
          },

          update: {
            ...(existing?.updateOne?.update || {}),

            $inc: {
              ...(existing?.updateOne?.update?.$inc || {}),

              "fielding.catches": dismissal.type === "CAUGHT" ? 1 : 0,

              "fielding.runOuts": dismissal.type === "RUN_OUT" ? 1 : 0,

              "fielding.stumpings": dismissal.type === "STUMPED" ? 1 : 0,
            },

            $set: {
              ...(existing?.updateOne?.update?.$set || {}),

              seasonId: match.seasonId,

              matchDate: match.createdAt,
            },
          },

          upsert: true,
        },
      });
    }
  }

  /* =========================================
       BUILD BULK OPS
    ========================================= */

  for (const [name, stats] of state.overallStatsMap.entries()) {
    accumulators.overallStats.set(name, {
      updateOne: {
        filter: { name },

        update: {
          $set: stats,
        },

        upsert: true,
      },
    });
  }

  for (const [name, stats] of state.seasonStatsMap.entries()) {
    accumulators.seasonStats.set(`${stats.seasonId}_${name}`, {
      updateOne: {
        filter: {
          seasonId: stats.seasonId,

          name,
        },

        update: {
          $set: stats,
        },

        upsert: true,
      },
    });
  }

  return true;
};
