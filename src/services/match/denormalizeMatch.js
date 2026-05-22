import PlayerProfile from "../../models/PlayerProfile.js";
import TeamProfile from "../../models/TeamProfile.js";

/* ======================================================
   EXTRACT UNIQUE IDS
====================================================== */

const extractIds = (match) => {
  const teamIds = new Set();
  const playerIds = new Set();

  const addTeam = (id) => {
    if (id) teamIds.add(id.toString());
  };
  
  const addPlayer = (id) => {
    if (id) playerIds.add(id.toString());
  };

  // Teams
  if (match.teams?.teamA) {
    addTeam(match.teams.teamA.teamId);
    (match.teams.teamA.players || []).forEach(addPlayer);
  }
  if (match.teams?.teamB) {
    addTeam(match.teams.teamB.teamId);
    (match.teams.teamB.players || []).forEach(addPlayer);
  }

  // Toss & Result
  if (match.toss?.winnerTeamId) addTeam(match.toss.winnerTeamId);
  if (match.result?.winnerTeamId) addTeam(match.result.winnerTeamId);
  if (match.result?.manOfTheMatchId) addPlayer(match.result.manOfTheMatchId);

  // Innings
  (match.innings || []).forEach((inn) => {
    addTeam(inn.battingTeamId);
    addTeam(inn.bowlingTeamId);
    (inn.battingOrder || []).forEach(addPlayer);

    // Batting stats
    Object.values(inn.battingStats || {}).forEach((stat) => {
      addPlayer(stat.playerId);
      if (stat.dismissal?.bowlerId) addPlayer(stat.dismissal.bowlerId);
      if (stat.dismissal?.fielderId) addPlayer(stat.dismissal.fielderId);
    });

    // Bowling stats
    Object.values(inn.bowlingStats || {}).forEach((stat) => {
      addPlayer(stat.playerId);
    });

    // Dismissals
    Object.values(inn.dismissals || {}).forEach((dismissal) => {
      addPlayer(dismissal.playerId);
      if (dismissal.bowlerId) addPlayer(dismissal.bowlerId);
      if (dismissal.fielderId) addPlayer(dismissal.fielderId);
    });

    // Ball by ball
    (inn.ballByBall || []).forEach((ball) => {
      addPlayer(ball.strikerId);
      addPlayer(ball.nonStrikerId);
      addPlayer(ball.bowlerId);
      if (ball.wicket) {
        addPlayer(ball.wicket.outBatsmanId);
        if (ball.wicket.helperId) addPlayer(ball.wicket.helperId);
      }
    });
  });

  return { teamIds: Array.from(teamIds), playerIds: Array.from(playerIds) };
};

/* ======================================================
   DENORMALIZE MATCH
====================================================== */

export const denormalizeMatch = async (match) => {
  if (!match) return null;
  const isArray = Array.isArray(match);
  const matches = isArray ? match : [match];

  const allTeamIds = new Set();
  const allPlayerIds = new Set();

  matches.forEach((m) => {
    const { teamIds, playerIds } = extractIds(m);
    teamIds.forEach((id) => allTeamIds.add(id));
    playerIds.forEach((id) => allPlayerIds.add(id));
  });

  const [teamProfiles, playerProfiles] = await Promise.all([
    TeamProfile.find({ _id: { $in: Array.from(allTeamIds) } }).lean(),
    PlayerProfile.find({ _id: { $in: Array.from(allPlayerIds) } }).lean(),
  ]);

  const teamIdToName = {};
  teamProfiles.forEach((t) => {
    teamIdToName[t._id.toString()] = t.name;
  });

  const playerIdToName = {};
  playerProfiles.forEach((p) => {
    playerIdToName[p._id.toString()] = p.name;
  });

  const getTeamName = (id) => id ? (teamIdToName[id.toString()] || id.toString()) : null;
  const getPlayerName = (id) => id ? (playerIdToName[id.toString()] || id.toString()) : null;

  const denormalizedMatches = matches.map((m) => {
    // Basic cloning
    const denorm = { ...m };

    if (denorm.teams) {
      denorm.teams = {
        teamA: {
          ...denorm.teams.teamA,
          name: getTeamName(denorm.teams.teamA.teamId),
          players: (denorm.teams.teamA.players || []).map(getPlayerName),
        },
        teamB: {
          ...denorm.teams.teamB,
          name: getTeamName(denorm.teams.teamB.teamId),
          players: (denorm.teams.teamB.players || []).map(getPlayerName),
        },
      };
      delete denorm.teams.teamA.teamId;
      delete denorm.teams.teamB.teamId;
    }

    if (denorm.toss && denorm.toss.winnerTeamId) {
      denorm.toss = { ...denorm.toss, winner: getTeamName(denorm.toss.winnerTeamId) };
      delete denorm.toss.winnerTeamId;
    }

    if (denorm.result && denorm.result.winnerTeamId) {
      denorm.result = {
        ...denorm.result,
        winner: getTeamName(denorm.result.winnerTeamId),
        manOfTheMatch: getPlayerName(denorm.result.manOfTheMatchId),
      };
      delete denorm.result.winnerTeamId;
      delete denorm.result.manOfTheMatchId;
    }

    if (denorm.innings) {
      denorm.innings = denorm.innings.map((inn) => {
        const dInn = { ...inn };
        
        dInn.battingTeam = getTeamName(dInn.battingTeamId);
        dInn.bowlingTeam = getTeamName(dInn.bowlingTeamId);
        delete dInn.battingTeamId;
        delete dInn.bowlingTeamId;

        // battingStats
        if (dInn.battingStats) {
          const newBattingStats = {};
          Object.values(dInn.battingStats).forEach((stat) => {
            const pName = getPlayerName(stat.playerId);
            const dStat = { ...stat };
            delete dStat.playerId;
            
            if (dStat.dismissal) {
              const dDismissal = { ...dStat.dismissal };
              if (dDismissal.bowlerId) {
                dDismissal.bowler = getPlayerName(dDismissal.bowlerId);
                delete dDismissal.bowlerId;
              }
              if (dDismissal.fielderId) {
                dDismissal.fielder = getPlayerName(dDismissal.fielderId);
                delete dDismissal.fielderId;
              }
              dStat.dismissal = dDismissal;
            }
            newBattingStats[pName] = dStat;
          });
          dInn.battingStats = newBattingStats;
        }

        // bowlingStats
        if (dInn.bowlingStats) {
          const newBowlingStats = {};
          Object.values(dInn.bowlingStats).forEach((stat) => {
            const pName = getPlayerName(stat.playerId);
            const dStat = { ...stat };
            delete dStat.playerId;
            newBowlingStats[pName] = dStat;
          });
          dInn.bowlingStats = newBowlingStats;
        }

        // dismissals
        if (dInn.dismissals) {
          const newDismissals = {};
          Object.values(dInn.dismissals).forEach((dismissal) => {
            const pName = getPlayerName(dismissal.playerId);
            const dDismissal = { ...dismissal };
            delete dDismissal.playerId;
            if (dDismissal.bowlerId) {
              dDismissal.bowler = getPlayerName(dDismissal.bowlerId);
              delete dDismissal.bowlerId;
            }
            if (dDismissal.fielderId) {
              dDismissal.fielder = getPlayerName(dDismissal.fielderId);
              delete dDismissal.fielderId;
            }
            newDismissals[pName] = dDismissal;
          });
          dInn.dismissals = newDismissals;
        }

        // ballByBall
        if (dInn.ballByBall) {
          dInn.ballByBall = dInn.ballByBall.map((ball) => {
            const dBall = { ...ball };
            dBall.striker = getPlayerName(dBall.strikerId);
            dBall.nonStriker = getPlayerName(dBall.nonStrikerId);
            dBall.bowler = getPlayerName(dBall.bowlerId);
            delete dBall.strikerId;
            delete dBall.nonStrikerId;
            delete dBall.bowlerId;

            if (dBall.wicket) {
              dBall.wicket = { ...dBall.wicket };
              dBall.wicket.outBatsman = getPlayerName(dBall.wicket.outBatsmanId);
              delete dBall.wicket.outBatsmanId;
              if (dBall.wicket.helperId) {
                dBall.wicket.helper = getPlayerName(dBall.wicket.helperId);
                delete dBall.wicket.helperId;
              }
            }
            return dBall;
          });
        }

        // Remove battingOrder of IDs and replace with array of names (though UI might not even use it directly)
        if (dInn.battingOrder) {
          dInn.battingOrder = dInn.battingOrder.map(getPlayerName);
        }

        return dInn;
      });
    }

    return denorm;
  });

  return isArray ? denormalizedMatches : denormalizedMatches[0];
};
