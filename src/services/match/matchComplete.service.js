import Match from "../../models/match.model.js";
import Season from "../../models/season.model.js";
import { createCompletedMatch } from "../processing/createCompletedMatch.service.js";
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
  
  console.log("Complete Match Service called.");
  
  const match = await createCompletedMatch(matchData);

  return match;
};
