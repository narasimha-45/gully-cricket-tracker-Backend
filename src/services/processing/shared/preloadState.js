import OverallPlayerStats from "../../../models/OverallPlayerStats.js";

import PlayerSeasonStats from "../../../models/SeasonPlayerStats.js";

import PlayerProfile from "../../../models/PlayerProfile.js";

import TeamProfile from "../../../models/TeamProfile.js";

import OverallTeamStats from "../../../models/OverallTeamStats.js";

import TeamSeasonStats from "../../../models/SeasonTeamStats.js";

/* ======================================================
   HELPERS
====================================================== */

const normalize = (v) => v?.trim()?.toLowerCase?.() || "";

/* ======================================================
   PRELOAD MATCH STATE
====================================================== */

export const preloadMatchState = async (match) => {
  const playerNames = new Set();

  const teamNames = new Set();

  /* =========================================
       COLLECT TEAMS
    ========================================= */

  teamNames.add(normalize(match.teams.teamA.name));

  teamNames.add(normalize(match.teams.teamB.name));

  /* =========================================
       COLLECT PLAYERS
    ========================================= */

  for (const innings of match.innings || []) {
    /* BATTERS */

    Object.keys(innings.battingStats || {}).forEach((name) =>
      playerNames.add(normalize(name)),
    );

    /* BOWLERS */

    Object.keys(innings.bowlingStats || {}).forEach((name) =>
      playerNames.add(normalize(name)),
    );

    /* FIELDERS */

    Object.values(innings.dismissals || {}).forEach((dismissal) => {
      if (dismissal?.fielder) {
        playerNames.add(normalize(dismissal.fielder));
      }
    });
  }

  const names = Array.from(playerNames);

  const teams = Array.from(teamNames);

  /* =========================================
       LOAD ALL DATA
    ========================================= */

  const [
    overallStats,
    seasonStats,
    playerProfiles,

    teamProfiles,
    overallTeamStats,
    seasonTeamStats,
  ] = await Promise.all([
    /* PLAYERS */

    OverallPlayerStats.find({
      name: {
        $in: names,
      },
    }),

    PlayerSeasonStats.find({
      seasonId: match.seasonId,

      name: {
        $in: names,
      },
    }),

    PlayerProfile.find({
      name: {
        $in: names,
      },
    }),

    /* TEAMS */

    TeamProfile.find({
      name: {
        $in: teams,
      },
    }),

    OverallTeamStats.find({
      name: {
        $in: teams,
      },
    }),

    TeamSeasonStats.find({
      seasonId: match.seasonId,

      name: {
        $in: teams,
      },
    }),
  ]);

  /* =========================================
       MAPS
    ========================================= */

  return {
    /* PLAYERS */

    overallStatsMap: new Map(overallStats.map((doc) => [doc.name, doc])),

    seasonStatsMap: new Map(seasonStats.map((doc) => [doc.name, doc])),

    playerProfilesMap: new Map(playerProfiles.map((doc) => [doc.name, doc])),

    /* TEAMS */

    teamProfilesMap: new Map(teamProfiles.map((doc) => [doc.name, doc])),

    overallTeamStatsMap: new Map(
      overallTeamStats.map((doc) => [doc.name, doc]),
    ),

    seasonTeamStatsMap: new Map(
      seasonTeamStats.map((doc) => [`${doc.seasonId}_${doc.name}`, doc]),
    ),
  };
};
