import { getPlayerStatsAccumulator } from "./shared/accumulatorHelpers.js";

import {
  dismissalKey,
  getRunBucket,
  updateTopList,
  ballsToOvers,
} from "./shared/helpers.js";

/* ======================================================
   PROCESS PLAYER STATS
====================================================== */

export const processPlayerStats = async (match, accumulators) => {
  const seasonId = match.seasonId;

  const matchId = match._id;

  const winnerTeamId = match.result?.winnerTeamId;

  const manOfTheMatchId = match.result?.manOfTheMatchId;

  /*
   * Used to avoid duplicate match counting
   */

  const processedPlayers = new Set();

  /*
   * Used to build exactly one
   * recent performance per player
   */

  const recentPerformanceMap = new Map();

  /* =========================================
       INNINGS LOOP
    ========================================= */

  for (const innings of match.innings) {
    const battingTeamId = innings.battingTeamId;

    const bowlingTeamId = innings.bowlingTeamId;

    const battingWon = String(battingTeamId) === String(winnerTeamId);

    const bowlingWon = String(bowlingTeamId) === String(winnerTeamId);

    /* =========================================
         BATTING STATS
      ========================================= */

    for (const [playerId, batting] of Object.entries(
      innings.battingStats || {},
    )) {
      const overallPlayer = getPlayerStatsAccumulator({
        map: accumulators.overallPlayerStats,

        key: String(playerId),

        payload: {
          playerId,
        },
      });

      const seasonPlayer = getPlayerStatsAccumulator({
        map: accumulators.seasonPlayerStats,

        key: `${seasonId}_${playerId}`,

        payload: {
          seasonId,

          playerId,
        },
      });

      /* =========================================
           MATCH COUNTS
        ========================================= */

      if (!processedPlayers.has(String(playerId))) {
        processedPlayers.add(String(playerId));

        overallPlayer.totalMatches += 1;

        seasonPlayer.totalMatches += 1;

        if (battingWon) {
          overallPlayer.wins += 1;

          seasonPlayer.wins += 1;
        } else {
          overallPlayer.losses += 1;

          seasonPlayer.losses += 1;
        }
      }

      const runs = batting.runs || 0;

      const balls = batting.balls || 0;

      const fours = batting.fours || 0;

      const sixes = batting.sixes || 0;

      const dismissal = batting.dismissal;

      const isOut = dismissal && dismissal.type !== "NOT_OUT";

      /* =========================================
           UPDATE BATTING
        ========================================= */

      for (const player of [overallPlayer, seasonPlayer]) {
        player.batting.innings += 1;

        player.batting.runs += runs;

        player.batting.balls += balls;

        player.batting.fours += fours;

        player.batting.sixes += sixes;

        /* =========================================
             OUTS
          ========================================= */

        if (isOut) {
          player.batting.outs += 1;

          const key = dismissalKey(dismissal.type);

          if (key && player.batting.dismissalTypes[key] !== undefined) {
            player.batting.dismissalTypes[key] += 1;
          }

          /* =========================================
               MINI RIVALRY
            ========================================= */

          if (dismissal?.bowlerId) {
            player.batting.mostDismissedBy = updateTopList(
              player.batting.mostDismissedBy,
              dismissal.bowlerId,
              dismissalKey(dismissal.type), // ← pass the type
            );
          }
        } else {
          player.batting.notOuts += 1;

          player.batting.dismissalTypes.notOut += 1;
        }

        /* =========================================
             DUCKS
          ========================================= */

        if (runs === 0 && isOut) {
          player.batting.ducks += 1;
        }

        /* =========================================
             MILESTONES
          ========================================= */

        if (runs >= 30) {
          player.batting.milestones.thirtyPlus += 1;
        }

        if (runs >= 50) {
          player.batting.milestones.fiftyPlus += 1;
        }

        if (runs >= 100) {
          player.batting.milestones.hundredPlus += 1;
        }

        /* =========================================
             HIGHEST SCORE
          ========================================= */

        if (runs > player.batting.highestScore.runs) {
          player.batting.highestScore = {
            runs,

            matchId,
          };
        }

        /* =========================================
             SCORE BUCKETS
          ========================================= */

        player.batting.scoreBuckets[getRunBucket(runs)] += 1;
      }

      /* =========================================
           MAN OF THE MATCH
        ========================================= */

      if (String(playerId) === String(manOfTheMatchId)) {
        overallPlayer.achievements.mom += 1;

        seasonPlayer.achievements.mom += 1;
      }

      /* =========================================
           RECENT PERFORMANCE
        ========================================= */

      if (!recentPerformanceMap.has(String(playerId))) {
        recentPerformanceMap.set(String(playerId), {
          matchId,

          playedFor: battingTeamId,

          opponent: bowlingTeamId,

          runs: 0,

          ballsFaced: 0,

          wickets: 0,

          ballsBowled: 0,

          oversBowled: 0,

          catches: 0,

          runOuts: 0,

          stumpings: 0,

          won: battingWon,

          mom: false,

          date: match.completedAt,
        });
      }

      const performance = recentPerformanceMap.get(String(playerId));

      performance.runs += runs;

      performance.ballsFaced += balls;

      if (String(playerId) === String(manOfTheMatchId)) {
        performance.mom = true;
      }
    }

    /* =========================================
         BOWLING STATS
      ========================================= */

    for (const [playerId, bowling] of Object.entries(
      innings.bowlingStats || {},
    )) {
      const overallPlayer = getPlayerStatsAccumulator({
        map: accumulators.overallPlayerStats,

        key: String(playerId),

        payload: {
          playerId,
        },
      });

      const seasonPlayer = getPlayerStatsAccumulator({
        map: accumulators.seasonPlayerStats,

        key: `${seasonId}_${playerId}`,

        payload: {
          seasonId,

          playerId,
        },
      });

      const wickets = bowling.wickets || 0;

      const runs = bowling.runs || 0;

      const balls = bowling.balls || 0;

      const maidens = bowling.maidens || 0;

      for (const player of [overallPlayer, seasonPlayer]) {
        player.bowling.innings += 1;

        player.bowling.wickets += wickets;

        player.bowling.runs += runs;

        player.bowling.balls += balls;

        player.bowling.maidens += maidens;

        /* =========================================
             WICKET HAULS
          ========================================= */

        if (wickets >= 3) {
          player.bowling.wicketHauls.threeWickets += 1;
        }

        if (wickets >= 5) {
          player.bowling.wicketHauls.fiveWickets += 1;
        }

        /* =========================================
             BEST BOWLING
          ========================================= */

        if (
          wickets > player.bowling.bestBowling.wickets ||
          (wickets === player.bowling.bestBowling.wickets &&
            runs < player.bowling.bestBowling.runs)
        ) {
          player.bowling.bestBowling = {
            wickets,

            runs,

            matchId,
          };
        }
      }

      /* =========================================
           RECENT PERFORMANCE
        ========================================= */

      if (!recentPerformanceMap.has(String(playerId))) {
        recentPerformanceMap.set(String(playerId), {
          matchId,

          playedFor: bowlingTeamId,

          opponent: battingTeamId,

          runs: 0,

          ballsFaced: 0,

          wickets: 0,

          ballsBowled: 0,

          oversBowled: 0,

          catches: 0,

          runOuts: 0,

          stumpings: 0,

          won: bowlingWon,

          mom: false,

          date: match.completedAt,
        });
      }

      const performance = recentPerformanceMap.get(String(playerId));

      performance.wickets += wickets;

      performance.ballsBowled += balls;

      performance.oversBowled = ballsToOvers(performance.ballsBowled);
    }

    /* =========================================
         FIELDING + MINI RIVALRIES
      ========================================= */

    for (const delivery of innings.ballByBall || []) {
      if (!delivery.isWicket || !delivery.wicket) {
        continue;
      }

      const helperId = delivery.wicket.helperId;

      const bowlerId = delivery.bowlerId;

      const batterId = delivery.wicket.outBatsmanId;

      /* =========================================
           MOST DISMISSED BATTERS
        ========================================= */

      if (bowlerId && batterId) {
        const dtype = dismissalKey(delivery.wicket.type);

        overallBowler.bowling.mostDismissedBatters = updateTopList(
          overallBowler.bowling.mostDismissedBatters,
          batterId,
          dtype, // ← pass dismissal type
        );

        seasonBowler.bowling.mostDismissedBatters = updateTopList(
          seasonBowler.bowling.mostDismissedBatters,
          batterId,
          dtype, // ← pass dismissal type
        );
      }

      /* =========================================
           FIELDING STATS
        ========================================= */

      if (!helperId) {
        continue;
      }

      const overallPlayer = getPlayerStatsAccumulator({
        map: accumulators.overallPlayerStats,

        key: String(helperId),

        payload: {
          playerId: helperId,
        },
      });

      const seasonPlayer = getPlayerStatsAccumulator({
        map: accumulators.seasonPlayerStats,

        key: `${seasonId}_${helperId}`,

        payload: {
          seasonId,

          playerId: helperId,
        },
      });

      for (const player of [overallPlayer, seasonPlayer]) {
        if (delivery.wicket.type === "CAUGHT") {
          player.fielding.catches += 1;
        }

        if (delivery.wicket.type === "STUMPED") {
          player.fielding.stumpings += 1;
        }

        if (delivery.wicket.type === "RUN_OUT") {
          player.fielding.runOuts += 1;
        }
      }

      /* =========================================
           RECENT PERFORMANCE
        ========================================= */

      const performance = recentPerformanceMap.get(String(helperId));

      if (!performance) {
        continue;
      }

      if (delivery.wicket.type === "CAUGHT") {
        performance.catches += 1;
      }

      if (delivery.wicket.type === "STUMPED") {
        performance.stumpings += 1;
      }

      if (delivery.wicket.type === "RUN_OUT") {
        performance.runOuts += 1;
      }
    }
  }

  /* =========================================
       RECENT PERFORMANCES
    ========================================= */

  for (const [playerId, performance] of recentPerformanceMap) {
    const overallPlayer = accumulators.overallPlayerStats.get(String(playerId));

    const seasonPlayer = accumulators.seasonPlayerStats.get(
      `${seasonId}_${playerId}`,
    );

    if (overallPlayer) {
      overallPlayer.recentPerformances.unshift(performance);

      overallPlayer.recentPerformances = overallPlayer.recentPerformances.slice(
        0,
        10000,
      );
    }

    if (seasonPlayer) {
      seasonPlayer.recentPerformances.unshift(performance);

      seasonPlayer.recentPerformances = seasonPlayer.recentPerformances.slice(
        0,
        10000,
      );
    }
  }
};
