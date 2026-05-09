import Match from "../models/match.model.js";

/**
 * Save completed match ONLY
 */
export const saveCompletedMatch = async (matchData) => {
  console.log("match data:", matchData)
  return await Match.create({  
    ...matchData,
    status: "COMPLETED",
    completedAt: new Date(),
  });
};


/**
 * Get completed matches for a season
 */
export const getMatchesBySeason = async (seasonId) => {
  return await Match.find({ seasonId }).sort({ completedAt: -1 });
};
