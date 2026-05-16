import Team from "../../models/team.model.js";
import Player from "../../models/player.model.js";
import Season from "../../models/season.model.js";
import Match from "../../models/match.model.js";

/* ======================================================
   HELPERS
====================================================== */

/**
 * Converts balls to overs (e.g., 13 balls -> 2.1 overs)
 */
const ballsToOvers = (balls) => {
  const overs = Math.floor(balls / 6);
  const remainingBalls = balls % 6;
  return parseFloat(`${overs}.${remainingBalls}`);
};

/**
 * Calculates Net Run Rate (NRR)
 * NRR = (Total Runs Scored / Total Overs Faced) - (Total Runs Conceded / Total Overs Bowled)
 */
const calculateNRR = (stats) => {
  const oversFaced = stats.ballsFaced / 6;
  const oversBowled = stats.ballsBowled / 6;

  if (oversFaced === 0 || oversBowled === 0) return "0.000";

  const nrr = (stats.runsScored / oversFaced) - (stats.runsConceded / oversBowled);
  return nrr.toFixed(3);
};

/* ======================================================
   DERIVED STATS
====================================================== */

const getDerivedStats = (stats) => {
  const battingAvg = stats.wicketsLost > 0 
    ? (stats.runsScored / stats.wicketsLost).toFixed(2) 
    : stats.runsScored.toFixed(2);

  const battingSR = stats.ballsFaced > 0 
    ? ((stats.runsScored / stats.ballsFaced) * 100).toFixed(2) 
    : "0.00";

  const bowlingAvg = stats.wicketsTaken > 0 
    ? (stats.runsConceded / stats.wicketsTaken).toFixed(2) 
    : "0.00";

  const economy = stats.ballsBowled > 0 
    ? ((stats.runsConceded / stats.ballsBowled) * 6).toFixed(2) 
    : "0.00";

  return {
    battingAvg,
    battingSR,
    bowlingAvg,
    economy,
    nrr: calculateNRR(stats),
    oversFaced: ballsToOvers(stats.ballsFaced),
    oversBowled: ballsToOvers(stats.ballsBowled)
  };
};

/**
 * Aggregates stats from multiple team instances (across seasons)
 */
const aggregateTeamStats = (teams) => {
  if (teams.length === 0) return null;
  if (teams.length === 1) return teams[0].stats;

  const aggregated = {
    played: 0, wins: 0, losses: 0, ties: 0, noResults: 0, points: 0,
    runsScored: 0, wicketsLost: 0, ballsFaced: 0,
    runsConceded: 0, wicketsTaken: 0, ballsBowled: 0,
    biggestWin: { margin: 0, type: null, matchId: null },
    highestScore: { runs: 0, wickets: 0, overs: 0, matchId: null },
    lowestScore: { runs: Infinity, wickets: 0, overs: 0, matchId: null },
    defending: { wins: [], losses: [] },
    chasing: { wins: [], losses: [] },
    highestTotalDefended: { runs: 0, wickets: 0, overs: 0, againstTeamId: null, matchId: null },
    lowestTotalDefended: { runs: Infinity, wickets: 0, overs: 0, againstTeamId: null, matchId: null },
    highestSuccessfulChase: { runs: 0, wickets: 0, overs: 0, ballsRemaining: 0, againstTeamId: null, matchId: null },
    lowestSuccessfulChase: { runs: Infinity, wickets: 0, overs: 0, ballsRemaining: 0, againstTeamId: null, matchId: null }
  };

  teams.forEach(t => {
    const s = t.stats;
    aggregated.played += s.played;
    aggregated.wins += s.wins;
    aggregated.losses += s.losses;
    aggregated.ties += s.ties;
    aggregated.noResults += s.noResults;
    aggregated.points += s.points;
    aggregated.runsScored += s.runsScored;
    aggregated.wicketsLost += s.wicketsLost;
    aggregated.ballsFaced += s.ballsFaced;
    aggregated.runsConceded += s.runsConceded;
    aggregated.wicketsTaken += s.wicketsTaken;
    aggregated.ballsBowled += s.ballsBowled;

    // Records
    if (s.biggestWin.margin > aggregated.biggestWin.margin) aggregated.biggestWin = s.biggestWin;
    if (s.highestScore.runs > aggregated.highestScore.runs) aggregated.highestScore = s.highestScore;
    if (s.lowestScore.runs !== null && s.lowestScore.runs < aggregated.lowestScore.runs) aggregated.lowestScore = s.lowestScore;
    
    if (s.highestTotalDefended.runs > aggregated.highestTotalDefended.runs) aggregated.highestTotalDefended = s.highestTotalDefended;
    if (s.lowestTotalDefended.runs !== null && s.lowestTotalDefended.runs < aggregated.lowestTotalDefended.runs) aggregated.lowestTotalDefended = s.lowestTotalDefended;
    
    if (s.highestSuccessfulChase.runs > aggregated.highestSuccessfulChase.runs) aggregated.highestSuccessfulChase = s.highestSuccessfulChase;
    if (s.lowestSuccessfulChase.runs !== null && s.lowestSuccessfulChase.runs < aggregated.lowestSuccessfulChase.runs) aggregated.lowestSuccessfulChase = s.lowestSuccessfulChase;

    // History
    if (s.defending) {
      aggregated.defending.wins.push(...(s.defending.wins || []));
      aggregated.defending.losses.push(...(s.defending.losses || []));
    }
    if (s.chasing) {
      aggregated.chasing.wins.push(...(s.chasing.wins || []));
      aggregated.chasing.losses.push(...(s.chasing.losses || []));
    }
  });

  if (aggregated.lowestScore.runs === Infinity) aggregated.lowestScore.runs = null;
  if (aggregated.lowestTotalDefended.runs === Infinity) aggregated.lowestTotalDefended.runs = null;
  if (aggregated.lowestSuccessfulChase.runs === Infinity) aggregated.lowestSuccessfulChase.runs = null;

  return aggregated;
};

/* ======================================================
   TEAM PROFILE & STATS
====================================================== */

export const getTeamProfile = async (teamIdOrName, query = {}) => {
  const isId = /^[0-9a-fA-F]{24}$/.test(teamIdOrName);
  const { seasonId } = query;

  if (isId) {
    const team = await Team.findById(teamIdOrName)
      .populate("players", "name")
      .populate("seasonId", "name")
      .populate("stats.biggestWin.matchId")
      .populate("stats.highestScore.matchId")
      .populate("stats.lowestScore.matchId")
      .populate("stats.highestTotalDefended.matchId")
      .populate("stats.lowestTotalDefended.matchId")
      .populate("stats.highestSuccessfulChase.matchId")
      .populate("stats.lowestSuccessfulChase.matchId")
      .lean();

    if (!team) throw new Error("Team not found");

    return {
      profile: {
        name: team.name,
        isOverall: false,
        season: team.seasonId,
        players: team.players,
      },
      stats: team.stats,
      derived: getDerivedStats(team.stats),
    };
  } else {
    // Search by name
    const filter = {
      name: { $regex: new RegExp(`^${teamIdOrName}$`, "i") },
    };

    if (seasonId && seasonId !== "overall") {
      filter.seasonId = seasonId;
    }

    let teams = await Team.find(filter)
      .populate("players", "name")
      .populate("seasonId", "name")
      .lean();

    if (teams.length === 0) {
      // If seasonId was provided but no team found, try finding the team in any season for profile info
      if (seasonId && seasonId !== "overall") {
        const anyTeam = await Team.findOne({ name: { $regex: new RegExp(`^${teamIdOrName}$`, "i") } })
          .populate("players", "name")
          .lean();
        
        if (!anyTeam) throw new Error("Team not found");

        return {
          profile: {
            name: anyTeam.name,
            isOverall: false,
            season: null,
            players: anyTeam.players,
          },
          stats: null,
          derived: null,
        };
      }
      throw new Error("Team not found");
    }

    // If a specific season was requested, we return that single team's stats
    if (seasonId && seasonId !== "overall") {
      const team = teams[0];
      return {
        profile: {
          name: team.name,
          isOverall: false,
          season: team.seasonId,
          players: team.players,
        },
        stats: team.stats,
        derived: getDerivedStats(team.stats),
      };
    }

    // Otherwise, aggregate stats across all seasons found
    const aggregatedStats = aggregateTeamStats(teams);

    // Merge unique players
    const playersMap = new Map();
    teams.forEach((t) =>
      t.players.forEach((p) => playersMap.set(p._id.toString(), p)),
    );

    return {
      profile: {
        name: teams[0].name,
        isOverall: true,
        seasonsCount: teams.length,
        seasons: teams.map((t) => t.seasonId),
        players: Array.from(playersMap.values()),
      },
      stats: aggregatedStats,
      derived: getDerivedStats(aggregatedStats),
    };
  }
};

/* ======================================================
   SEARCH TEAMS
====================================================== */

export const searchTeams = async (query) => {
  if (!query) return [];

  return await Team.find({
    name: { $regex: query, $options: "i" }
  })
  .populate("seasonId", "name")
  .limit(10)
  .lean();
};
