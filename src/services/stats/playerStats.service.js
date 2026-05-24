import mongoose from "mongoose";

import PlayerProfile from "../../models/PlayerProfile.js";

import OverallPlayerStats from "../../models/OverallPlayerStats.js";
import SeasonPlayerStats from "../../models/SeasonPlayerStats.js";

import OverallPlayerSplits from "../../models/OverallPlayerSplits.js";
import SeasonPlayerSplits from "../../models/SeasonPlayerSplits.js";

import TeamProfile from "../../models/TeamProfile.js";
import Season from "../../models/season.model.js";

/* ======================================================
   HELPERS
====================================================== */

const normalize = (value = "") => value.trim().toLowerCase();

const safeDivide = (a = 0, b = 0) => (b > 0 ? Number((a / b).toFixed(2)) : 0);

const ballsToOvers = (balls = 0) => {
  const overs = Math.floor(balls / 6);
  const rem = balls % 6;

  return `${overs}.${rem}`;
};

/* ======================================================
   RESOLVE PLAYER
====================================================== */

const resolvePlayer = async (nameOrId) => {
  if (mongoose.Types.ObjectId.isValid(nameOrId)) {
    const player = await PlayerProfile.findById(nameOrId).lean();

    if (!player) {
      throw new Error("Player not found");
    }

    return player;
  }

  const player = await PlayerProfile.findOne({
    name: normalize(nameOrId),
  }).lean();

  if (!player) {
    throw new Error("Player not found");
  }

  return player;
};

/* ======================================================
   DERIVED STATS
====================================================== */

const getDerivedStats = (stats = {}) => {
  const batting = stats.batting || {};

  const bowling = stats.bowling || {};

  return {
    battingAverage: safeDivide(batting.runs, batting.outs),

    strikeRate: safeDivide(batting.runs * 100, batting.balls),

    economy: safeDivide(bowling.runs * 6, bowling.balls),

    bowlingAverage: safeDivide(bowling.runs, bowling.wickets),

    bowlingStrikeRate: safeDivide(bowling.balls, bowling.wickets),

    oversBowled: ballsToOvers(bowling.balls),
  };
};

/* ======================================================
   RECENT FORM
====================================================== */

const buildRecentForm = (battingInnings = [], bowlingInnings = []) => {
  const map = new Map();

  /* ======================================
     BATTING
  ====================================== */

  for (const bat of battingInnings) {
    const key = String(bat.matchId);

    if (!map.has(key)) {
      map.set(key, {
        matchId: bat.matchId,

        seasonId: bat.seasonId,

        playedFor: bat.playedFor,

        opponent: bat.opponent,

        inningsNumber: bat.inningsNumber,

        date: bat.date,

        won: bat.won,

        batting: null,

        bowling: null,
      });
    }

    map.get(key).batting = {
      battingPosition: bat.battingPosition,

      runs: bat.runs,

      balls: bat.balls,

      fours: bat.fours,

      sixes: bat.sixes,

      out: bat.out,
    };
  }

  /* ======================================
     BOWLING
  ====================================== */

  for (const bowl of bowlingInnings) {
    const key = String(bowl.matchId);

    if (!map.has(key)) {
      map.set(key, {
        matchId: bowl.matchId,

        seasonId: bowl.seasonId,

        playedFor: bowl.playedFor,

        opponent: bowl.opponent,

        inningsNumber: bowl.inningsNumber,

        date: bowl.date,

        won: bowl.won,

        batting: null,

        bowling: null,
      });
    }

    map.get(key).bowling = {
      wickets: bowl.wickets,

      runs: bowl.runs,

      balls: bowl.balls,
    };
  }

  return Array.from(map.values())
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);
};

/* ======================================================
   PLAYER NAME ATTACHER
====================================================== */

const attachPlayerNames = async (arr = [], field = "playerId") => {
  const ids = arr.map((x) => x[field]);

  const players = await PlayerProfile.find({
    _id: {
      $in: ids,
    },
  })
    .select("name displayName")
    .lean();

  const map = {};

  for (const p of players) {
    map[String(p._id)] = p.displayName || p.name;
  }

  return arr.map((x) => ({
    ...x,

    playerName: map[String(x[field])] || null,
  }));
};

/* ======================================================
   PLAYER PROFILE
====================================================== */

export const getPlayerProfile = async (nameOrId, query = {}) => {
  const { seasonId } = query;

  /* ======================================
       PLAYER
    ====================================== */

  const profile = await resolvePlayer(nameOrId);

  /* ======================================
       MODELS
    ====================================== */

  const StatsModel = seasonId ? SeasonPlayerStats : OverallPlayerStats;

  const SplitsModel = seasonId ? SeasonPlayerSplits : OverallPlayerSplits;

  /* ======================================
       FILTER
    ====================================== */

  const filter = {
    playerId: profile._id,
  };

  if (seasonId) {
    filter.seasonId = new mongoose.Types.ObjectId(seasonId);
  }

  /* ======================================
       FETCH
    ====================================== */

  const [career, splits, teams, seasons, seasonStats] = await Promise.all([
    StatsModel.findOne(filter).lean(),

    SplitsModel.findOne(filter).lean(),

    TeamProfile.find({
      _id: {
        $in: profile.teamsPlayedFor || [],
      },
    }).lean(),

    Season.find({
      _id: {
        $in: profile.seasonsPlayed || [],
      },
    }).lean(),

    SeasonPlayerStats.find({
      playerId: profile._id,
    })
      .populate("seasonId", "seasonName shortName")
      .lean(),
  ]);

  /* ======================================
       EMPTY
    ====================================== */

  if (!career || !splits) {
    return {
      profile,
    };
  }

  /* ======================================
       SPLITS
    ====================================== */

  const battingSplits = splits.batting || {};

  const bowlingSplits = splits.bowling || {};

  const battingInnings = splits.battingInnings || [];

  const bowlingInnings = splits.bowlingInnings || [];

  /* ======================================
       RECENT FORM
    ====================================== */

  const recentForm = buildRecentForm(battingInnings, bowlingInnings);

  /* ======================================
       OPENING SPLIT
    ====================================== */

  const openingSplit = {
    matches: 0,
    innings: 0,
    runs: 0,
    balls: 0,
    outs: 0,
    fours: 0,
    sixes: 0,
  };

  for (const pos of ["1", "2"]) {
    const s = battingSplits?.byPosition?.[pos];

    if (!s) continue;

    openingSplit.matches += s.matches || 0;

    openingSplit.innings += s.innings || 0;

    openingSplit.runs += s.runs || 0;

    openingSplit.balls += s.balls || 0;

    openingSplit.outs += s.outs || 0;

    openingSplit.fours += s.fours || 0;

    openingSplit.sixes += s.sixes || 0;
  }

  /* ======================================
       ATTACH PLAYER NAMES
    ====================================== */

  const mostDismissedBy = await attachPlayerNames(
    career.batting?.mostDismissedBy || [],
  );

  const mostDismissedBatters = await attachPlayerNames(
    career.bowling?.mostDismissedBatters || [],
  );

  /* ======================================
       RECORDS
    ====================================== */

  const highestScore = Math.max(...battingInnings.map((i) => i.runs || 0), 0);

  let bestBowling = null;

  for (const inn of bowlingInnings) {
    if (!bestBowling) {
      bestBowling = inn;
      continue;
    }

    if (inn.wickets > bestBowling.wickets) {
      bestBowling = inn;
    } else if (
      inn.wickets === bestBowling.wickets &&
      inn.runs < bestBowling.runs
    ) {
      bestBowling = inn;
    }
  }

  /* ======================================
       SEASONS
    ====================================== */

  const formattedSeasons = seasonStats.map((s) => ({
    season: s.seasonId,

    stats: s,

    derived: getDerivedStats(s),
  }));

  /* ======================================
       RESPONSE
    ====================================== */

  return {
    profile: {
      ...profile,

      teamsPlayedFor: teams,

      seasonsPlayed: seasons,
    },

    career: {
      ...career,

      batting: {
        ...career.batting,

        mostDismissedBy,
      },

      bowling: {
        ...career.bowling,

        mostDismissedBatters,
      },
    },

    derived: getDerivedStats(career),

    recentForm,

    splits: {
      batting: {
        opening: openingSplit,

        byPosition: battingSplits.byPosition || {},

        byTeam: battingSplits.byTeam || {},

        byOpponent: battingSplits.byOpponent || {},

        byMatchResult: battingSplits.byMatchResult || {},

        byInnings: battingSplits.byInnings || {},
      },

      bowling: {
        byTeam: bowlingSplits.byTeam || {},

        byOpponent: bowlingSplits.byOpponent || {},

        byMatchResult: bowlingSplits.byMatchResult || {},

        byInnings: bowlingSplits.byInnings || {},
      },
    },

    seasons: formattedSeasons,

    records: {
      highestScore,

      bestBowling: bestBowling
        ? `${bestBowling.wickets}/${bestBowling.runs}`
        : null,
    },
  };
};

/* ======================================================
   PLAYER SEASON STATS
====================================================== */

export const getPlayerSeasonStats = async (nameOrId, seasonId) => {
  return await getPlayerProfile(nameOrId, {
    seasonId,
  });
};
