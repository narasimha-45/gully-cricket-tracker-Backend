import Match from "../../models/match.model.js";
import { processCompletedMatch } from "../processing/processCompletedMatch.service.js";

/* ======================================================
    CREATE MATCH
====================================================== */

export const createMatch = async (matchData) => {
  const match = await Match.create(matchData);

  await Season.findByIdAndUpdate(match.seasonId, {
    $inc: {
      matchesCount: 1,
    },
  });

  await processCompletedMatch(match);

  return match;
};
