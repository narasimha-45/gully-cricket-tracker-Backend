import Season from "../../models/season.model.js";

/* ======================================================
   CREATE SEASON
====================================================== */

export const createSeason = async (seasonName) => {
  return await Season.create({ seasonName });
};
