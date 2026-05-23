import { getPlayerSplitsAccumulator } from "./shared/accumulatorHelpers.js";

import { ensureSplit } from "./shared/helpers.js";

import { defaultPlayerSplit } from "./shared/defaults.js";

/* ======================================================
   UPDATE SPLIT
====================================================== */

const updateBestBowling = (split, wickets, runs) => {
  const current = split.bestBowling || {
    wickets: 0,
    runs: 9999,
  };

  const better =
    wickets > current.wickets ||
    (wickets === current.wickets && runs < current.runs);

  if (better) {
    split.bestBowling = {
      wickets,
      runs,
    };
  }
};

const updateSplit = ({
  split,
  runs = 0,
  balls = 0,
  wickets = 0,
  fours = 0,
  sixes = 0,
  out = false,
}) => {
  if (!split) {
    return;
  }

  split.matches += 1;
  split.innings += 1;
  split.runs += runs;
  split.balls += balls;
  split.wickets += wickets;
  split.fours += fours;
  split.sixes += sixes;

  if (out) {
    split.outs += 1;
  }
};

/* ======================================================
   ENSURE PLAYER STRUCTURE
====================================================== */

const ensurePlayerStructure = (player) => {
  if (!player) return;

  player.batting ??= {};
  player.batting.byPosition ??= {};
  player.batting.byOpponent ??= {};
  player.batting.byTeam ??= {};
  player.batting.byMatchResult ??= {};
  player.batting.byInnings ??= {};

  player.bowling ??= {};
  player.bowling.byOpponent ??= {};
  player.bowling.byTeam ??= {};
  player.bowling.byMatchResult ??= {};
  player.bowling.byInnings ??= {};

  if (!Array.isArray(player.battingInnings)) {
    player.battingInnings = [];
  }

  if (!Array.isArray(player.bowlingInnings)) {
    player.bowlingInnings = [];
  }
};

/* ======================================================
   BASE PAYLOAD
====================================================== */

const basePayload = ({ seasonId, playerId }) => ({
  ...(seasonId ? { seasonId } : {}),
  playerId,
  batting: {
    byPosition: {},
    byOpponent: {},
    byTeam: {},
    byMatchResult: {},
    byInnings: {},
  },
  bowling: {
    byOpponent: {},
    byTeam: {},
    byMatchResult: {},
    byInnings: {},
  },
  battingInnings: [],
  bowlingInnings: [],
});

/* ======================================================
   PROCESS PLAYER SPLITS
====================================================== */

export const processPlayerSplits = async (match, accumulators) => {
  const seasonId = match.seasonId;
  const winnerTeamId = match.result?.winnerTeamId;

  for (
    let inningsIndex = 0;
    inningsIndex < (match.innings || []).length;
    inningsIndex++
  ) {
    const innings = match.innings[inningsIndex];
    const inningsNumber = inningsIndex + 1;
    const battingTeamId = innings.battingTeamId;
    const bowlingTeamId = innings.bowlingTeamId;

    if (!battingTeamId || !bowlingTeamId) {
      continue;
    }

    const battingWon = String(battingTeamId) === String(winnerTeamId);

    /* =========================================
         BATTING SPLITS
      ========================================= */

    const battingOrder = innings.battingOrder || [];

    for (let index = 0; index < battingOrder.length; index++) {
      const playerId = battingOrder[index];

      if (!playerId) continue;

      const batting = innings.battingStats?.[String(playerId)];

      if (!batting) continue;

      const runs = batting.runs || 0;
      const balls = batting.balls || 0;
      const fours = batting.fours || 0;
      const sixes = batting.sixes || 0;
      const out = batting.dismissal && batting.dismissal.type !== "NOT_OUT";

      const positionKey = String(index + 1);
      const opponentKey = String(bowlingTeamId);
      const teamKey = String(battingTeamId);
      const resultKey = battingWon ? "wins" : "losses";
      const inningsKey = inningsNumber === 1 ? "FIRST" : "SECOND";

      for (const [map, key, withSeason] of [
        [accumulators.overallPlayerSplits, String(playerId), false],
        [accumulators.seasonPlayerSplits, `${seasonId}_${playerId}`, true],
      ]) {
        const player = getPlayerSplitsAccumulator({
          map,
          key,
          payload: basePayload({
            seasonId: withSeason ? seasonId : undefined,
            playerId,
          }),
        });

        ensurePlayerStructure(player);

        updateSplit({
          split: ensureSplit(
            player.batting.byPosition,
            positionKey,
            defaultPlayerSplit,
          ),
          runs,
          balls,
          fours,
          sixes,
          out,
        });

        updateSplit({
          split: ensureSplit(
            player.batting.byOpponent,
            opponentKey,
            defaultPlayerSplit,
          ),
          runs,
          balls,
          fours,
          sixes,
          out,
        });

        updateSplit({
          split: ensureSplit(
            player.batting.byTeam,
            teamKey,
            defaultPlayerSplit,
          ),
          runs,
          balls,
          fours,
          sixes,
          out,
        });

        updateSplit({
          split: ensureSplit(
            player.batting.byMatchResult,
            resultKey,
            defaultPlayerSplit,
          ),
          runs,
          balls,
          fours,
          sixes,
          out,
        });

        updateSplit({
          split: ensureSplit(
            player.batting.byInnings,
            inningsKey,
            defaultPlayerSplit,
          ),

          runs,
          balls,
          fours,
          sixes,
          out,
        });

        player.battingInnings.push({
          matchId: match._id,
          inningsNumber,
          playedFor: battingTeamId,
          opponent: bowlingTeamId,
          battingPosition: index + 1,
          runs,
          balls,
          fours,
          sixes,
          out,
          won: battingWon,
          date: match.completedAt,
        });

        player.battingInnings = player.battingInnings.slice(-2000);
      }
    }

    /* =========================================
         BOWLING SPLITS
      ========================================= */

    /* =========================================
   BOWLING SPLITS
========================================= */

    for (const [rawPlayerId, bowling] of Object.entries(
      innings.bowlingStats || {},
    )) {
      const playerId = String(rawPlayerId);

      if (!playerId) continue;

      const wickets = bowling.wickets || 0;
      const balls = bowling.balls || 0;
      const runs = bowling.runs || 0;

      const opponentKey = String(battingTeamId);
      const teamKey = String(bowlingTeamId);
      const resultKey = battingWon ? "losses" : "wins";
      const inningsKey = inningsNumber === 1 ? "FIRST" : "SECOND";

      for (const [map, key, withSeason] of [
        [accumulators.overallPlayerSplits, playerId, false],

        [accumulators.seasonPlayerSplits, `${seasonId}_${playerId}`, true],
      ]) {
        const player = getPlayerSplitsAccumulator({
          map,
          key,

          payload: basePayload({
            seasonId: withSeason ? seasonId : undefined,

            playerId,
          }),
        });

        ensurePlayerStructure(player);

        /* ======================================
       BY OPPONENT
    ====================================== */

        const opp = ensureSplit(
          player.bowling.byOpponent,
          opponentKey,
          defaultPlayerSplit,
        );

        updateSplit({
          split: opp,
          wickets,
          balls,
          runs,
        });

        updateBestBowling(opp, wickets, runs);

        /* ======================================
       BY TEAM
    ====================================== */

        const team = ensureSplit(
          player.bowling.byTeam,
          teamKey,
          defaultPlayerSplit,
        );

        updateSplit({
          split: team,
          wickets,
          balls,
          runs,
        });

        updateBestBowling(team, wickets, runs);

        /* ======================================
       BY RESULT
    ====================================== */

        const res = ensureSplit(
          player.bowling.byMatchResult,
          resultKey,
          defaultPlayerSplit,
        );

        updateSplit({
          split: res,
          wickets,
          balls,
          runs,
        });

        updateBestBowling(res, wickets, runs);

        /* ======================================
       BY INNINGS
    ====================================== */

        const inns = ensureSplit(
          player.bowling.byInnings,
          inningsKey,
          defaultPlayerSplit,
        );

        updateSplit({
          split: inns,
          wickets,
          balls,
          runs,
        });

        updateBestBowling(inns, wickets, runs);

        /* ======================================
       EVENT STORAGE
    ====================================== */

        player.bowlingInnings.push({
          matchId: match._id,

          inningsNumber,

          playedFor: bowlingTeamId,

          opponent: battingTeamId,

          wickets,

          balls,

          runs,

          won: !battingWon,

          date: match.completedAt,
        });

        player.bowlingInnings = player.bowlingInnings.slice(-2000);
      }
    }
  }
};
