import { normalizeName } from "./shared/helpers.js";

/* ======================================================
   PROCESS PLAYER PROFILES
====================================================== */

export const processPlayerProfiles = async (match, state, accumulators) => {
  const players = new Map();

  const manOfTheMatch = normalizeName(match.result?.manOfTheMatch);

  /* =========================================
       COLLECT PLAYERS
    ========================================= */

  for (const innings of match.innings || []) {
    /* =====================================
         BATTERS
      ===================================== */

    for (const batter of Object.keys(innings.battingStats || {})) {
      players.set(normalizeName(batter), innings.battingTeam);
    }

    /* =====================================
         BOWLERS
      ===================================== */

    for (const bowler of Object.keys(innings.bowlingStats || {})) {
      players.set(normalizeName(bowler), innings.bowlingTeam);
    }

    /* =====================================
         FIELDERS
      ===================================== */

    for (const dismissal of Object.values(innings.dismissals || {})) {
      if (dismissal?.fielder) {
        players.set(normalizeName(dismissal.fielder), innings.bowlingTeam);
      }
    }
  }

  /* =========================================
       PROCESS PLAYERS
    ========================================= */

  for (const [name, teamName] of players.entries()) {
    /* =====================================
         LOAD PROFILE
      ===================================== */

    let profile = state.playerProfilesMap.get(name);

    /* =====================================
         CREATE PROFILE
      ===================================== */

    if (!profile) {
      profile = {
        name,

        seasonsPlayed: [],

        teamsPlayedFor: [],

        debutSeasonId: match.seasonId,

        totalMatches: 0,

        lastMatchAt: null,
      };

      state.playerProfilesMap.set(name, profile);
    }

    /* =====================================
         TOTAL MATCHES
      ===================================== */

    profile.totalMatches += 1;

    /* =====================================
         SEASONS PLAYED
      ===================================== */

    const alreadyPlayedSeason = profile.seasonsPlayed.some(
      (id) => id.toString() === match.seasonId.toString(),
    );

    if (!alreadyPlayedSeason) {
      profile.seasonsPlayed.push(match.seasonId);
    }

    /* =====================================
         TEAMS PLAYED FOR
      ===================================== */

    if (!profile.teamsPlayedFor.includes(teamName)) {
      profile.teamsPlayedFor.push(teamName);
    }

    /* =====================================
         LAST MATCH
      ===================================== */

    profile.lastMatchAt = match.createdAt;

    /* =====================================
         MOM TRACKING
      ===================================== */

    if (manOfTheMatch === name) {
      const overallStats = state.overallStatsMap.get(name);

      const seasonStats = state.seasonStatsMap.get(name);

      if (overallStats) {
        overallStats.achievements.mom += 1;
      }

      if (seasonStats) {
        seasonStats.achievements.mom += 1;
      }
    }

    /* =====================================
         BUILD PROFILE BULK OP
      ===================================== */

    accumulators.playerProfiles.set(name, {
      updateOne: {
        filter: { name },

        update: {
          $set: profile,
        },

        upsert: true,
      },
    });
  }

  /* =========================================
       BULK OPS FOR STATS
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
