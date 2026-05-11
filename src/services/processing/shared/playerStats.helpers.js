import PlayerSeasonStats from "../../../models/PlayerSeasonStats.js";

import OverallPlayerStats from "../../../models/OverallPlayerStats.js";

import { createEmptyStats } from "./statsFactory.js";

/* ======================================================
   GET PLAYER SEASON STATS
====================================================== */

export const getPlayerSeasonStats = async (seasonId, name) => {
  let stats = await PlayerSeasonStats.findOne({
    seasonId,
    name,
  });

  if (!stats) {
    stats = await PlayerSeasonStats.create({
      seasonId,
      name,

      ...createEmptyStats(),
    });
  }

  return stats;
};

/* ======================================================
   GET OVERALL STATS
====================================================== */

export const getOverallPlayerStats = async (name) => {
  let stats = await OverallPlayerStats.findOne({
    name,
  });

  if (!stats) {
    stats = await OverallPlayerStats.create({
      name,

      ...createEmptyStats(),
    });
  }

  return stats;
};
