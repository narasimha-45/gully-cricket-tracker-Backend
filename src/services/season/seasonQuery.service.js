import Season
  from "../../models/season.model.js";

import Match
  from "../../models/match.model.js";

import Team
  from "../../models/team.model.js";

/* ======================================================
   ALL SEASONS
====================================================== */

export const getAllSeasons =
  async () => {
    const seasons =
      await Season.find({})
        .sort({
          createdAt: -1,
        })
        .lean();

    return seasons;
  };

/* ======================================================
   SEASON DETAILS
====================================================== */

export const getSeasonDetails =
  async (seasonId) => {
    const season =
      await Season.findById(
        seasonId
      ).lean();

    if (!season) {
      throw new Error(
        "Season not found"
      );
    }

    const teams =
      await Team.find({
        seasonId,
      })
        .sort({
          "stats.points": -1,
        })
        .lean();

    const recentMatches =
      await Match.find({
        seasonId,
      })
        .sort({
          createdAt: -1,
        })
        .limit(5)
        .lean();

    return {
      season,
      teams,
      recentMatches,
    };
  };