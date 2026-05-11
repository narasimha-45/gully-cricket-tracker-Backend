import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

/* =========================================================
   CONNECTIONS
========================================================= */

const OLD_URI = process.env.MONGO_OLD_URI;

const NEW_URI = process.env.MONGO_URI;

await mongoose.connect(NEW_URI);

const oldConnection = await mongoose
  .createConnection(OLD_URI)
  .asPromise();

console.log("✅ OLD DB connected");
console.log("✅ NEW DB connected");

/* =========================================================
   GENERIC SCHEMA
========================================================= */

const GenericSchema = new mongoose.Schema({}, { strict: false });

/* =========================================================
   OLD MODELS
========================================================= */

const OldSeason = oldConnection.model(
  "Season",
  GenericSchema,
  "seasons"
);

const OldTeam = oldConnection.model(
  "Team",
  GenericSchema,
  "teams"
);

const OldMatch = oldConnection.model(
  "Match",
  GenericSchema,
  "matches"
);

/* =========================================================
   NEW MODELS
========================================================= */

const Season = mongoose.model(
  "Season",
  GenericSchema,
  "seasons"
);

const Team = mongoose.model(
  "Team",
  GenericSchema,
  "teams"
);

const Match = mongoose.model(
  "Match",
  GenericSchema,
  "matches"
);

const PlayerSeasonStats = mongoose.model(
  "PlayerSeasonStats",
  GenericSchema,
  "playerseasonstats"
);

const OverallPlayerStats = mongoose.model(
  "OverallPlayerStats",
  GenericSchema,
  "overallplayerstats"
);

const PlayerProfile = mongoose.model(
  "PlayerProfile",
  GenericSchema,
  "playerprofiles"
);

const PlayerMatchPerformance = mongoose.model(
  "PlayerMatchPerformance",
  GenericSchema,
  "playermatchperformances"
);

/* =========================================================
   HELPERS
========================================================= */

const norm = (v) => (v || "").trim().toLowerCase();

function scoreBuckets() {
  return Array(11).fill(0);
}

function getBucket(runs) {
  if (runs >= 100) return 10;
  return Math.floor(runs / 10);
}

function dismissalKey(type) {
  switch (type) {
    case "BOWLED":
      return "bowled";

    case "CAUGHT":
      return "caught";

    case "LBW":
      return "lbw";

    case "STUMPED":
      return "stumped";

    case "HIT_WICKET":
      return "hitWicket";

    case "RUN_OUT":
      return "runOut";

    default:
      return null;
  }
}

function createStats(extra = {}) {
  return {
    ...extra,

    totalMatches: 0,

    batting: {
      matches: 0,
      innings: 0,
      outs: 0,
      notOuts: 0,

      runs: 0,
      balls: 0,

      fours: 0,
      sixes: 0,

      ducks: 0,

      highestScore: {
        runs: 0,
        matchId: null,
        seasonId: null,
      },

      scoreRanges: scoreBuckets(),

      dismissalTypes: {
        bowled: 0,
        caught: 0,
        lbw: 0,
        runOut: 0,
        stumped: 0,
        hitWicket: 0,
      },

      dismissedBy: {},
    },

    bowling: {
      matches: 0,
      innings: 0,

      balls: 0,
      runs: 0,
      wickets: 0,
      maidens: 0,

      bestBowling: {
        wickets: 0,
        runs: 999,
        matchId: null,
        seasonId: null,
      },

      wicketTypes: {
        bowled: 0,
        caught: 0,
        lbw: 0,
        stumped: 0,
        hitWicket: 0,
      },

      wicketHauls: {
        w3: 0,
        w4: 0,
        w5: 0,
      },

      dismissedBatters: {},
    },

    fielding: {
      catches: 0,
      stumpings: 0,
      runOuts: 0,
    },

    achievements: {
      mom: 0,
    },
  };
}

function inc(obj, key, value = 1) {
  obj[key] = (obj[key] || 0) + value;
}

/* =========================================================
   MEMORY AGGREGATORS
========================================================= */

const seasonStatsMap = new Map();
const overallStatsMap = new Map();
const profileMap = new Map();
const performanceMap = new Map();
const teamMap = new Map();

/* =========================================================
   GETTERS
========================================================= */

function getSeasonStats(seasonId, name) {
  const key = `${seasonId}_${name}`;

  if (!seasonStatsMap.has(key)) {
    seasonStatsMap.set(
      key,
      createStats({
        seasonId,
        name,
      })
    );
  }

  return seasonStatsMap.get(key);
}

function getOverallStats(name) {
  if (!overallStatsMap.has(name)) {
    overallStatsMap.set(
      name,
      createStats({
        name,
      })
    );
  }

  return overallStatsMap.get(name);
}

function getProfile(name) {
  if (!profileMap.has(name)) {
    profileMap.set(name, {
      name,
      totalMatches: 0,
      seasonsPlayed: [],
      teamsPlayedFor: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMatchAt: null,
    });
  }

  return profileMap.get(name);
}

function getPerformance(matchId, name) {
  const key = `${matchId}_${name}`;

  if (!performanceMap.has(key)) {
    performanceMap.set(key, {
      matchId,
      name,
    });
  }

  return performanceMap.get(key);
}

/* =========================================================
   RAW MIGRATION
========================================================= */

async function migrateRawData() {
  console.log("🚀 Migrating Seasons");

  const seasons = await OldSeason.find({}).lean();

  if (seasons.length) {
    await Season.insertMany(seasons);
  }

  console.log(`✅ Seasons: ${seasons.length}`);

  console.log("🚀 Migrating Teams");

  const teams = await OldTeam.find({}).lean();

  const updatedTeams = teams.map((team) => ({
    ...team,

    stats: {
      played: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      noResults: 0,
      points: 0,

      runsScored: 0,
      wicketsLost: 0,
      ballsFaced: 0,

      runsConceded: 0,
      wicketsTaken: 0,
      ballsBowled: 0,

      biggestWin: {
        margin: 0,
        type: null,
        matchId: null,
      },

      highestScore: {
        runs: 0,
        wickets: 0,
        matchId: null,
      },

      lowestScore: {
        runs: null,
        wickets: null,
        matchId: null,
      },
    },
  }));

  if (updatedTeams.length) {
    await Team.insertMany(updatedTeams);
  }

  updatedTeams.forEach((team) => {
    const key = `${team.seasonId}_${team.name}`;
    teamMap.set(key, team);
  });

  console.log(`✅ Teams: ${updatedTeams.length}`);

  console.log("🚀 Migrating Matches");

  const matches = await OldMatch.find({}).lean();

  if (matches.length) {
    await Match.insertMany(matches);
  }

  console.log(`✅ Matches: ${matches.length}`);
}

/* =========================================================
   TEAM STATS
========================================================= */

function updateTeamStats(match) {
  if (!match.result) return;

  for (const innings of match.innings || []) {
    const battingTeam = teamMap.get(
      `${match.seasonId}_${innings.battingTeam}`
    );

    const bowlingTeam = teamMap.get(
      `${match.seasonId}_${innings.bowlingTeam}`
    );

    if (!battingTeam || !bowlingTeam) continue;

    const runs = innings.totalRuns || 0;
    const wickets = innings.wickets || 0;
    const balls = innings.balls || 0;

    battingTeam.stats.runsScored += runs;
    battingTeam.stats.wicketsLost += wickets;
    battingTeam.stats.ballsFaced += balls;

    bowlingTeam.stats.runsConceded += runs;
    bowlingTeam.stats.wicketsTaken += wickets;
    bowlingTeam.stats.ballsBowled += balls;

    if (runs > battingTeam.stats.highestScore.runs) {
      battingTeam.stats.highestScore = {
        runs,
        wickets,
        matchId: match._id,
      };
    }

    if (
      battingTeam.stats.lowestScore.runs === null ||
      runs < battingTeam.stats.lowestScore.runs
    ) {
      battingTeam.stats.lowestScore = {
        runs,
        wickets,
        matchId: match._id,
      };
    }
  }

  const teamA = teamMap.get(
    `${match.seasonId}_${match.teams.teamA.name}`
  );

  const teamB = teamMap.get(
    `${match.seasonId}_${match.teams.teamB.name}`
  );

  if (!teamA || !teamB) return;

  teamA.stats.played += 1;
  teamB.stats.played += 1;

  const winner = match.result.winner;

  if (!winner || winner === "TIED") {
    teamA.stats.ties += 1;
    teamB.stats.ties += 1;

    teamA.stats.points += 1;
    teamB.stats.points += 1;

    return;
  }

  const winTeam =
    winner === teamA.name
      ? teamA
      : teamB;

  const loseTeam =
    winner === teamA.name
      ? teamB
      : teamA;

  winTeam.stats.wins += 1;
  loseTeam.stats.losses += 1;

  winTeam.stats.points += 2;

  if (
    match.result.margin >
    winTeam.stats.biggestWin.margin
  ) {
    winTeam.stats.biggestWin = {
      margin: match.result.margin,
      type: match.result.type,
      matchId: match._id,
    };
  }
}

/* =========================================================
   PLAYER BACKFILL
========================================================= */

function processMatch(match) {
  const processedPlayers = new Set();

  for (const innings of match.innings || []) {
    const battingTeam = innings.battingTeam;
    const bowlingTeam = innings.bowlingTeam;

    /* =====================================================
       BATTING
    ===================================================== */

    for (const [rawName, batter] of Object.entries(
      innings.battingStats || {}
    )) {
      const name = norm(rawName);

      const seasonStats = getSeasonStats(
        match.seasonId,
        name
      );

      const overallStats =
        getOverallStats(name);

      const profile = getProfile(name);

      const perf = getPerformance(
        match._id,
        name
      );

      const runs = batter.runs || 0;
      const balls = batter.balls || 0;
      const fours = batter.fours || 0;
      const sixes = batter.sixes || 0;

      const dismissal =
        batter.dismissal || null;

      const didBat =
        balls > 0 || runs > 0;

      const isOut = !!dismissal;

      if (!processedPlayers.has(name)) {
        processedPlayers.add(name);

        seasonStats.totalMatches += 1;
        overallStats.totalMatches += 1;

        profile.totalMatches += 1;
      }

      if (
        !profile.seasonsPlayed.includes(
          match.seasonId
        )
      ) {
        profile.seasonsPlayed.push(
          match.seasonId
        );
      }

      if (
        !profile.teamsPlayedFor.includes(
          battingTeam
        )
      ) {
        profile.teamsPlayedFor.push(
          battingTeam
        );
      }

      profile.lastMatchAt =
        match.createdAt;

      for (const stats of [
        seasonStats,
        overallStats,
      ]) {
        stats.batting.matches += 1;

        if (didBat) {
          stats.batting.innings += 1;
        }

        stats.batting.runs += runs;
        stats.batting.balls += balls;

        stats.batting.fours += fours;
        stats.batting.sixes += sixes;

        if (isOut) {
          stats.batting.outs += 1;
        } else {
          stats.batting.notOuts += 1;
        }

        if (
          didBat &&
          isOut &&
          runs === 0
        ) {
          stats.batting.ducks += 1;
        }

        if (didBat) {
          stats.batting.scoreRanges[
            getBucket(runs)
          ] += 1;
        }

        if (
          runs >
          stats.batting.highestScore.runs
        ) {
          stats.batting.highestScore = {
            runs,
            matchId: match._id,
            seasonId: match.seasonId,
          };
        }

        if (dismissal?.type) {
          const key = dismissalKey(
            dismissal.type
          );

          if (
            key &&
            stats.batting.dismissalTypes[
              key
            ] !== undefined
          ) {
            stats.batting.dismissalTypes[
              key
            ] += 1;
          }
        }

        if (dismissal?.bowler) {
          inc(
            stats.batting.dismissedBy,
            norm(dismissal.bowler)
          );
        }
      }

      const mom = norm(
        match.result?.manOfTheMatch
      );

      if (mom === name) {
        seasonStats.achievements.mom += 1;
        overallStats.achievements.mom += 1;
      }

      perf.matchId = match._id;
      perf.seasonId = match.seasonId;

      perf.matchDate = match.createdAt;

      perf.playedFor = battingTeam;
      perf.opponent = bowlingTeam;

      perf.batting = {
        played: true,
        innings: didBat,
        runs,
        balls,
        fours,
        sixes,
        dismissal:
          dismissal || {
            type: "NOT_OUT",
          },
      };

      perf.result = {
        won:
          match.result?.winner ===
          battingTeam,

        mom: mom === name,
      };
    }

    /* =====================================================
       BOWLING
    ===================================================== */

    for (const [rawName, bowler] of Object.entries(
      innings.bowlingStats || {}
    )) {
      const name = norm(rawName);

      const seasonStats = getSeasonStats(
        match.seasonId,
        name
      );

      const overallStats =
        getOverallStats(name);

      const profile = getProfile(name);

      const perf = getPerformance(
        match._id,
        name
      );

      const balls = bowler.balls || 0;
      const runs = bowler.runs || 0;
      const wickets =
        bowler.wickets || 0;

      const maidens =
        bowler.maidens || 0;

      if (!processedPlayers.has(name)) {
        processedPlayers.add(name);

        seasonStats.totalMatches += 1;
        overallStats.totalMatches += 1;

        profile.totalMatches += 1;
      }

      if (
        !profile.seasonsPlayed.includes(
          match.seasonId
        )
      ) {
        profile.seasonsPlayed.push(
          match.seasonId
        );
      }

      if (
        !profile.teamsPlayedFor.includes(
          bowlingTeam
        )
      ) {
        profile.teamsPlayedFor.push(
          bowlingTeam
        );
      }

      profile.lastMatchAt =
        match.createdAt;

      for (const stats of [
        seasonStats,
        overallStats,
      ]) {
        stats.bowling.matches += 1;

        if (balls > 0) {
          stats.bowling.innings += 1;
        }

        stats.bowling.balls += balls;
        stats.bowling.runs += runs;

        stats.bowling.wickets +=
          wickets;

        stats.bowling.maidens +=
          maidens;

        const best =
          stats.bowling.bestBowling;

        if (
          wickets > best.wickets ||
          (wickets === best.wickets &&
            runs < best.runs)
        ) {
          stats.bowling.bestBowling = {
            wickets,
            runs,
            matchId: match._id,
            seasonId: match.seasonId,
          };
        }

        if (wickets >= 3) {
          stats.bowling.wicketHauls.w3 += 1;
        }

        if (wickets >= 4) {
          stats.bowling.wicketHauls.w4 += 1;
        }

        if (wickets >= 5) {
          stats.bowling.wicketHauls.w5 += 1;
        }
      }

      for (const [batterName, dismissal] of Object.entries(
        innings.dismissals || {}
      )) {
        if (!dismissal) continue;

        if (
          norm(dismissal.bowler) !==
          name
        ) {
          continue;
        }

        if (
          dismissal.type === "RUN_OUT"
        ) {
          continue;
        }

        const key = dismissalKey(
          dismissal.type
        );

        if (
          key &&
          seasonStats.bowling
            .wicketTypes[key] !==
            undefined
        ) {
          seasonStats.bowling.wicketTypes[
            key
          ] += 1;

          overallStats.bowling.wicketTypes[
            key
          ] += 1;
        }

        inc(
          seasonStats.bowling
            .dismissedBatters,
          norm(batterName)
        );

        inc(
          overallStats.bowling
            .dismissedBatters,
          norm(batterName)
        );
      }

      perf.bowling = {
        bowled: balls > 0,
        balls,
        runs,
        wickets,
        maidens,
      };
    }

    /* =====================================================
       FIELDING
    ===================================================== */

    for (const dismissal of Object.values(
      innings.dismissals || {}
    )) {
      if (!dismissal?.fielder) continue;

      const name = norm(
        dismissal.fielder
      );

      const seasonStats = getSeasonStats(
        match.seasonId,
        name
      );

      const overallStats =
        getOverallStats(name);

      switch (dismissal.type) {
        case "CAUGHT":
          seasonStats.fielding.catches += 1;
          overallStats.fielding.catches += 1;
          break;

        case "RUN_OUT":
          seasonStats.fielding.runOuts += 1;
          overallStats.fielding.runOuts += 1;
          break;

        case "STUMPED":
          seasonStats.fielding.stumpings += 1;
          overallStats.fielding.stumpings += 1;
          break;
      }
    }
  }
}

/* =========================================================
   BULK SAVE
========================================================= */

async function bulkSave() {
  console.log("🚀 Saving Aggregated Stats");

  if (teamMap.size) {
    await Team.bulkWrite(
      Array.from(teamMap.values()).map(
        (team) => ({
          replaceOne: {
            filter: {
              _id: team._id,
            },
            replacement: team,
          },
        })
      )
    );
  }

  if (seasonStatsMap.size) {
    await PlayerSeasonStats.insertMany(
      Array.from(
        seasonStatsMap.values()
      )
    );
  }

  if (overallStatsMap.size) {
    await OverallPlayerStats.insertMany(
      Array.from(
        overallStatsMap.values()
      )
    );
  }

  if (profileMap.size) {
    await PlayerProfile.insertMany(
      Array.from(profileMap.values())
    );
  }

  if (performanceMap.size) {
    await PlayerMatchPerformance.insertMany(
      Array.from(
        performanceMap.values()
      )
    );
  }

  console.log("✅ Aggregated Stats Saved");
}

/* =========================================================
   BACKFILL
========================================================= */

async function backfill() {
  console.log("🚀 Starting Backfill");

  const matches = await Match.find({})
    .sort({
      createdAt: 1,
    })
    .lean();

  console.log(
    `📦 Total Matches: ${matches.length}`
  );

  for (const match of matches) {
    updateTeamStats(match);
    processMatch(match);
  }

  await bulkSave();

  console.log("🎉 Backfill Completed");
}

/* =========================================================
   MAIN
========================================================= */

async function main() {
  try {
    console.log("🧹 Clearing DB");

    await Promise.all([
      Season.deleteMany({}),
      Team.deleteMany({}),
      Match.deleteMany({}),
      PlayerSeasonStats.deleteMany({}),
      OverallPlayerStats.deleteMany({}),
      PlayerProfile.deleteMany({}),
      PlayerMatchPerformance.deleteMany({}),
    ]);

    console.log("✅ DB Cleared");

    await migrateRawData();

    await backfill();

    console.log("🎉 ALL DONE");

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();