import Season from "../../models/season.model.js";

/* ======================================================
   CREATE SEASON
====================================================== */

export const createSeason = async (seasonName) => {
  const existing = await Season.findOne({ seasonName: { $regex: new RegExp(`^${seasonName}$`, "i") } });
  if (existing) {
    throw new Error(`Season "${seasonName}" already exists.`);
  }
  return await Season.create({ seasonName });
};
