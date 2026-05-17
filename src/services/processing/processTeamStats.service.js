
/* ======================================================
   HELPERS
====================================================== */

const normalize = (v) =>
  v?.trim()?.toLowerCase?.() || "";

/* ======================================================
   PROCESS TEAM STATS
====================================================== */

export const processTeamStats = async (
  match,
  state,
  accumulators,
) => {
  const teamAName =
    normalize(match.teams.teamA.name);

  const teamBName =
    normalize(match.teams.teamB.name);

  /* =========================================
     LOAD TEAM DOCUMENTS
  ========================================= */

  let teamAProfile =
    state.teamProfilesMap.get(teamAName);

  let teamBProfile =
    state.teamProfilesMap.get(teamBName);

  let teamAOverall =
    state.overallTeamStatsMap.get(teamAName);

  let teamBOverall =
    state.overallTeamStatsMap.get(teamBName);

  let teamASeason =
    state.seasonTeamStatsMap.get(
      `${match.seasonId}_${teamAName}`,
    );

  let teamBSeason =
    state.seasonTeamStatsMap.get(
      `${match.seasonId}_${teamBName}`,
    );

  /* =========================================
     CREATE IF MISSING
  ========================================= */

  if (!teamAProfile) {
    teamAProfile = {
      name: teamAName,

      seasonsPlayed: [],

      totalMatches: 0,

      lastMatchAt: null,
    };

    state.teamProfilesMap.set(
      teamAName,
      teamAProfile,
    );
  }

  if (!teamBProfile) {
    teamBProfile = {
      name: teamBName,

      seasonsPlayed: [],

      totalMatches: 0,

      lastMatchAt: null,
    };

    state.teamProfilesMap.set(
      teamBName,
      teamBProfile,
    );
  }

  function createStats() {
    return {
      played: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      noResults: 0,
      points: 0,

      runsScored: 0,
      wicketsLost: 0,
      ballsFaced: 0,

      runsConceded: 0,
      wicketsTaken: 0,
      ballsBowled: 0,

      foursScored: 0,
      sixesScored: 0,

      foursConceded: 0,
      sixesConceded: 0,

      dotBallsPlayed: 0,
      dotBallsBowled: 0,

      biggestWin: {
        margin: 0,
        type: null,
        matchId: null,
      },

      highestScore: {
        runs: 0,
        wickets: 0,
        overs: 0,
        matchId: null,
      },

      lowestScore: {
        runs: null,
        wickets: 0,
        overs: 0,
        matchId: null,
      },
    };
  }

  if (!teamAOverall) {
    teamAOverall = {
      name: teamAName,

      seasonsPlayed: [],

      stats: createStats(),
    };

    state.overallTeamStatsMap.set(
      teamAName,
      teamAOverall,
    );
  }

  if (!teamBOverall) {
    teamBOverall = {
      name: teamBName,

      seasonsPlayed: [],

      stats: createStats(),
    };

    state.overallTeamStatsMap.set(
      teamBName,
      teamBOverall,
    );
  }

  if (!teamASeason) {
    teamASeason = {
      seasonId: match.seasonId,

      name: teamAName,

      stats: createStats(),
    };

    state.seasonTeamStatsMap.set(
      `${match.seasonId}_${teamAName}`,
      teamASeason,
    );
  }

  if (!teamBSeason) {
    teamBSeason = {
      seasonId: match.seasonId,

      name: teamBName,

      stats: createStats(),
    };

    state.seasonTeamStatsMap.set(
      `${match.seasonId}_${teamBName}`,
      teamBSeason,
    );
  }

  /* =========================================
     PROFILE
  ========================================= */

  for (const profile of [
    teamAProfile,
    teamBProfile,
  ]) {
    profile.totalMatches += 1;

    profile.lastMatchAt =
      match.createdAt;

    const alreadyPlayed =
      profile.seasonsPlayed.some(
        (id) =>
          id.toString() ===
          match.seasonId.toString(),
      );

    if (!alreadyPlayed) {
      profile.seasonsPlayed.push(
        match.seasonId,
      );
    }
  }

  /* =========================================
     PLAYED
  ========================================= */

  for (const stats of [
    teamASeason,
    teamBSeason,
    teamAOverall,
    teamBOverall,
  ]) {
    stats.stats.played += 1;
  }

  /* =========================================
     MAIN INNINGS ONLY
  ========================================= */

  const mainInnings =
    (match.innings || []).filter(
      (inn) => !inn.isSuperOver,
    );

  for (const innings of mainInnings) {
    const battingSeason =
      normalize(
        innings.battingTeam,
      ) === teamAName
        ? teamASeason
        : teamBSeason;

    const bowlingSeason =
      normalize(
        innings.bowlingTeam,
      ) === teamAName
        ? teamASeason
        : teamBSeason;

    const battingOverall =
      normalize(
        innings.battingTeam,
      ) === teamAName
        ? teamAOverall
        : teamBOverall;

    const bowlingOverall =
      normalize(
        innings.bowlingTeam,
      ) === teamAName
        ? teamAOverall
        : teamBOverall;

    const runs =
      innings.totalRuns || 0;

    const wickets =
      innings.wickets || 0;

    const balls =
      innings.balls || 0;

    const overs =
      Math.floor(balls / 6) +
      (balls % 6) / 10;

    /* =====================================
       TOTALS
    ===================================== */

    for (const stats of [
      battingSeason,
      battingOverall,
    ]) {
      stats.stats.runsScored += runs;

      stats.stats.wicketsLost += wickets;

      stats.stats.ballsFaced += balls;

      if (
        runs >
        stats.stats.highestScore.runs
      ) {
        stats.stats.highestScore = {
          runs,
          wickets,
          overs,
          matchId: match._id,
        };
      }

      if (
        stats.stats.lowestScore.runs ===
          null ||
        runs <
          stats.stats.lowestScore.runs
      ) {
        stats.stats.lowestScore = {
          runs,
          wickets,
          overs,
          matchId: match._id,
        };
      }
    }

    for (const stats of [
      bowlingSeason,
      bowlingOverall,
    ]) {
      stats.stats.runsConceded += runs;

      stats.stats.wicketsTaken += wickets;

      stats.stats.ballsBowled += balls;
    }

    /* =====================================
       BALL BY BALL
    ===================================== */

    for (const ball of innings.ballByBall ||
      []) {
      const runs =
        Number(ball.runs || 0);

      const wides =
        Number(
          ball.extras?.wides || 0,
        );

      const noBalls =
        Number(
          ball.extras?.noBalls || 0,
        );

      const total =
        runs + wides + noBalls;

      const isLegal =
        wides === 0 &&
        noBalls === 0;

      if (runs === 4) {
        battingSeason.stats.foursScored += 1;
        battingOverall.stats.foursScored += 1;

        bowlingSeason.stats.foursConceded += 1;
        bowlingOverall.stats.foursConceded += 1;
      }

      if (runs === 6) {
        battingSeason.stats.sixesScored += 1;
        battingOverall.stats.sixesScored += 1;

        bowlingSeason.stats.sixesConceded += 1;
        bowlingOverall.stats.sixesConceded += 1;
      }

      if (isLegal && total === 0) {
        battingSeason.stats.dotBallsPlayed += 1;
        battingOverall.stats.dotBallsPlayed += 1;

        bowlingSeason.stats.dotBallsBowled += 1;
        bowlingOverall.stats.dotBallsBowled += 1;
      }
    }
  }

  /* =========================================
     RESULT
  ========================================= */

  const winner =
    normalize(
      match.result?.winner,
    );

  if (!winner || winner === "tied") {
    for (const stats of [
      teamASeason,
      teamBSeason,
      teamAOverall,
      teamBOverall,
    ]) {
      stats.stats.ties += 1;
    }

    teamASeason.stats.points += 1;
    teamBSeason.stats.points += 1;
  } else {
    const winningSeason =
      winner === teamAName
        ? teamASeason
        : teamBSeason;

    const losingSeason =
      winner === teamAName
        ? teamBSeason
        : teamASeason;

    const winningOverall =
      winner === teamAName
        ? teamAOverall
        : teamBOverall;

    const losingOverall =
      winner === teamAName
        ? teamBOverall
        : teamAOverall;

    for (const stats of [
      winningSeason,
      winningOverall,
    ]) {
      stats.stats.wins += 1;
    }

    for (const stats of [
      losingSeason,
      losingOverall,
    ]) {
      stats.stats.losses += 1;
    }

    winningSeason.stats.points += 2;

    if (
      match.result.margin >
      winningSeason.stats.biggestWin
        .margin
    ) {
      winningSeason.stats.biggestWin = {
        margin: match.result.margin,

        type: match.result.type,

        matchId: match._id,
      };
    }
  }

  /* =========================================
     BULK OPS
  ========================================= */

  accumulators.teamProfiles.set(
    teamAName,
    {
      updateOne: {
        filter: {
          name: teamAName,
        },

        update: {
          $set: teamAProfile,
        },

        upsert: true,
      },
    },
  );

  accumulators.teamProfiles.set(
    teamBName,
    {
      updateOne: {
        filter: {
          name: teamBName,
        },

        update: {
          $set: teamBProfile,
        },

        upsert: true,
      },
    },
  );

  accumulators.overallTeamStats.set(
    teamAName,
    {
      updateOne: {
        filter: {
          name: teamAName,
        },

        update: {
          $set: teamAOverall,
        },

        upsert: true,
      },
    },
  );

  accumulators.overallTeamStats.set(
    teamBName,
    {
      updateOne: {
        filter: {
          name: teamBName,
        },

        update: {
          $set: teamBOverall,
        },

        upsert: true,
      },
    },
  );

  accumulators.seasonTeamStats.set(
    `${match.seasonId}_${teamAName}`,
    {
      updateOne: {
        filter: {
          seasonId:
            match.seasonId,

          name: teamAName,
        },

        update: {
          $set: teamASeason,
        },

        upsert: true,
      },
    },
  );

  accumulators.seasonTeamStats.set(
    `${match.seasonId}_${teamBName}`,
    {
      updateOne: {
        filter: {
          seasonId:
            match.seasonId,

          name: teamBName,
        },

        update: {
          $set: teamBSeason,
        },

        upsert: true,
      },
    },
  );

  return true;
};
