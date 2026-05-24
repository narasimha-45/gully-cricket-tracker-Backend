import PlayerProfile from "../../models/PlayerProfile.js";

import TeamProfile from "../../models/TeamProfile.js";

import Season from "../../models/season.model.js";

import OverallTeamStats from "../../models/OverallTeamStats.js";

import OverallPlayerStats from "../../models/OverallPlayerStats.js";

/* ======================================================
   GLOBAL SEARCH
====================================================== */

export const globalSearch = async (q) => {
  /* ======================================
     VALIDATION
  ====================================== */

  if (!q?.trim()) {
    return {
      players: [],
      teams: [],
      seasons: [],
    };
  }

  const regex = new RegExp(q.trim(), "i");

  /* ======================================
     PARALLEL SEARCH
  ====================================== */

  const [players, teams, seasons] = await Promise.all([
    /* ----------------------------------
       PLAYERS
    ---------------------------------- */

    PlayerProfile.find({
      $or: [
        {
          name: regex,
        },

        {
          displayName: regex,
        },
      ],
    })
      .limit(5)
      .lean(),

    /* ----------------------------------
       TEAMS
    ---------------------------------- */

    TeamProfile.find({
      name: regex,
    })
      .limit(5)
      .lean(),

    /* ----------------------------------
       SEASONS
    ---------------------------------- */

    Season.find({
      $or: [
        {
          seasonName: regex,
        },

        {
          shortName: regex,
        },
      ],
    })
      .limit(5)
      .lean(),
  ]);

  /* ======================================
     TEAM STATS
  ====================================== */

  const teamStats = await OverallTeamStats.find({
    teamId: {
      $in: teams.map((t) => t._id),
    },
  }).lean();

  const teamStatsMap = new Map();

  for (const stats of teamStats) {
    teamStatsMap.set(String(stats.teamId), stats);
  }

  /* ======================================
     PLAYER STATS
  ====================================== */

  const playerStats = await OverallPlayerStats.find({
    playerId: {
      $in: players.map((p) => p._id),
    },
  }).lean();

  const playerStatsMap = new Map();

  for (const stats of playerStats) {
    playerStatsMap.set(String(stats.playerId), stats);
  }

  /* ======================================
     FORMAT PLAYERS
  ====================================== */

  const formattedPlayers = players.map((player) => {
    const stats = playerStatsMap.get(String(player._id));

    return {
      playerId: player._id,

      name: player.displayName || player.name,

      displayName: player.displayName,

      totalMatches: stats?.stats?.matches || player.totalMatches || 0,

      runs: stats?.batting?.runs || 0,

      wickets: stats?.bowling?.wickets || 0,

      teamsPlayedFor: player.teamsPlayedFor || [],

      seasonsPlayed: player.seasonsPlayed || [],
    };
  });

  /* ======================================
     FORMAT TEAMS
  ====================================== */

  const formattedTeams = teams.map((team) => {
    const stats = teamStatsMap.get(String(team._id));

    return {
      teamId: team._id,

      name: team.name,

      totalMatches: stats?.stats?.played || team.totalMatches || 0,

      wins: stats?.stats?.wins || 0,

      losses: stats?.stats?.losses || 0,

      points: stats?.stats?.points || 0,

      seasonsPlayed: team.seasonsPlayed || [],
    };
  });

  /* ======================================
     FORMAT SEASONS
  ====================================== */

  /* ======================================
   FORMAT SEASONS
====================================== */

  const formattedSeasons = seasons.map((season) => ({
    seasonId: season._id,

    name: season.seasonName,

    shortName: season.shortName,

    matchesCount: season.matchesCount || 0,

    status: season.status,
  }));

  /* ======================================
     RESPONSE
  ====================================== */

  return {
    players: formattedPlayers,

    teams: formattedTeams,

    seasons: formattedSeasons,
  };
};
