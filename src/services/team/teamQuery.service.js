import Team from "../../models/team.model.js";
import Match from "../../models/match.model.js";

/* ======================================================
   TEAM PROFILE
====================================================== */

export const getTeamProfile = async (teamName) => {
  // 1. Find the latest version of the team
  let team = await Team.findOne({
    name: { $regex: new RegExp(`^${teamName}$`, "i") },
  })
    .sort({ createdAt: -1 })
    .populate("players", "name")
    .lean();

  if (!team) {
    throw new Error("Team not found");
  }

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
  return await Team.find({
    seasonId,
  })
    .sort({ "stats.points": -1 })
    .lean();
};

/* ======================================================
   POINTS TABLE
====================================================== */

export const getPointsTable = async (seasonId) => {
  const teams = await Team.find({
    seasonId,
  }).lean();

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
  const teams = await Team.find({ name: teamName }).lean();
  
  if (teams.length === 0) {
    throw new Error("Team not found");
  }

  const stats = {
    played: 0, wins: 0, losses: 0, ties: 0,
    runsScored: 0, wicketsLost: 0, ballsFaced: 0,
    runsConceded: 0, wicketsTaken: 0, ballsBowled: 0,
    points: 0,
    highestScore: { runs: 0, wickets: 0, overs: 0 },
    lowestScore: { runs: 9999, wickets: 0, overs: 0 },
    defending: { wins: [], losses: [] },
    chasing: { wins: [], losses: [] },
    highestTotalDefended: { runs: 0, wickets: 0, overs: 0 },
    lowestTotalDefended: { runs: 9999, wickets: 0, overs: 0 },
    highestSuccessfulChase: { runs: 0, wickets: 0, overs: 0 },
    lowestSuccessfulChase: { runs: 9999, wickets: 0, overs: 0 },
    biggestWin: { margin: 0, type: null }
  };

  teams.forEach(t => {
    const s = t.stats;
    stats.played += s.played || 0;
    stats.wins += s.wins || 0;
    stats.losses += s.losses || 0;
    stats.ties += s.ties || 0;
    stats.runsScored += s.runsScored || 0;
    stats.wicketsLost += s.wicketsLost || 0;
    stats.ballsFaced += s.ballsFaced || 0;
    stats.runsConceded += s.runsConceded || 0;
    stats.wicketsTaken += s.wicketsTaken || 0;
    stats.ballsBowled += s.ballsBowled || 0;
    stats.points += s.points || 0;

    if (s.highestScore?.runs > stats.highestScore.runs) stats.highestScore = s.highestScore;
    if (s.lowestScore?.runs && s.lowestScore.runs < stats.lowestScore.runs) stats.lowestScore = s.lowestScore;
    
    if (s.defending) {
      stats.defending.wins.push(...(s.defending.wins || []));
      stats.defending.losses.push(...(s.defending.losses || []));
    }
    if (s.chasing) {
      stats.chasing.wins.push(...(s.chasing.wins || []));
      stats.chasing.losses.push(...(s.chasing.losses || []));
    }

    if (s.highestTotalDefended?.runs > stats.highestTotalDefended.runs) stats.highestTotalDefended = s.highestTotalDefended;
    if (s.lowestTotalDefended?.runs && s.lowestTotalDefended.runs < stats.lowestTotalDefended.runs) stats.lowestTotalDefended = s.lowestTotalDefended;
    
    if (s.highestSuccessfulChase?.runs > stats.highestSuccessfulChase.runs) stats.highestSuccessfulChase = s.highestSuccessfulChase;
    if (s.lowestSuccessfulChase?.runs && s.lowestSuccessfulChase.runs < stats.lowestSuccessfulChase.runs) stats.lowestSuccessfulChase = s.lowestSuccessfulChase;

    if (s.biggestWin?.margin > stats.biggestWin.margin) stats.biggestWin = s.biggestWin;
  });

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
