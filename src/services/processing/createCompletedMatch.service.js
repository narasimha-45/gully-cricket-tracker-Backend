import Match from "../../models/match.model.js";

import Season from "../../models/season.model.js";

import { resolveTeams } from "../../resolvers/resolveTeams.js";

import { resolvePlayers } from "../../resolvers/resolvePlayers.js";

import { normalizeCompletedMatch } from "./normalizeCompletedMatch.js";

import { processCompletedMatch } from "./processCompletedMatch.service.js";
import PlayerProfile from "../../models/PlayerProfile.js";
import { syncTeamPlayers } from "./syncTeamPlayers.js";

/* ======================================================
   CREATE COMPLETED MATCH
====================================================== */

export const createCompletedMatch = async (rawMatch) => {
  /* =========================================
     RESOLVE TEAMS
  ========================================= */

  console.log("Match Received",rawMatch);

  const teamMap = await resolveTeams(rawMatch);
  /* =========================================
     RESOLVE PLAYERS
  ========================================= */

  const playerMap = await resolvePlayers(rawMatch);

  /* =========================================
   SYNC TEAM PLAYERS
========================================= */

  await syncTeamPlayers({
    rawMatch,
    teamMap,
    playerMap,
  });
  /* =========================================
     NORMALIZE MATCH
  ========================================= */

  const normalizedMatch = await normalizeCompletedMatch({
    rawMatch,
    teamMap,
    playerMap,
  });

  /* =========================================
     CREATE MATCH
  ========================================= */

  const createdMatch = await Match.create(normalizedMatch);

  /* =========================================
     UPDATE SEASON MATCH COUNT
  ========================================= */

  await Season.updateOne(
    {
      _id: rawMatch.seasonId,
    },
    {
      $inc: {
        matchesCount: 1,
      },
    },
  );

  /* =========================================
     PROCESS ANALYTICS
  ========================================= */

  await processCompletedMatch(createdMatch.toObject());

  /* =========================================
     RETURN MATCH
  ========================================= */

  return createdMatch;
};
