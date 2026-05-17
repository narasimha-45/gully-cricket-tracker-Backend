import {
  normalizeName,
  normalizeDismissalType,
  incrementMapValue,
  incrementNestedValue,
} from "./shared/helpers.js";

import { createEmptyStats } from "./shared/statsFactory.js";

/* ======================================================
   PROCESS BOWLING
====================================================== */

export const processBowling = async (match, state, accumulators) => {
  const processedPlayers = new Set();

  // Exclude Super Over innings from individual bowling stats
  const inningsToProcess = (match.innings || []).filter((inn) => !inn.isSuperOver);

  for (const innings of inningsToProcess) {
    const battingTeam = innings.battingTeam;

    const bowlingTeam = innings.bowlingTeam;

    /* =====================================
         BOWLERS
      ===================================== */

    for (const [rawName, bowler] of Object.entries(
      innings.bowlingStats || {},
    )) {
      const name = normalizeName(rawName);

      const balls = bowler.balls || 0;

      const runs = bowler.runs || 0;

      const wickets = bowler.wickets || 0;

      const maidens = bowler.maidens || 0;

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
           DISMISSAL ANALYTICS & WICKET COUNT
        =================================== */

      let actualWickets = 0;
      const bowlingBreakdown = [];

      for (const [batterRaw, dismissal] of Object.entries(
        innings.dismissals || {},
      )) {
        if (!dismissal) continue;

        const dismissalBowler = normalizeName(dismissal.bowler);

        /* ONLY THIS BOWLER */
        if (dismissalBowler !== name) continue;

        /* RUN OUTS DONT COUNT FOR BOWLER */
        if (dismissal.type === "RUN_OUT") continue;

        actualWickets += 1;

        const key = normalizeDismissalType(dismissal.type);

        for (const stats of [overallStats, seasonStats]) {
          /* WICKET TYPE */
          if (key && stats.bowling.wicketTypes[key] !== undefined) {
            stats.bowling.wicketTypes[key] += 1;
          }

          /* DISMISSED BATTERS */
          incrementNestedValue(
            stats.bowling.dismissedBatters,
            normalizeName(batterRaw),
            key || "other",
          );
        }

        bowlingBreakdown.push({
          name: normalizeName(batterRaw),
          type: dismissal.type,
        });
      }

      /* ===================================
           UPDATE BOTH STATS
        =================================== */

      for (const stats of [overallStats, seasonStats]) {
        /* INNINGS */
        if (balls > 0) {
          stats.bowling.innings += 1;
        }

        /* BASIC */
        stats.bowling.balls += balls;
        stats.bowling.runs += runs;
        stats.bowling.wickets += actualWickets; // Use our calculated count
        stats.bowling.maidens += maidens;

        /* BEST BOWLING */
        const currentBest = stats.bowling.bestBowling;
        const shouldReplace =
          actualWickets > currentBest.wickets ||
          (actualWickets === currentBest.wickets && runs < currentBest.runs);

        if (shouldReplace) {
          stats.bowling.bestBowling = {
            wickets: actualWickets,
            runs,
            matchId: match._id,
            seasonId: match.seasonId,
          };
        }

        /* WICKET HAULS */
        if (actualWickets >= 3) stats.bowling.wicketHauls.w3 += 1;
        if (actualWickets >= 4) stats.bowling.wicketHauls.w4 += 1;
        if (actualWickets >= 5) stats.bowling.wicketHauls.w5 += 1;
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

            $set: {
              ...(existing?.updateOne?.update?.$set || {}),

              seasonId: match.seasonId,

              matchDate: match.createdAt,

              playedFor: bowlingTeam,

              opponent: battingTeam,

              bowling: {
                bowled: balls > 0,
                balls,
                maidens,
                runs,
                wickets: actualWickets,
                dismissedBatters: bowlingBreakdown,
              },
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
