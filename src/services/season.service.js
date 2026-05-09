import Season from "../models/season.model.js";

export const createSeason = async (seasonName) => {
  return await Season.create({ seasonName });
};

export const getAllSeasons = async () => {
  return await Season.find().sort({ createdAt: -1 });
};
