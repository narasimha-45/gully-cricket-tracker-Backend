import Team from "../models/team.model.js";

export const getTeamsBySeason = async (req, res) => {
  try {
    const { seasonId } = req.query;

    if (!seasonId) {
      return res.status(400).json({
        success: false,
        message: "seasonId is required",
      });
    }

    const teams = await Team.find({ seasonId })
      .populate("players", "name") // only player names
      .lean();

    // flatten players for frontend/offline usage
    const formatted = teams.map((team) => ({
      _id: team._id,
      name: team.name,
      players: team.players.map((p) => p.name),
    }));

    res.json({
      success: true,
      data: formatted,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch teams",
    });
  }
};
