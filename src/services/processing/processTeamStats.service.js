import Team from "../../models/team.model.js";

/* ======================================================
   PROCESS TEAM STATS
====================================================== */

export const processTeamStats = async (match, state, accumulators) => {
  /* =========================================
       LOAD TEAMS
    ========================================= */

  let teamA = state.teamsMap.get(match.teams.teamA.name);

  let teamB = state.teamsMap.get(match.teams.teamB.name);

  if (!teamA || !teamB) {
    throw new Error("Teams missing in preload state");
  }

  /* =========================================
       MATCH PLAYED
    ========================================= */

  teamA.stats.played += 1;

  teamB.stats.played += 1;

  /* =========================================
       PROCESS INNINGS
    ========================================= */

  for (const innings of match.innings || []) {
    const battingTeam = innings.battingTeam === teamA.name ? teamA : teamB;

    const bowlingTeam = innings.bowlingTeam === teamA.name ? teamA : teamB;

    const runs = innings.totalRuns || 0;

    const wickets = innings.wickets || 0;

    const balls = innings.balls || 0;

    /* =====================================
         BATTING TOTALS
      ===================================== */

    battingTeam.stats.runsScored += runs;

    battingTeam.stats.wicketsLost += wickets;

    battingTeam.stats.ballsFaced += balls;

    /* =====================================
         BOWLING TOTALS
      ===================================== */

    bowlingTeam.stats.runsConceded += runs;

    bowlingTeam.stats.wicketsTaken += wickets;

    bowlingTeam.stats.ballsBowled += balls;

    /* =====================================
         HIGHEST SCORE
      ===================================== */

    if (runs > battingTeam.stats.highestScore.runs) {
      battingTeam.stats.highestScore = {
        runs,

        wickets,

        matchId: match._id,
      };
    }

    /* =====================================
         LOWEST SCORE
      ===================================== */

    const currentLowest = battingTeam.stats.lowestScore;

    if (currentLowest.runs === null || runs < currentLowest.runs) {
      battingTeam.stats.lowestScore = {
        runs,

        wickets,

        matchId: match._id,
      };
    }
  }

  /* =========================================
       RESULT
    ========================================= */

  const winner = match.result?.winner;

  /* =====================================
       TIE
    ===================================== */

  if (!winner || winner === "TIED") {
    teamA.stats.ties += 1;

    teamB.stats.ties += 1;

    teamA.stats.points += 1;

    teamB.stats.points += 1;
  } else {
    /* =====================================
       WIN / LOSS
    ===================================== */
    const winningTeam = winner === teamA.name ? teamA : teamB;

    const losingTeam = winner === teamA.name ? teamB : teamA;

    winningTeam.stats.wins += 1;

    losingTeam.stats.losses += 1;

    winningTeam.stats.points += 2;

    /* ===================================
         BIGGEST WIN
      =================================== */

    if (match.result.margin > winningTeam.stats.biggestWin.margin) {
      winningTeam.stats.biggestWin = {
        margin: match.result.margin,

        type: match.result.type,

        matchId: match._id,
      };
    }
    /* ===================================
     DEFENDED / CHASE RECORDS
=================================== */

    const firstInnings = match.innings?.[0];

    const secondInnings = match.innings?.[1];

    if (firstInnings && secondInnings) {
      const firstBattingTeam =
        firstInnings.battingTeam === teamA.name ? teamA : teamB;

      const secondBattingTeam =
        secondInnings.battingTeam === teamA.name ? teamA : teamB;

      const firstRuns = firstInnings.totalRuns || 0;

      const firstWickets = firstInnings.wickets || 0;

      const secondRuns = secondInnings.totalRuns || 0;

      const secondWickets = secondInnings.wickets || 0;

      /* ===================================
       SUCCESSFUL DEFENCE
    =================================== */

      if (winningTeam._id.equals(firstBattingTeam._id)) {
        /* HIGHEST TOTAL DEFENDED */

        if (firstRuns > winningTeam.stats.highestTotalDefended.runs) {
          winningTeam.stats.highestTotalDefended = {
            runs: firstRuns,

            wickets: firstWickets,

            againstTeamId: losingTeam._id,

            matchId: match._id,
          };
        }

        /* LOWEST TOTAL DEFENDED */

        if (
          winningTeam.stats.lowestTotalDefended.runs === null ||
          firstRuns < winningTeam.stats.lowestTotalDefended.runs
        ) {
          winningTeam.stats.lowestTotalDefended = {
            runs: firstRuns,

            wickets: firstWickets,

            againstTeamId: losingTeam._id,

            matchId: match._id,
          };
        }
      }

      /* ===================================
       SUCCESSFUL CHASE
    =================================== */

      if (winningTeam._id.equals(secondBattingTeam._id)) {
        const totalBalls = (match.matchConfig?.overs || 0) * 6;

        const ballsUsed = secondInnings.balls || 0;

        const ballsRemaining = Math.max(totalBalls - ballsUsed, 0);

        /* HIGHEST SUCCESSFUL CHASE */

        if (secondRuns > winningTeam.stats.highestSuccessfulChase.runs) {
          winningTeam.stats.highestSuccessfulChase = {
            runs: secondRuns,

            wickets: secondWickets,

            ballsRemaining,

            againstTeamId: losingTeam._id,

            matchId: match._id,
          };
        }

        /* LOWEST SUCCESSFUL CHASE */

        if (
          winningTeam.stats.lowestSuccessfulChase.runs === null ||
          secondRuns < winningTeam.stats.lowestSuccessfulChase.runs
        ) {
          winningTeam.stats.lowestSuccessfulChase = {
            runs: secondRuns,

            wickets: secondWickets,

            ballsRemaining,

            againstTeamId: losingTeam._id,

            matchId: match._id,
          };
        }
      }
    }
  }

  /* =========================================
       BUILD BULK OPS
    ========================================= */

  accumulators.teams.set(teamA._id.toString(), {
    updateOne: {
      filter: {
        _id: teamA._id,
      },

      update: {
        $set: teamA,
      },
    },
  });

  accumulators.teams.set(teamB._id.toString(), {
    updateOne: {
      filter: {
        _id: teamB._id,
      },

      update: {
        $set: teamB,
      },
    },
  });

  return true;
};
