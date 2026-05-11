import OverallPlayerStats
  from "../../../models/OverallPlayerStats.js";

import PlayerSeasonStats
  from "../../../models/PlayerSeasonStats.js";

import PlayerProfile
  from "../../../models/PlayerProfile.js";

import Team
  from "../../../models/team.model.js";

/* ======================================================
   PRELOAD MATCH STATE
====================================================== */

export const preloadMatchState =
  async (match) => {
    const playerNames =
      new Set();

    /* =========================================
       COLLECT PLAYERS
    ========================================= */

    for (const innings of match.innings ||
      []) {
      /* BATTERS */

      Object.keys(
        innings.battingStats || {}
      ).forEach((name) =>
        playerNames.add(
          name
            .trim()
            .toLowerCase()
        )
      );

      /* BOWLERS */

      Object.keys(
        innings.bowlingStats || {}
      ).forEach((name) =>
        playerNames.add(
          name
            .trim()
            .toLowerCase()
        )
      );

      /* FIELDERS */

      Object.values(
        innings.dismissals || {}
      ).forEach((dismissal) => {
        if (
          dismissal?.fielder
        ) {
          playerNames.add(
            dismissal.fielder
              .trim()
              .toLowerCase()
          );
        }
      });
    }

    const names =
      Array.from(playerNames);

    /* =========================================
       LOAD ALL DATA
    ========================================= */

    const [
      overallStats,
      seasonStats,
      playerProfiles,
      teams,
    ] = await Promise.all([
      OverallPlayerStats.find({
        name: {
          $in: names,
        },
      }),

      PlayerSeasonStats.find({
        seasonId:
          match.seasonId,

        name: {
          $in: names,
        },
      }),

      PlayerProfile.find({
        name: {
          $in: names,
        },
      }),

      Team.find({
        seasonId:
          match.seasonId,
      }),
    ]);

    /* =========================================
       MAPS
    ========================================= */

    return {
      overallStatsMap:
        new Map(
          overallStats.map(
            (doc) => [
              doc.name,
              doc,
            ]
          )
        ),

      seasonStatsMap:
        new Map(
          seasonStats.map(
            (doc) => [
              doc.name,
              doc,
            ]
          )
        ),

      playerProfilesMap:
        new Map(
          playerProfiles.map(
            (doc) => [
              doc.name,
              doc,
            ]
          )
        ),

      teamsMap: new Map(
        teams.map((doc) => [
          doc.name,
          doc,
        ])
      ),
    };
  };
