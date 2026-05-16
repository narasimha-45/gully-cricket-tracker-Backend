import PlayerProfile from "../models/PlayerProfile.js";
import Team from "../models/team.model.js";
import Season from "../models/season.model.js";

export const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.json({
        success: true,
        data: { players: [], teams: [], seasons: [] },
      });
    }

    const regex = new RegExp(q, "i");

    // Search Players
    const players = await PlayerProfile.find({ name: regex })
      .limit(5)
      .lean();

    const formattedPlayers = players.map(p => ({
      id: p.name, // Using name as ID for now since player endpoints use name
      name: p.name,
      team: "Player",
    }));

    // Search Teams
    const teams = await Team.find({ name: regex })
      .limit(5)
      .lean();
      
    // Remove duplicate team names across seasons
    const uniqueTeamsMap = new Map();
    teams.forEach(t => {
      if (!uniqueTeamsMap.has(t.name)) {
        uniqueTeamsMap.set(t.name, {
          id: t.name, // Using name as ID since team profile uses name
          name: t.name,
          matches: t.stats?.played || 0,
        });
      }
    });

    // Search Seasons
    const seasons = await Season.find({ seasonName: regex })
      .limit(5)
      .lean();

    const formattedSeasons = seasons.map(s => ({
      id: s._id,
      name: s.seasonName,
      matches: s.matchesCount || 0,
    }));

    return res.json({
      success: true,
      data: {
        players: formattedPlayers,
        teams: Array.from(uniqueTeamsMap.values()),
        seasons: formattedSeasons,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
