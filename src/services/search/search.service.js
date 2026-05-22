import PlayerProfile from "../../models/PlayerProfile.js";
import TeamProfile from "../../models/TeamProfile.js";
import Season from "../../models/season.model.js";
import Match from "../../models/match.model.js";

/**
 * Global search for players, teams, and seasons
 * @param {string} q - Search query
 */
export const globalSearch = async (q) => {
  if (!q || q.trim() === "") {
    return { players: [], teams: [], seasons: [] };
  }

  const regex = new RegExp(q, "i");

  // 1. Search Players
  const players = await PlayerProfile.find({ name: regex })
    .limit(5)
    .lean();

  const formattedPlayers = players.map((p) => ({
    id: p.name,
    name: p.name,
    team: "Player",
  }));

  // 2. Search Teams
  const teams = await TeamProfile.find({ name: regex })
    .sort({ createdAt: -1 })
    .populate("players", "name")
    .lean();

  const uniqueTeamsMap = new Map();
  
  for (const t of teams) {
    if (!uniqueTeamsMap.has(t.name)) {
      let playersList = (t.players || []).map((p) =>
        typeof p === "object" ? p.name : p
      );

      // Fallback to latest match if players array is empty
      if (playersList.length === 0) {
        const latestMatch = await Match.findOne({
          $or: [
            { "teams.teamA.name": { $regex: new RegExp(`^${t.name}$`, "i") } },
            { "teams.teamB.name": { $regex: new RegExp(`^${t.name}$`, "i") } },
          ],
        })
          .sort({ createdAt: -1 })
          .lean();

        if (latestMatch) {
          const matchTeam =
            latestMatch.teams.teamA.name.toLowerCase() === t.name.toLowerCase()
              ? latestMatch.teams.teamA
              : latestMatch.teams.teamB;
          playersList = matchTeam.players || [];
        }
      }

      uniqueTeamsMap.set(t.name, {
        id: t.name,
        name: t.name,
        matches: t.stats?.played || 0,
        players: playersList,
      });
    }
  }

  // 3. Search Seasons
  const seasons = await Season.find({ seasonName: regex })
    .limit(5)
    .lean();

  const formattedSeasons = seasons.map((s) => ({
    id: s._id,
    name: s.seasonName,
    matches: s.matchesCount || 0,
  }));

  return {
    players: formattedPlayers,
    teams: Array.from(uniqueTeamsMap.values()),
    seasons: formattedSeasons,
  };
};
