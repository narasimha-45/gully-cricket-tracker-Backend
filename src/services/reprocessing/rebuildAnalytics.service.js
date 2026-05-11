import Match from "../../models/match.model.js";

import OverallPlayerStats from "../../models/OverallPlayerStats.js";

import PlayerSeasonStats from "../../models/PlayerSeasonStats.js";

import PlayerMatchPerformance from "../../models/PlayerMatchPerformance.js";

import PlayerProfile from "../../models/PlayerProfile.js";

import Team from "../../models/team.model.js";

import { processCompletedMatch } from "../processing/processCompletedMatch.service.js";

/* ======================================================
   RESET TEAM STATS
====================================================== */

const resetTeamStats = async () => {
  const teams = await Team.find({});

  for (const team of teams) {
    team.stats = {
      played: 0,

      wins: 0,

      losses: 0,

      ties: 0,

      points: 0,

      runsScored: 0,

      runsConceded: 0,

      wicketsLost: 0,

      wicketsTaken: 0,

      ballsFaced: 0,

      ballsBowled: 0,

      highestScore: {
        runs: 0,

        wickets: 0,

        matchId: null,
      },

      lowestScore: {
        runs: null,

        wickets: null,

        matchId: null,
      },

      biggestWin: {
        margin: 0,

        type: null,

        matchId: null,
      },
    };

    await team.save();
  }
};

/* ======================================================
   REBUILD ANALYTICS
====================================================== */

export const rebuildAnalytics = async () => {
  console.log("Starting analytics rebuild...");

  /* =========================================
       CLEAR DERIVED COLLECTIONS
    ========================================= */

  await Promise.all([
    OverallPlayerStats.deleteMany({}),

    PlayerSeasonStats.deleteMany({}),

    PlayerMatchPerformance.deleteMany({}),

    PlayerProfile.deleteMany({}),
  ]);

  console.log("Derived collections cleared");

  /* =========================================
       RESET TEAM STATS
    ========================================= */

  await resetTeamStats();

  console.log("Team stats reset");

  /* =========================================
       LOAD MATCHES
    ========================================= */

  const matches = await Match.find({
    status: "COMPLETED",
  }).sort({
    createdAt: 1,
  });

  console.log(`Found ${matches.length} matches`);

  /* =========================================
       REPROCESS
    ========================================= */

  let processed = 0;

  for (const match of matches) {
    try {
      await processCompletedMatch(match);

      processed += 1;

      console.log(`Processed ${processed}/${matches.length}`);
    } catch (err) {
      console.error(`Failed match ${match._id}`, err);
    }
  }

  console.log("Analytics rebuild completed");

  return {
    success: true,

    processedMatches: processed,

    totalMatches: matches.length,
  };
};
