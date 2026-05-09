import {
  createSeason,
  getAllSeasons
} from "../services/season.service.js";
import Season from "../models/season.model.js";
import Match from "../models/match.model.js";


export const createSeasonController = async (req, res) => {
  try {
    const { seasonName } = req.body;
    console.log(req)
    if (!seasonName) {
      return res.status(400).json({
        message: "seasonName is required"
      });
    }

    const season = await createSeason(seasonName);

    res.status(201).json(season);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create season",
      error: error.message
    });
  }
};



export const getSeasonsController = async (req, res) => {
  try {
    const seasons = await Season.aggregate([
      {
        $lookup: {
          from: "matches",
          let: { seasonId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$seasonId", "$$seasonId"] },
                    { $eq: ["$status", "COMPLETED"] },
                  ],
                },
              },
            },
            { $count: "count" },
          ],
          as: "matchStats",
        },
      },
      {
        $addFields: {
          matchCount: {
            $ifNull: [{ $arrayElemAt: ["$matchStats.count", 0] }, 0],
          },
        },
      },
      {
        $project: {
          matchStats: 0,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    res.json(seasons);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load seasons" });
  }
};


