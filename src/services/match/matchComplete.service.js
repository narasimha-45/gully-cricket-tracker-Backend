import Match from "../../models/match.model.js";
import Season from "../../models/season.model.js";
import { processCompletedMatch } from "../processing/processCompletedMatch.service.js";
import { preloadMatchState } from "../processing/shared/preloadState.js";

/* ======================================================
   COMPLETE MATCH
   Called from the frontend when the user taps "Finish Match"
   on the result popup.

   Payload shape (from acknowledgeMatchResult.js):
   {
     seasonId,
     teams: { teamA, teamB },
     toss,
     rules,
     totalOvers,
     matchType,
     innings: [ { battingTeam, bowlingTeam, totalRuns, wickets, balls,
                   battingStats, bowlingStats, extras, dismissals,
                   ballByBall, completed } ],
     result:  { winner, type, margin, manOfTheMatch },
     fieldingStats,
   }
====================================================== */

export const completeMatch = async (matchData) => {
  /* ─── 1. Validate minimum payload ─── */
  console.log("Complete Match Service", matchData);
  if (!matchData.seasonId) throw new Error("seasonId is required");
  if (!matchData.innings || matchData.innings.length < 2)
    throw new Error("At least 2 innings are required");
  if (!matchData.result?.winner) throw new Error("result.winner is required");

  /* ─── 2. Persist the Match document ─── */
  console.log("Creating Match................");
  const match = await Match.create({
    seasonId: matchData.seasonId,

    matchType: matchData.matchType || "OVERS",
    totalOvers: matchData.totalOvers || null,

    teams: matchData.teams,
    toss:  matchData.toss,
    rules: matchData.rules,

    // Keep all innings (including Super Overs)
    innings: matchData.innings.map((inn) => ({
      battingTeam:  inn.battingTeam,
      bowlingTeam:  inn.bowlingTeam,
      totalRuns:    inn.totalRuns    ?? 0,
      wickets:      inn.wickets      ?? 0,
      balls:        inn.balls        ?? 0,
      battingStats: inn.battingStats ?? {},
      bowlingStats: inn.bowlingStats ?? {},
      extras:       inn.extras       ?? { wides: 0, noBalls: 0 },
      dismissals:   inn.dismissals   ?? {},
      ballByBall:   inn.ballByBall   ?? [],
      isSuperOver:  inn.isSuperOver  ?? false,
      completed:    true,
    })),

    result: {
      winner:        matchData.result.winner,
      type:          matchData.result.type,
      margin:        matchData.result.margin,
      manOfTheMatch: matchData.result.manOfTheMatch ?? null,
    },

    fieldingStats: matchData.fieldingStats ?? {},

    status: "COMPLETED",
    completedAt: new Date(),
  });

  console.log("Match Created Successfully");
  /* ─── 3. Increment season match count ─── */
  console.log("Incrementing Season Match Count");
  await Season.findByIdAndUpdate(matchData.seasonId, {
    $inc: { matchesCount: 1 },
  });
  console.log("Season Match Count Incremented");

  /* ─── 4. Preload state & run processing pipeline ─── */
  console.log("Preloading State................");
  const state = await preloadMatchState(match);
  console.log(state);
  console.log("State Preloaded Successfully");
  console.log("Processing Match................");
  await processCompletedMatch(match, state);
  console.log("Match Processed Successfully");

  return match;
};
