import mongoose from "mongoose";
import OverallPlayerSplits from "../../models/OverallPlayerSplits.js";
import SeasonPlayerSplits from "../../models/SeasonPlayerSplits.js";
import TeamProfile from "../../models/TeamProfile.js";
import PlayerProfile from "../../models/PlayerProfile.js";

/* ======================================================
   GET PLAYER SPLITS
====================================================== */

export const getPlayerSplits = async (nameOrId, query = {}) => {
  const { seasonId } = query;
  
  // Resolve player ID
  let playerId = nameOrId;
  if (!mongoose.Types.ObjectId.isValid(nameOrId)) {
    const profile = await PlayerProfile.findOne({ name: { $regex: new RegExp(`^${nameOrId}$`, "i") } }).lean();
    if (!profile) {
      throw new Error("Player not found");
    }
    playerId = profile._id;
  }

  const Model = seasonId ? SeasonPlayerSplits : OverallPlayerSplits;
  const filter = { playerId: new mongoose.Types.ObjectId(playerId) };
  if (seasonId) {
    filter.seasonId = new mongoose.Types.ObjectId(seasonId);
  }

  const splits = await Model.findOne(filter).lean();

  if (!splits) {
    return {
      batting: {},
      bowling: {},
    };
  }

  // Collect team IDs to populate names in byOpponent and byTeam
  const teamIds = new Set();
  
  const collectTeamIds = (obj) => {
    if (!obj) return;
    Object.keys(obj).forEach((key) => {
      if (mongoose.Types.ObjectId.isValid(key)) {
        teamIds.add(key);
      }
    });
  };

  collectTeamIds(splits.batting?.byOpponent);
  collectTeamIds(splits.batting?.byTeam);
  collectTeamIds(splits.bowling?.byOpponent);
  collectTeamIds(splits.bowling?.byTeam);

  const teams = await TeamProfile.find({ _id: { $in: Array.from(teamIds) } }).lean();
  const teamIdToName = {};
  teams.forEach(t => {
    teamIdToName[t._id.toString()] = t.name;
  });

  const mapTeamKeys = (obj) => {
    if (!obj) return {};
    const result = {};
    Object.entries(obj).forEach(([key, value]) => {
      const newKey = teamIdToName[key] || key;
      result[newKey] = value;
    });
    return result;
  };

  return {
    batting: {
      ...splits.batting,
      byOpponent: mapTeamKeys(splits.batting?.byOpponent),
      byTeam: mapTeamKeys(splits.batting?.byTeam),
    },
    bowling: {
      ...splits.bowling,
      byOpponent: mapTeamKeys(splits.bowling?.byOpponent),
      byTeam: mapTeamKeys(splits.bowling?.byTeam),
    }
  };
};
