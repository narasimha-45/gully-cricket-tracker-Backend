import Match from "../models/match.model.js";

import Player from "../models/player.model.js";

export const getSeasonBattingStats = async (req, res) => {
  try {
    const { seasonId } = req.params;

    const players = await Player.find({
      seasonId,
      "batting.innings": { $gt: 0 },
    })
      .sort({ "batting.runs": -1 })
      .lean();

    res.json({
      success: true,
      data: players.map((p) => ({
        name: p.name,
        ...p.batting,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};



export const getSeasonBowlingStats = async (req, res) => {
  try {
    const { seasonId } = req.params;

    const players = await Player.find({
      seasonId,
      "bowling.innings": { $gt: 0 },
    })
      .sort({ "bowling.wickets": -1 })
      .lean();

    res.json({
      success: true,
      data: players.map((p) => ({
        name: p.name,
        ...p.bowling,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};


export const getSeasonMiscStats = async (req, res) => {
  try {
    const { seasonId } = req.params;

    const players = await Player.find({
      seasonId
    }).sort({
        "misc.manOfTheMatch": -1,
        "misc.catches": -1,
        "misc.runOuts": -1,
      })
      .lean();

    res.json({
      success: true,
      data: players.map((p) => ({
        name: p.name,

        catches: p.misc?.catches || 0,
        runOuts: p.misc?.runOuts || 0,
        mom: p.misc?.mom || 0,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

