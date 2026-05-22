import TeamProfile from "../../models/TeamProfile.js";

import OverallTeamStats from "../../models/OverallTeamStats.js";

import SeasonTeamStats from "../../models/SeasonTeamStats.js";  

export const getTeamStandings = async (seasonId) => {
  if (seasonId && seasonId !== "all") {
    // Return season specific stats
    const teams = await TeamProfile.find({ seasonId }).lean();
    return teams.map(formatTeamRecord).sort(sortByPointsAndNrr);
  }

  // Return OVERALL aggregated stats
  const aggregateTeams = await Team.aggregate([
    {
      $group: {
        _id: "$name",
        name: { $first: "$name" },
        played: { $sum: "$stats.played" },
        wins: { $sum: "$stats.wins" },
        losses: { $sum: "$stats.losses" },
        ties: { $sum: "$stats.ties" },
        noResults: { $sum: "$stats.noResults" },
        points: { $sum: "$stats.points" },
        runsScored: { $sum: "$stats.runsScored" },
        ballsFaced: { $sum: "$stats.ballsFaced" },
        runsConceded: { $sum: "$stats.runsConceded" },
        ballsBowled: { $sum: "$stats.ballsBowled" },
        
        // We will just take the absolute max/min across their documents
        highestSuccessfulChaseRuns: { $max: "$stats.highestSuccessfulChase.runs" },
        lowestTotalDefendedRuns: { $min: { $cond: [ { $gt: ["$stats.lowestTotalDefended.runs", null] }, "$stats.lowestTotalDefended.runs", 9999 ] } }
      }
    }
  ]);

  return aggregateTeams.map(team => {
    // Format derived NRR
    const nrr = team.ballsFaced > 0 && team.ballsBowled > 0
      ? (team.runsScored / (team.ballsFaced / 6) - team.runsConceded / (team.ballsBowled / 6)).toFixed(2)
      : 0;

    return {
      name: team.name,
      stats: {
        played: team.played,
        wins: team.wins,
        losses: team.losses,
        ties: team.ties,
        noResults: team.noResults,
        points: team.points,
        highestSuccessfulChase: { runs: team.highestSuccessfulChaseRuns },
        lowestTotalDefended: { runs: team.lowestTotalDefendedRuns === 9999 ? null : team.lowestTotalDefendedRuns },
      },
      derived: {
        netRunRate: nrr,
      }
    };
  }).sort(sortByPointsAndNrr);
};

const formatTeamRecord = (team) => {
  const nrr = team.stats.ballsFaced > 0 && team.stats.ballsBowled > 0
    ? (team.stats.runsScored / (team.stats.ballsFaced / 6) - team.stats.runsConceded / (team.stats.ballsBowled / 6)).toFixed(2)
    : 0;
  return { ...team, derived: { netRunRate: nrr } };
};

const sortByPointsAndNrr = (a, b) => {
  if (b.stats.points !== a.stats.points) {
    return b.stats.points - a.stats.points;
  }
  return b.derived.netRunRate - a.derived.netRunRate;
};
