import {
  normalizeName,
  getScoreBucket,
  normalizeDismissalType,
  incrementMapValue,
  incrementNestedValue,
} from "./shared/helpers.js";

import { createEmptyStats } from "./shared/statsFactory.js";

/* ======================================================
   PROCESS BATTING
====================================================== */

export const processBatting = async (match, state, accumulators) => {
  const processedPlayers = new Set();

  for (const innings of match.innings || []) {
    const battingTeam = innings.battingTeam;

    const bowlingTeam = innings.bowlingTeam;

    /* =====================================
         BATTERS
      ===================================== */

    for (const [rawName, batter] of Object.entries(
      innings.battingStats || {},
    )) {
      const name = normalizeName(rawName);

      const runs = batter.runs || 0;

      const balls = batter.balls || 0;

      const fours = batter.fours || 0;

      const sixes = batter.sixes || 0;

      const dismissal = batter.dismissal || null;

      const isOut = !!dismissal;

      const didBat = runs > 0 || balls > 0;

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
           TOTAL MATCHES
        =================================== */

      if (!processedPlayers.has(name)) {
        processedPlayers.add(name);

        overallStats.totalMatches += 1;

        seasonStats.totalMatches += 1;
      }

      /* ===================================
           UPDATE BOTH STATS
        =================================== */

      for (const stats of [overallStats, seasonStats]) {
        /* INNINGS */

        if (didBat) {
          stats.batting.innings += 1;
        }

        /* RUNS */

        stats.batting.runs += runs;

        stats.batting.balls += balls;

        stats.batting.fours += fours;

        stats.batting.sixes += sixes;

        /* OUTS */

        if (isOut) {
          stats.batting.outs += 1;
        } else {
          stats.batting.notOuts += 1;
        }

        /* DUCKS */

        if (didBat && isOut && runs === 0) {
          stats.batting.ducks += 1;
        }

        /* SCORE RANGE */

        if (didBat) {
          const bucket = getScoreBucket(runs);

          stats.batting.scoreRanges[bucket] += 1;
        }

        /* HIGH SCORE */

        if (runs > stats.batting.highestScore.runs) {
          stats.batting.highestScore = {
            runs,

            matchId: match._id,

            seasonId: match.seasonId,
          };
        }

        /* DISMISSAL TYPE */

        if (dismissal?.type) {
          const key = normalizeDismissalType(dismissal.type);

          if (key && stats.batting.dismissalTypes[key] !== undefined) {
            stats.batting.dismissalTypes[key] += 1;
          }
        }

        /* DISMISSED BY */

        if (dismissal?.bowler && dismissal?.type && dismissal.type !== "RUN_OUT") {
          incrementNestedValue(
            stats.batting.dismissedBy,
            normalizeName(dismissal.bowler),
            normalizeDismissalType(dismissal.type) || "other",
          );
        }
      }

      /* ===================================
           MATCH PERFORMANCE
        =================================== */

      const performanceKey = `${name}_${match._id}`;

      accumulators.matchPerformances.set(performanceKey, {
        updateOne: {
          filter: {
            name,
            matchId: match._id,
          },

          update: {
            $set: {
              seasonId: match.seasonId,

              matchDate: match.createdAt,

              playedFor: battingTeam,

              opponent: bowlingTeam,

              batting: {
                played: true,

                innings: didBat,

                runs,

                balls,

                fours,

                sixes,

                dismissal: dismissal || {
                  type: "NOT_OUT",
                },
              },
            },
          },

          upsert: true,
        },
      });
    }
  }

  /* =========================================
       BUILD BULK OPERATIONS
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
