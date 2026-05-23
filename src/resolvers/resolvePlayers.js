import PlayerProfile from "../models/PlayerProfile.js";

/* ======================================================
   NORMALIZE
====================================================== */

const normalize = (value = "") =>
  value.trim().toLowerCase();

/* ======================================================
   EXTRACT PLAYERS
====================================================== */

const extractPlayersFromMatch = (rawMatch) => {
  const players = [];

  const teamAPlayers =
    rawMatch?.teams?.teamA?.players || [];

  const teamBPlayers =
    rawMatch?.teams?.teamB?.players || [];

  players.push(...teamAPlayers);
  players.push(...teamBPlayers);

  return [...new Set(players.map(normalize))];
};

/* ======================================================
   RESOLVE PLAYERS
====================================================== */

export const resolvePlayers = async (rawMatch) => {
  const playerNames =
    extractPlayersFromMatch(rawMatch);

  /* =========================================
     FETCH EXISTING PLAYERS
  ========================================= */

  const existingPlayers = await PlayerProfile.find({
    name: {
      $in: playerNames,
    },
  });

  const playerMap = new Map();

  for (const player of existingPlayers) {
    playerMap.set(player.name, player);
  }

  /* =========================================
     CREATE MISSING PLAYERS
  ========================================= */

  const missingPlayerNames = playerNames.filter(
    (playerName) => !playerMap.has(playerName)
  );

  if (missingPlayerNames.length > 0) {
    const createdPlayers =
      await PlayerProfile.insertMany(
        missingPlayerNames.map((playerName) => ({
          name: playerName,
          displayName: playerName,
        }))
      );

    for (const player of createdPlayers) {
      playerMap.set(player.name, player);
    }
  }

  /* =========================================
     RETURN PLAYER MAP
  ========================================= */

  return playerMap;
};