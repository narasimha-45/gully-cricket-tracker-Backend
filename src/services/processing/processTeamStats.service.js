import {
  getTeamStatsAccumulator,
} from "./shared/accumulatorHelpers.js";

import {
  pushRecentMatch,
} from "./shared/helpers.js";

/* ======================================================
   PROCESS TEAM STATS
====================================================== */

export const processTeamStats = async (
  match,
  accumulators
) => {
  const seasonId =
    match.seasonId;

  const matchId =
    match._id;

  const winnerTeamId =
    match.result?.winnerTeamId;

  const teamAId =
    match.teams.teamA.teamId;

  const teamBId =
    match.teams.teamB.teamId;

  /* =========================================
     GET TEAM ACCUMULATORS
  ========================================= */

  const overallTeamA =
    getTeamStatsAccumulator({
      map:
        accumulators.overallTeamStats,

      key: String(teamAId),

      payload: {
        teamId: teamAId,
      },
    });

  const overallTeamB =
    getTeamStatsAccumulator({
      map:
        accumulators.overallTeamStats,

      key: String(teamBId),

      payload: {
        teamId: teamBId,
      },
    });

  const seasonTeamA =
    getTeamStatsAccumulator({
      map:
        accumulators.seasonTeamStats,

      key:
        `${seasonId}_${teamAId}`,

      payload: {
        seasonId,
        teamId: teamAId,
      },
    });

  const seasonTeamB =
    getTeamStatsAccumulator({
      map:
        accumulators.seasonTeamStats,

      key:
        `${seasonId}_${teamBId}`,

      payload: {
        seasonId,
        teamId: teamBId,
      },
    });

  const allTeams = [
    overallTeamA,
    overallTeamB,
    seasonTeamA,
    seasonTeamB,
  ];

  /* =========================================
     MATCH COUNTS
  ========================================= */

  for (const team of allTeams) {
    team.stats.played += 1;
  }

  /* =========================================
     MATCH RESULTS
  ========================================= */

  if (
    String(winnerTeamId) ===
    String(teamAId)
  ) {
    overallTeamA.stats.wins += 1;

    seasonTeamA.stats.wins += 1;

    overallTeamB.stats.losses += 1;

    seasonTeamB.stats.losses += 1;

    overallTeamA.stats.points += 2;

    seasonTeamA.stats.points += 2;
  } else if (
    String(winnerTeamId) ===
    String(teamBId)
  ) {
    overallTeamB.stats.wins += 1;

    seasonTeamB.stats.wins += 1;

    overallTeamA.stats.losses += 1;

    seasonTeamA.stats.losses += 1;

    overallTeamB.stats.points += 2;

    seasonTeamB.stats.points += 2;
  } else {
    for (const team of allTeams) {
      team.stats.ties += 1;

      team.stats.points += 1;
    }
  }

  /* =========================================
     INNINGS PROCESSING
  ========================================= */

  for (const innings of match.innings) {
    const battingTeamId =
      innings.battingTeamId;

    const bowlingTeamId =
      innings.bowlingTeamId;

    const battingOverall =
      String(battingTeamId) ===
      String(teamAId)
        ? overallTeamA
        : overallTeamB;

    const battingSeason =
      String(battingTeamId) ===
      String(teamAId)
        ? seasonTeamA
        : seasonTeamB;

    const bowlingOverall =
      String(bowlingTeamId) ===
      String(teamAId)
        ? overallTeamA
        : overallTeamB;

    const bowlingSeason =
      String(bowlingTeamId) ===
      String(teamAId)
        ? seasonTeamA
        : seasonTeamB;

    /* =========================================
       TEAM TOTALS
    ========================================= */

    for (const team of [
      battingOverall,
      battingSeason,
    ]) {
      team.stats.runsScored +=
        innings.totalRuns || 0;

      team.stats.wicketsLost +=
        innings.wickets || 0;

      team.stats.ballsFaced +=
        innings.balls || 0;
    }

    for (const team of [
      bowlingOverall,
      bowlingSeason,
    ]) {
      team.stats.runsConceded +=
        innings.totalRuns || 0;

      team.stats.wicketsTaken +=
        innings.wickets || 0;

      team.stats.ballsBowled +=
        innings.balls || 0;
    }

    /* =========================================
       HIGHEST SCORE
    ========================================= */

    for (const team of [
      battingOverall,
      battingSeason,
    ]) {
      if (
        innings.totalRuns >
        team.stats.highestScore
          .runs
      ) {
        team.stats.highestScore = {
          runs:
            innings.totalRuns,

          wickets:
            innings.wickets,

          balls:
            innings.balls,

          matchId,
        };
      }
    }

    /* =========================================
       LOWEST SCORE
    ========================================= */

    for (const team of [
      battingOverall,
      battingSeason,
    ]) {
      if (
        team.stats.lowestScore
          .runs === null ||
        innings.totalRuns <
          team.stats.lowestScore
            .runs
      ) {
        team.stats.lowestScore = {
          runs:
            innings.totalRuns,

          wickets:
            innings.wickets,

          balls:
            innings.balls,

          matchId,
        };
      }
    }
  }

  /* =========================================
     CHASE / DEFEND
  ========================================= */

  if (
    match.innings.length >= 2
  ) {
    const firstInnings =
      match.innings[0];

    const secondInnings =
      match.innings[1];

    const firstBattingWon =
      String(
        firstInnings.battingTeamId
      ) ===
      String(winnerTeamId);

    const secondBattingWon =
      String(
        secondInnings.battingTeamId
      ) ===
      String(winnerTeamId);

    const firstOverall =
      String(
        firstInnings.battingTeamId
      ) === String(teamAId)
        ? overallTeamA
        : overallTeamB;

    const firstSeason =
      String(
        firstInnings.battingTeamId
      ) === String(teamAId)
        ? seasonTeamA
        : seasonTeamB;

    const secondOverall =
      String(
        secondInnings.battingTeamId
      ) === String(teamAId)
        ? overallTeamA
        : overallTeamB;

    const secondSeason =
      String(
        secondInnings.battingTeamId
      ) === String(teamAId)
        ? seasonTeamA
        : seasonTeamB;

    /* =========================================
       DEFENDED TOTAL
    ========================================= */

    if (firstBattingWon) {
      for (const team of [
        firstOverall,
        firstSeason,
      ]) {
        pushRecentMatch(
          team.stats.wonBattingFirst,
          matchId
        );

        pushRecentMatch(
          team.stats.defendedTotals,
          matchId
        );
      }

      for (const team of [
        secondOverall,
        secondSeason,
      ]) {
        pushRecentMatch(
          team.stats.lostBowlingFirst,
          matchId
        );

        pushRecentMatch(
          team.stats.failedChases,
          matchId
        );
      }
    }

    /* =========================================
       SUCCESSFUL CHASE
    ========================================= */

    if (secondBattingWon) {
      for (const team of [
        secondOverall,
        secondSeason,
      ]) {
        pushRecentMatch(
          team.stats.wonBowlingFirst,
          matchId
        );

        pushRecentMatch(
          team.stats.successfulChases,
          matchId
        );
      }

      for (const team of [
        firstOverall,
        firstSeason,
      ]) {
        pushRecentMatch(
          team.stats.lostBattingFirst,
          matchId
        );

        pushRecentMatch(
          team.stats.failedDefends,
          matchId
        );
      }
    }

    /* =========================================
       HIGHEST SUCCESSFUL CHASE
    ========================================= */

    if (secondBattingWon) {
      const target =
        firstInnings.totalRuns + 1;

      const achieved =
        secondInnings.totalRuns;

      for (const team of [
        secondOverall,
        secondSeason,
      ]) {
        if (
          target >
          team.stats
            .highestSuccessfulChase
            .target
        ) {
          team.stats.highestSuccessfulChase =
            {
              target,
              achieved,
              matchId,
            };
        }
      }
    }

    /* =========================================
       LOWEST DEFENDED SCORE
    ========================================= */

    if (firstBattingWon) {
      const defended =
        firstInnings.totalRuns;

      for (const team of [
        firstOverall,
        firstSeason,
      ]) {
        if (
          team.stats
            .lowestDefendedScore
            .defended === 0 ||
          defended <
            team.stats
              .lowestDefendedScore
              .defended
        ) {
          team.stats.lowestDefendedScore =
            {
              defended,
              matchId,
            };
        }
      }
    }

    /* =========================================
       BIGGEST WIN BY RUNS
    ========================================= */

    if (firstBattingWon) {
      const margin =
        firstInnings.totalRuns -
        secondInnings.totalRuns;

      for (const team of [
        firstOverall,
        firstSeason,
      ]) {
        if (
          margin >
          team.stats.biggestWins
            .byRuns.margin
        ) {
          team.stats.biggestWins.byRuns =
            {
              margin,
              matchId,
            };
        }
      }
    }

    /* =========================================
       BIGGEST WIN BY WICKETS
    ========================================= */

    if (secondBattingWon) {
      const margin =
        10 -
        secondInnings.wickets;

      for (const team of [
        secondOverall,
        secondSeason,
      ]) {
        if (
          margin >
          team.stats.biggestWins
            .byWickets.margin
        ) {
          team.stats.biggestWins.byWickets =
            {
              margin,
              matchId,
            };
        }
      }
    }
  }
};