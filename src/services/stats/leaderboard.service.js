import { maxLength } from "zod";
import PlayerSeasonStats from "../../models/SeasonPlayerStats.js";
import OverallPlayerStats from "../../models/OverallPlayerStats.js";

/* ======================================================
   HELPERS
====================================================== */

export const getDerivedStats = (stats) => {
  /* BATTING */

  const battingAverage =
    stats.batting.outs > 0
      ? (stats.batting.runs / stats.batting.outs).toFixed(2)
      : 0;

  const strikeRate =
    stats.batting.balls > 0
      ? ((stats.batting.runs / stats.batting.balls) * 100).toFixed(2)
      : 0;

  /* BOWLING */

  const economy =
    stats.bowling.balls > 0
      ? ((stats.bowling.runs / stats.bowling.balls) * 6).toFixed(2)
      : 0;

  const bowlingAverage =
    stats.bowling.wickets > 0
      ? (stats.bowling.runs / stats.bowling.wickets).toFixed(2)
      : 0;

  return {
    battingAverage,
    strikeRate,
    economy,
    bowlingAverage,
  };
};

/* ======================================================
   ORANGE CAP
====================================================== */

export const getSeasonBattingLeaderboard = async (seasonId) => {
  const players = await PlayerSeasonStats.find({
    seasonId,
  })
    .sort({
      "batting.runs": -1,
    })
    .lean();

  return players.map((player) => ({
    name: player.name,

    runs: player.batting.runs,

    innings: player.batting.innings,

    highestScore: player.batting.highestScore.runs,

    fours: player.batting.fours,

    sixes: player.batting.sixes,

    ducks: player.batting.ducks,

    derived: getDerivedStats(player),
  }));
};

export const getOverallBattingLeaderboard = async () => {
  const players = await OverallPlayerStats.find({})
    .sort({
      "batting.runs": -1,
    })
    .lean();
  return players.map((player) => ({
    name: player.name,

    runs: player.batting.runs,

    innings: player.batting.innings,

    highestScore: player.batting.highestScore.runs,

    fours: player.batting.fours,

    sixes: player.batting.sixes,

    ducks: player.batting.ducks,

    derived: getDerivedStats(player),
  }));
};

/* ======================================================
   PURPLE CAP
====================================================== */

export const getSeasonBowlingLeaderboard = async (seasonId) => {
  const players = await PlayerSeasonStats.find({
    seasonId,
  })
    .sort({
      "bowling.wickets": -1,
    })
    .lean();

  return players.map((player) => ({
    name: player.name,

    wickets: player.bowling.wickets,

    innings: player.bowling.innings,

    balls: player.bowling.balls,

    maidens: player.bowling.maidens,

    bestBowling: player.bowling.bestBowling,

    derived: getDerivedStats(player),
  }));
};

export const getOverallBowlingLeaderboard = async () => {
  const players = await OverallPlayerStats.find({})
    .sort({
      "bowling.wickets": -1,
    })
    .lean();

  return players.map((player) => ({
    name: player.name,

    wickets: player.bowling.wickets,

    innings: player.bowling.innings,

    balls: player.bowling.balls,

    maidens: player.bowling.maidens,

    bestBowling: player.bowling.bestBowling,

    derived: getDerivedStats(player),
  }));
};

/* ======================================================
   FIELDING LEADERBOARD
====================================================== */

export const getSeasonFieldingLeaderboard = async (seasonId) => {
  console.log("seasonId",seasonId)
  const players = await PlayerSeasonStats.find({
    seasonId,
  })
    .sort({
      "fielding.catches": -1,
    })
    .lean();

  return players.map((player) => ({
    name: player.name,

    catches: player.fielding.catches,

    stumpings: player.fielding.stumpings,

    runOuts: player.fielding.runOuts,

    manOfTheMatch: player.achievements.mom,
  }));
};

export const getOverallFieldingLeaderboard = async () => {
  const players = await OverallPlayerStats.find({})
    .sort({
      "fielding.catches": -1,
    })
    .lean();

  return players.map((player) => ({
    name: player.name,

    catches: player.fielding.catches,

    stumpings: player.fielding.stumpings,

    runOuts: player.fielding.runOuts,

    manOfTheMatch: player.achievements.mom,
  }));
};

/* ======================================================
   MOM LEADERBOARD
====================================================== */

export const getOverallMomLeaderboard = async (seasonId) => {
  const players = await PlayerSeasonStats.find({
    seasonId,
  })
    .sort({
      "achievements.mom": -1,
    })
    .lean();

  return players.map((player) => ({
    name: player.name,

    mom: player.achievements.mom,
  }));
};
