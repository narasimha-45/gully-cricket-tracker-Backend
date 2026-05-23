import OverallPlayerSplits from "../../models/OverallPlayerSplits.js";
import SeasonTeamStats from "../../models/SeasonTeamStats.js";
import OverallTeamStats from "../../models/OverallTeamStats.js";
import TeamProfile from "../../models/TeamProfile.js";
import Match from "../../models/match.model.js";

/* ======================================================
   TEAM PROFILE
====================================================== */

export const getTeamProfile = async (teamName) => {
  // 1. Find the latest version of the team
  const profile = await TeamProfile.findOne({
    name: { $regex: new RegExp(`^${teamName}$`, "i") },
  }).lean();

  if (!profile) {
    throw new Error("Team not found");
  }

  const teamStats = await OverallTeamStats.findOne({ teamId: profile._id }).lean();
  
  let team = {
    ...profile,
    stats: teamStats || {}
  };

  // 2. If players array is empty, fallback to Match history
  if (!team.players || team.players.length === 0) {
    const latestMatch = await Match.findOne({
      $or: [
        { "teams.teamA.name": { $regex: new RegExp(`^${teamName}$`, "i") } },
        { "teams.teamB.name": { $regex: new RegExp(`^${teamName}$`, "i") } }
      ]
    })
      .sort({ createdAt: -1 })
      .lean();

    if (latestMatch) {
      const matchTeam = latestMatch.teams.teamA.name.toLowerCase() === teamName.toLowerCase() 
        ? latestMatch.teams.teamA 
        : latestMatch.teams.teamB;
      
      // Convert string names to the format expected by the frontend
      team.players = (matchTeam.players || []).map(name => ({ name }));
    }
  }

  const netRunRate =
    team.stats.ballsFaced > 0 && team.stats.ballsBowled > 0
      ? (
          team.stats.runsScored / (team.stats.ballsFaced / 6) -
          team.stats.runsConceded / (team.stats.ballsBowled / 6)
        ).toFixed(2)
      : 0;

  return {
    team,
    derived: {
      netRunRate,
    },
  };
};

/* ======================================================
   TEAM MATCH HISTORY
====================================================== */

export const getTeamMatches = async (teamName, query = {}) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  return await Match.find({
    $or: [
      { "teams.teamA.name": teamName },
      { "teams.teamB.name": teamName },
    ],
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

/* ======================================================
   SEASON TEAMS
====================================================== */

export const getSeasonTeams = async (seasonId) => {
  const stats = await SeasonTeamStats.find({ seasonId })
    .sort({ points: -1 })
    .populate("teamId", "name")
    .lean();
    
  return stats.map(s => ({
    _id: s.teamId?._id,
    name: s.teamId?.name,
    stats: s,
    seasonId
  }));
};

export const getAllTeams = async () => {
  const profiles = await TeamProfile.find({}).lean();
  
  return profiles.map(p => ({
    _id: p._id,
    name: p.name,
  }));
}

/* ======================================================
   POINTS TABLE
====================================================== */

export const getPointsTable = async (seasonId) => {
  const stats = await SeasonTeamStats.find({ seasonId })
    .populate("teamId", "name")
    .lean();
    
  const teams = stats.map(s => ({
    _id: s.teamId?._id,
    name: s.teamId?.name,
    stats: s,
    seasonId
  }));

  return teams
    .map((team) => {
      const nrr =
        team.stats.ballsFaced > 0 && team.stats.ballsBowled > 0
          ? (
              team.stats.runsScored / (team.stats.ballsFaced / 6) -
              team.stats.runsConceded / (team.stats.ballsBowled / 6)
            ).toFixed(2)
          : 0;

      return {
        ...team,
        derived: {
          netRunRate: nrr,
        },
      };
    })
    .sort((a, b) => {
      if (b.stats.points !== a.stats.points) {
        return b.stats.points - a.stats.points;
      }
      return b.derived.netRunRate - a.derived.netRunRate;
    });
};

export const getGlobalTeamProfile = async (teamName) => {
  const profile = await TeamProfile.findOne({ 
    name: { $regex: new RegExp(`^${teamName}$`, "i") } 
  }).lean();
  
  if (!profile) {
    throw new Error("Team not found");
  }
  
  const statsDoc = await OverallTeamStats.findOne({ teamId: profile._id }).lean();
  const s = statsDoc || {};
  
  const stats = {
    played: s.played || 0, wins: s.wins || 0, losses: s.losses || 0, ties: s.ties || 0,
    runsScored: s.runsScored || 0, wicketsLost: s.wicketsLost || 0, ballsFaced: s.ballsFaced || 0,
    runsConceded: s.runsConceded || 0, wicketsTaken: s.wicketsTaken || 0, ballsBowled: s.ballsBowled || 0,
    points: s.points || 0,
    highestScore: s.highestScore || { runs: 0, wickets: 0, overs: 0 },
    lowestScore: s.lowestScore || { runs: 0, wickets: 0, overs: 0 },
    defending: s.defending || { wins: [], losses: [] },
    chasing: s.chasing || { wins: [], losses: [] },
    highestTotalDefended: s.highestTotalDefended || { runs: 0, wickets: 0, overs: 0 },
    lowestTotalDefended: s.lowestTotalDefended || { runs: 0, wickets: 0, overs: 0 },
    highestSuccessfulChase: s.highestSuccessfulChase || { runs: 0, wickets: 0, overs: 0 },
    lowestSuccessfulChase: s.lowestSuccessfulChase || { runs: 0, wickets: 0, overs: 0 },
    biggestWin: s.biggestWin || { margin: 0, type: null }
  };

  // No iteration over teams array needed since OverallTeamStats handles aggregation

  if (stats.lowestScore.runs === 9999) stats.lowestScore.runs = 0;
  if (stats.lowestTotalDefended.runs === 9999) stats.lowestTotalDefended.runs = 0;
  if (stats.lowestSuccessfulChase.runs === 9999) stats.lowestSuccessfulChase.runs = 0;

  const nrr = stats.ballsFaced > 0 && stats.ballsBowled > 0
    ? (stats.runsScored / (stats.ballsFaced / 6) - stats.runsConceded / (stats.ballsBowled / 6)).toFixed(2)
    : 0;

  const battingSR = stats.ballsFaced > 0 ? ((stats.runsScored / stats.ballsFaced) * 100).toFixed(2) : 0;
  const economy = stats.ballsBowled > 0 ? ((stats.runsConceded / stats.ballsBowled) * 6).toFixed(2) : 0;
  
  const ballsToOvers = (b) => `${Math.floor(b / 6)}.${b % 6}`;

  return {
    profile: {
      name: teamName,
      seasonsCount: teams.length,
    },
    stats,
    derived: {
      nrr,
      battingSR,
      economy,
      oversFaced: ballsToOvers(stats.ballsFaced),
      oversBowled: ballsToOvers(stats.ballsBowled),
    }
  };
};
