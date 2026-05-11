import PlayerSeasonStats
  from "../../models/PlayerSeasonStats.js";

/* ======================================================
   HELPERS
====================================================== */

const getDerivedStats = (
  stats
) => {
  /* BATTING */

  const battingAverage =
    stats.batting.outs > 0
      ? (
          stats.batting.runs /
          stats.batting.outs
        ).toFixed(2)
      : 0;

  const strikeRate =
    stats.batting.balls > 0
      ? (
          (stats.batting.runs /
            stats.batting.balls) *
          100
        ).toFixed(2)
      : 0;

  /* BOWLING */

  const economy =
    stats.bowling.balls > 0
      ? (
          (stats.bowling.runs /
            stats.bowling.balls) *
          6
        ).toFixed(2)
      : 0;

  const bowlingAverage =
    stats.bowling.wickets > 0
      ? (
          stats.bowling.runs /
          stats.bowling.wickets
        ).toFixed(2)
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

export const getBattingLeaderboard =
  async (seasonId) => {
    const players =
      await PlayerSeasonStats.find({
        seasonId,
      })
        .sort({
          "batting.runs": -1,
        })
        .limit(20)
        .lean();

    return players.map(
      (player) => ({
        name: player.name,

        runs:
          player.batting.runs,

        innings:
          player.batting.innings,

        highestScore:
          player.batting
            .highestScore.runs,

        fours:
          player.batting.fours,

        sixes:
          player.batting.sixes,

        derived:
          getDerivedStats(
            player
          ),
      })
    );
  };

/* ======================================================
   PURPLE CAP
====================================================== */

export const getBowlingLeaderboard =
  async (seasonId) => {
    const players =
      await PlayerSeasonStats.find({
        seasonId,
      })
        .sort({
          "bowling.wickets": -1,
        })
        .limit(20)
        .lean();

    return players.map(
      (player) => ({
        name: player.name,

        wickets:
          player.bowling
            .wickets,

        maidens:
          player.bowling
            .maidens,

        bestBowling:
          player.bowling
            .bestBowling,

        derived:
          getDerivedStats(
            player
          ),
      })
    );
  };

/* ======================================================
   FIELDING LEADERBOARD
====================================================== */

export const getFieldingLeaderboard =
  async (seasonId) => {
    const players =
      await PlayerSeasonStats.find({
        seasonId,
      })
        .sort({
          "fielding.catches": -1,
        })
        .limit(20)
        .lean();

    return players.map(
      (player) => ({
        name: player.name,

        catches:
          player.fielding
            .catches,

        stumpings:
          player.fielding
            .stumpings,

        runOuts:
          player.fielding
            .runOuts,
      })
    );
  };

/* ======================================================
   MOM LEADERBOARD
====================================================== */

export const getMomLeaderboard =
  async (seasonId) => {
    const players =
      await PlayerSeasonStats.find({
        seasonId,
      })
        .sort({
          "achievements.mom": -1,
        })
        .limit(20)
        .lean();

    return players.map(
      (player) => ({
        name: player.name,

        mom:
          player.achievements
            .mom,
      })
    );
  };

