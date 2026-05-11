import Match from "../../models/match.model.js";
import { processCompletedMatch } from "../processing/processCompletedMatch.service.js";


/* ======================================================
    CREATE MATCH
====================================================== */

export const createMatch = async (matchData) => {

  const match = await Match.create(matchData);
  
  await processCompletedMatch(match);
  
  return match;
}