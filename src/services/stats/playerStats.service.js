import mongoose from "mongoose";

import PlayerProfile from "../../models/PlayerProfile.js";

import OverallPlayerStats from "../../models/OverallPlayerStats.js";

import SeasonPlayerStats from "../../models/SeasonPlayerStats.js";

import OverallPlayerSplits from "../../models/OverallPlayerSplits.js";

import SeasonPlayerSplits from "../../models/SeasonPlayerSplits.js";

/* ======================================================
   HELPERS
====================================================== */

const normalize = (value = "") =>
  value.trim().toLowerCase();

/* ======================================================
   RESOLVE PLAYER
====================================================== */

const resolvePlayer = async (
  nameOrId,
) => {
  /* --------------------------------------
     ObjectId
  -------------------------------------- */

  if (
    mongoose.Types.ObjectId.isValid(
      nameOrId,
    )
  ) {
    const profile =
      await PlayerProfile.findById(
        nameOrId,
      ).lean();

    if (!profile) {
      throw new Error(
        "Player not found",
      );
    }

    return profile;
  }

  /* --------------------------------------
     Name
  -------------------------------------- */

  const profile =
    await PlayerProfile.findOne({
      name: normalize(nameOrId),
    }).lean();

  if (!profile) {
    throw new Error(
      "Player not found",
    );
  }

  return profile;
};

/* ======================================================
   DERIVED STATS
====================================================== */

const getDerivedStats = (
  stats = {},
) => {
  const batting =
    stats.batting || {};

  const bowling =
    stats.bowling || {};

  return {
    battingAverage:
      batting.outs > 0
        ? Number(
            (
              batting.runs /
              batting.outs
            ).toFixed(2),
          )
        : 0,

    strikeRate:
      batting.balls > 0
        ? Number(
            (
              (batting.runs /
                batting.balls) *
              100
            ).toFixed(2),
          )
        : 0,

    economy:
      bowling.balls > 0
        ? Number(
            (
              (bowling.runs /
                bowling.balls) *
              6
            ).toFixed(2),
          )
        : 0,

    bowlingAverage:
      bowling.wickets > 0
        ? Number(
            (
              bowling.runs /
              bowling.wickets
            ).toFixed(2),
          )
        : 0,

    bowlingStrikeRate:
      bowling.wickets > 0
        ? Number(
            (
              bowling.balls /
              bowling.wickets
            ).toFixed(2),
          )
        : 0,
  };
};

/* ======================================================
   PLAYER PROFILE
====================================================== */

export const getPlayerProfile =
  async (nameOrId) => {
    const profile =
      await resolvePlayer(
        nameOrId,
      );

    const stats =
      await OverallPlayerStats.findOne(
        {
          playerId: profile._id,
        },
      ).lean();

    return {
      profile,

      stats: stats || null,

      derived: stats
        ? getDerivedStats(stats)
        : null,
    };
  };

/* ======================================================
   PLAYER MATCH HISTORY
====================================================== */

export const getPlayerMatches =
  async (
    nameOrId,
    query = {},
  ) => {
    const profile =
      await resolvePlayer(
        nameOrId,
      );

    const {
      seasonId,

      type = "batting",

      limit = 20,

      page = 1,
    } = query;

    const skip =
      (Number(page) - 1) *
      Number(limit);

    const Model = seasonId
      ? SeasonPlayerSplits
      : OverallPlayerSplits;

    const filter = {
      playerId: profile._id,
    };

    if (seasonId) {
      filter.seasonId =
        new mongoose.Types.ObjectId(
          seasonId,
        );
    }

    const splits =
      await Model.findOne(
        filter,
      ).lean();

    if (!splits) {
      return {
        profile,
        matches: [],
      };
    }

    const innings =
      type === "bowling"
        ? splits.bowlingInnings ||
          []
        : splits.battingInnings ||
          [];

    const sorted = innings
      .sort(
        (a, b) =>
          new Date(b.date) -
          new Date(a.date),
      )
      .slice(
        skip,
        skip + Number(limit),
      );

    return {
      profile,

      page: Number(page),

      limit: Number(limit),

      count: innings.length,

      matches: sorted,
    };
  };

/* ======================================================
   PLAYER SEASON STATS
====================================================== */

export const getPlayerSeasonStats =
  async (
    nameOrId,
    seasonId,
  ) => {
    const profile =
      await resolvePlayer(
        nameOrId,
      );

    const stats =
      await SeasonPlayerStats.findOne(
        {
          seasonId:
            new mongoose.Types.ObjectId(
              seasonId,
            ),

          playerId: profile._id,
        },
      ).lean();

    return {
      profile,

      stats: stats || null,

      derived: stats
        ? getDerivedStats(stats)
        : null,
    };
  };

/* ======================================================
   SEARCH PLAYERS
====================================================== */

export const searchPlayers =
  async (query) => {
    if (!query?.trim()) {
      return [];
    }

    const players =
      await PlayerProfile.find({
        $or: [
          {
            name: {
              $regex: query,
              $options: "i",
            },
          },

          {
            displayName: {
              $regex: query,
              $options: "i",
            },
          },
        ],
      })
        .limit(10)
        .lean();

    return players.map(
      (player) => ({
        playerId: player._id,

        name:
          player.displayName ||
          player.name,

        totalMatches:
          player.totalMatches ||
          0,

        seasonsPlayed:
          player.seasonsPlayed ||
          [],

        teamsPlayedFor:
          player.teamsPlayedFor ||
          [],
      }),
    );
  };