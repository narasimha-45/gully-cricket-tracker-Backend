import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

/* =========================================================
   CONNECTIONS
========================================================= */

const OLD_URI = process.env.MONGO_OLD_URI;

const NEW_URI = process.env.TEST_MONGO_URI;

await mongoose.connect(NEW_URI);

const oldConnection = await mongoose.createConnection(OLD_URI).asPromise();

console.log("✅ OLD DB connected");
console.log("✅ NEW DB connected");

/* =========================================================
   GENERIC SCHEMA
========================================================= */

const GenericSchema = new mongoose.Schema({}, { strict: false });

/* =========================================================
   OLD MODELS
========================================================= */

const OldSeason = oldConnection.model("Season", GenericSchema, "seasons");
const OldTeam = oldConnection.model("Team", GenericSchema, "teams");
const OldMatch = oldConnection.model("Match", GenericSchema, "matches");

/* =========================================================
   NEW MODELS
========================================================= */

const Season = mongoose.model("Season", GenericSchema, "seasons");
const Team = mongoose.model("Team", GenericSchema, "teams");
const Match = mongoose.model("Match", GenericSchema, "matches");

const PlayerSeasonStats = mongoose.model(
  "PlayerSeasonStats",
  GenericSchema,
  "playerseasonstats",
);

const OverallPlayerStats = mongoose.model(
  "OverallPlayerStats",
  GenericSchema,
  "overallplayerstats",
);

const PlayerProfile = mongoose.model(
  "PlayerProfile",
  GenericSchema,
  "playerprofiles",
);

const PlayerMatchPerformance = mongoose.model(
  "PlayerMatchPerformance",
  GenericSchema,
  "playermatchperformances",
);

/* =========================================================
   HELPERS
========================================================= */

const norm = (v) => (v || "").trim().toLowerCase();

function renameTeam(name) {
  const normalized = norm(name);

  if (normalized === "lokesh team" || normalized === "lokesh's team") {
    return "eagles";
  }

  if (normalized === "narasimha team" || normalized === "narasimha's team") {
    return "spider";
  }

  return normalized;
}

function scoreBuckets() {
  return Array(11).fill(0);
}

function getBucket(runs) {
  if (runs >= 100) return 10;
  return Math.floor(runs / 10);
}

function ballsToOvers(balls) {
  return Math.floor(balls / 6) + (balls % 6 > 0 ? (balls % 6) / 10 : 0);
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

function incNested(obj, key1, key2) {
  if (!obj[key1]) obj[key1] = { total: 0 };
  if (typeof obj[key1] === "number") {
    // Migration fallback if somehow it was a number
    obj[key1] = { total: obj[key1] };
  }
  obj[key1].total = (obj[key1].total || 0) + 1;
  obj[key1][key2] = (obj[key1][key2] || 0) + 1;
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
    seasonStatsMap.set(key, createStats({ seasonId, name }));
  }

  return seasonStatsMap.get(key);
}

function getOverallStats(name) {
  if (!overallStatsMap.has(name)) {
    overallStatsMap.set(name, createStats({ name }));
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
    performanceMap.set(key, { matchId, name });
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

  const mergedTeamsMap = new Map();

  for (const team of teams) {
    const renamed = renameTeam(team.name);
    const key = `${team.seasonId}_${renamed}`;

    if (!mergedTeamsMap.has(key)) {
      mergedTeamsMap.set(key, {
        ...team,

        name: renamed,

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

          highestScore: { runs: 0, wickets: 0, overs: 0, matchId: null },
          lowestScore: { runs: null, wickets: null, overs: 0, matchId: null },

          // REPLACE the 6 defended/chase records with these:
          defending: {
            wins: [], // matchIds where they batted first and won
            losses: [], // matchIds where they batted first and lost
          },

          chasing: {
            wins: [], // matchIds where they batted second and won
            losses: [], // matchIds where they batted second and lost
          },

          highestTotalDefended: {
            runs: 0,
            wickets: 0,
            overs: 0,
            againstTeamId: null,
            matchId: null,
          },
          lowestTotalDefended: {
            runs: null,
            wickets: 0,
            overs: 0,
            againstTeamId: null,
            matchId: null,
          },
          highestSuccessfulChase: {
            runs: 0,
            wickets: 0,
            overs: 0,
            ballsRemaining: 0,
            againstTeamId: null,
            matchId: null,
          },
          lowestSuccessfulChase: {
            runs: null,
            wickets: 0,
            overs: 0,
            ballsRemaining: 0,
            againstTeamId: null,
            matchId: null,
          },
        },
      });
    }
  }

  const updatedTeams = Array.from(mergedTeamsMap.values());

  if (updatedTeams.length) {
    await Team.insertMany(updatedTeams);
  }

  updatedTeams.forEach((team) => {
    const key = `${team.seasonId}_${norm(team.name)}`;
    teamMap.set(key, team);
  });

  console.log(`✅ Teams: ${updatedTeams.length}`);

  console.log("🚀 Migrating Matches");

  const matches = await OldMatch.find({}).lean();

  const updatedMatches = matches.map((match) => ({
    ...match,

    teams: {
      teamA: {
        ...match.teams.teamA,
        name: renameTeam(match.teams.teamA.name),
      },
      teamB: {
        ...match.teams.teamB,
        name: renameTeam(match.teams.teamB.name),
      },
    },

    innings: (match.innings || []).map((innings) => ({
      ...innings,
      battingTeam: renameTeam(innings.battingTeam),
      bowlingTeam: renameTeam(innings.bowlingTeam),
    })),

    result: match.result
      ? {
          ...match.result,
          winner: renameTeam(match.result.winner),
        }
      : match.result,
  }));

  if (updatedMatches.length) {
    await Match.insertMany(updatedMatches);
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
      `${match.seasonId}_${norm(innings.battingTeam)}`,
    );

    const bowlingTeam = teamMap.get(
      `${match.seasonId}_${norm(innings.bowlingTeam)}`,
    );

    if (!battingTeam || !bowlingTeam) continue;

    const runs = innings.totalRuns || 0;
    const wickets = innings.wickets || 0;
    const balls = innings.balls || 0;
    const overs = ballsToOvers(balls);

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
        overs,
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
        overs,
        matchId: match._id,
      };
    }
  }

  const teamA = teamMap.get(
    `${match.seasonId}_${norm(match.teams.teamA.name)}`,
  );

  const teamB = teamMap.get(
    `${match.seasonId}_${norm(match.teams.teamB.name)}`,
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

  const normalizedWinner = norm(winner);

  const winTeam = normalizedWinner === norm(teamA.name) ? teamA : teamB;
  const loseTeam = normalizedWinner === norm(teamA.name) ? teamB : teamA;

  winTeam.stats.wins += 1;
  loseTeam.stats.losses += 1;
  winTeam.stats.points += 2;

  if (match.result.margin > winTeam.stats.biggestWin.margin) {
    winTeam.stats.biggestWin = {
      margin: match.result.margin,
      type: match.result.type,
      matchId: match._id,
    };
  }

  /* =====================================================
     DEFENDED / CHASE RECORDS
  ===================================================== */

  const firstInnings = match.innings?.[0];
  const secondInnings = match.innings?.[1];

  if (firstInnings && secondInnings) {
    const firstBatTeam = teamMap.get(
      `${match.seasonId}_${norm(firstInnings.battingTeam)}`,
    );

    const secondBatTeam = teamMap.get(
      `${match.seasonId}_${norm(secondInnings.battingTeam)}`,
    );

    const firstRuns = firstInnings.totalRuns || 0;
    const firstWickets = firstInnings.wickets || 0;
    const firstBalls = firstInnings.balls || 0;
    const firstOvers = ballsToOvers(firstBalls);

    const secondRuns = secondInnings.totalRuns || 0;
    const secondWickets = secondInnings.wickets || 0;
    const secondBalls = secondInnings.balls || 0;
    const secondOvers = ballsToOvers(secondBalls);

    /* ================================================
       SUCCESSFUL DEFENCE
    ================================================ */

    if (winTeam._id.toString() === firstBatTeam?._id.toString()) {
      if (firstRuns > winTeam.stats.highestTotalDefended.runs) {
        winTeam.stats.highestTotalDefended = {
          runs: firstRuns,
          wickets: firstWickets,
          overs: firstOvers,
          againstTeamId: loseTeam._id,
          matchId: match._id,
        };
      }

      if (
        winTeam.stats.lowestTotalDefended.runs === null ||
        firstRuns < winTeam.stats.lowestTotalDefended.runs
      ) {
        winTeam.stats.lowestTotalDefended = {
          runs: firstRuns,
          wickets: firstWickets,
          overs: firstOvers,
          againstTeamId: loseTeam._id,
          matchId: match._id,
        };
      }
    }

    if (winTeam._id.toString() === firstBatTeam?._id.toString()) {
      // win team batted first → defended successfully
      winTeam.stats.defending.wins.push(match._id);
      loseTeam.stats.chasing.losses.push(match._id);

      // highest/lowest total defended (existing logic)...
    } else if (winTeam._id.toString() === secondBatTeam?._id.toString()) {
      // win team batted second → chased successfully
      winTeam.stats.chasing.wins.push(match._id);
      loseTeam.stats.defending.losses.push(match._id);

      // highest/lowest successful chase (existing logic)...
    }

    /* ================================================
       SUCCESSFUL CHASE
    ================================================ */

    if (winTeam._id.toString() === secondBatTeam?._id.toString()) {
      const totalBalls = (match.matchConfig?.overs || 0) * 6;
      const ballsUsed = secondInnings.balls || 0;
      const ballsRemaining = Math.max(totalBalls - ballsUsed, 0);

      if (secondRuns > winTeam.stats.highestSuccessfulChase.runs) {
        winTeam.stats.highestSuccessfulChase = {
          runs: secondRuns,
          wickets: secondWickets,
          overs: secondOvers,
          ballsRemaining,
          againstTeamId: loseTeam._id,
          matchId: match._id,
        };
      }

      if (
        winTeam.stats.lowestSuccessfulChase.runs === null ||
        secondRuns < winTeam.stats.lowestSuccessfulChase.runs
      ) {
        winTeam.stats.lowestSuccessfulChase = {
          runs: secondRuns,
          wickets: secondWickets,
          overs: secondOvers,
          ballsRemaining,
          againstTeamId: loseTeam._id,
          matchId: match._id,
        };
      }
    }
  }
}

/* =========================================================
   PROFILE HELPERS
========================================================= */

function addSeasonToProfile(profile, seasonId) {
  const already = profile.seasonsPlayed.some(
    (id) => id.toString() === seasonId.toString(),
  );
  if (!already) {
    profile.seasonsPlayed.push(seasonId);
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
      innings.battingStats || {},
    )) {
      const name = norm(rawName);

      const seasonStats = getSeasonStats(match.seasonId, name);
      const overallStats = getOverallStats(name);
      const profile = getProfile(name);
      const perf = getPerformance(match._id, name);

      const runs = batter.runs || 0;
      const balls = batter.balls || 0;
      const fours = batter.fours || 0;
      const sixes = batter.sixes || 0;
      const dismissal = batter.dismissal || null;
      const didBat = balls > 0 || runs > 0;
      const isOut = !!dismissal;

      if (!processedPlayers.has(name)) {
        processedPlayers.add(name);
        seasonStats.totalMatches += 1;
        overallStats.totalMatches += 1;
        profile.totalMatches += 1;
      }

      addSeasonToProfile(profile, match.seasonId);

      const battingTeamName = norm(battingTeam);
      if (!profile.teamsPlayedFor.includes(battingTeamName)) {
        profile.teamsPlayedFor.push(battingTeamName);
      }

      profile.lastMatchAt = match.createdAt;

      for (const stats of [seasonStats, overallStats]) {
        if (didBat) {
          stats.batting.innings += 1;
          stats.batting.runs += runs;
          stats.batting.balls += balls;
          stats.batting.fours += fours;
          stats.batting.sixes += sixes;

          if (isOut) {
            stats.batting.outs += 1;
          } else {
            stats.batting.notOuts += 1;
          }

          if (isOut && runs === 0) {
            stats.batting.ducks += 1;
          }

          stats.batting.scoreRanges[getBucket(runs)] += 1;
        }

        if (runs > stats.batting.highestScore.runs) {
          stats.batting.highestScore = {
            runs,
            matchId: match._id,
            seasonId: match.seasonId,
          };
        }

        if (dismissal?.type) {
          const key = dismissalKey(dismissal.type);
          if (key && stats.batting.dismissalTypes[key] !== undefined) {
            stats.batting.dismissalTypes[key] += 1;
          }
        }

        if (
          dismissal?.bowler &&
          dismissal?.type &&
          dismissal.type !== "RUN_OUT"
        ) {
          const bName = norm(dismissal.bowler);
          const dType = dismissalKey(dismissal.type) || "other";
          incNested(stats.batting.dismissedBy, bName, dType);
        }
      }

      const mom = norm(match.result?.manOfTheMatch);

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
        dismissal: dismissal || { type: "NOT_OUT" },
      };

      perf.result = {
        won: norm(match.result?.winner) === norm(battingTeam),
        mom: mom === name,
      };
    }

    /* =====================================================
       BOWLING
    ===================================================== */

    for (const [rawName, bowler] of Object.entries(
      innings.bowlingStats || {},
    )) {
      const name = norm(rawName);

      const seasonStats = getSeasonStats(match.seasonId, name);
      const overallStats = getOverallStats(name);
      const profile = getProfile(name);
      const perf = getPerformance(match._id, name);

      const balls = bowler.balls || 0;
      const runs = bowler.runs || 0;
      const wickets = bowler.wickets || 0;
      const maidens = bowler.maidens || 0;

      if (!processedPlayers.has(name)) {
        processedPlayers.add(name);
        seasonStats.totalMatches += 1;
        overallStats.totalMatches += 1;
        profile.totalMatches += 1;
      }

      addSeasonToProfile(profile, match.seasonId);

      const bowlingTeamName = norm(bowlingTeam);
      if (!profile.teamsPlayedFor.includes(bowlingTeamName)) {
        profile.teamsPlayedFor.push(bowlingTeamName);
      }

      profile.lastMatchAt = match.createdAt;

      /* =====================================================
         BOWLING ANALYTICS & WICKET COUNT
      ===================================================== */

      let actualWickets = 0;

      for (const [batterName, dismissal] of Object.entries(
        innings.dismissals || {},
      )) {
        if (!dismissal) continue;
        if (norm(dismissal.bowler) !== name) continue;
        if (dismissal.type === "RUN_OUT") continue;

        actualWickets += 1;

        const key = dismissalKey(dismissal.type);

        if (key && seasonStats.bowling.wicketTypes[key] !== undefined) {
          seasonStats.bowling.wicketTypes[key] += 1;
          overallStats.bowling.wicketTypes[key] += 1;
        }

        const bName = norm(batterName);
        const dType = dismissalKey(dismissal.type) || "other";
        incNested(seasonStats.bowling.dismissedBatters, bName, dType);
        incNested(overallStats.bowling.dismissedBatters, bName, dType);

        if (!perf.bowling) perf.bowling = {};
        if (!perf.bowling.dismissedBatters) perf.bowling.dismissedBatters = [];

        perf.bowling.dismissedBatters.push({
          name: norm(batterName),
          type: dismissal.type,
        });
      }

      for (const stats of [seasonStats, overallStats]) {
        if (balls > 0) {
          stats.bowling.innings += 1;
        }

        stats.bowling.balls += balls;
        stats.bowling.runs += runs;
        stats.bowling.wickets += actualWickets;
        stats.bowling.maidens += maidens;

        const best = stats.bowling.bestBowling;

        if (
          actualWickets > best.wickets ||
          (actualWickets === best.wickets && runs < best.runs)
        ) {
          stats.bowling.bestBowling = {
            wickets: actualWickets,
            runs,
            matchId: match._id,
            seasonId: match.seasonId,
          };
        }

        if (actualWickets >= 3) stats.bowling.wicketHauls.w3 += 1;
        if (actualWickets >= 4) stats.bowling.wicketHauls.w4 += 1;
        if (actualWickets >= 5) stats.bowling.wicketHauls.w5 += 1;
      }

      if (!perf.playedFor) {
        perf.playedFor = bowlingTeam;
        perf.opponent = battingTeam;
        perf.matchDate = match.createdAt;
        perf.matchId = match._id;
        perf.seasonId = match.seasonId;
      }

      if (!perf.result) {
        const mom = norm(match.result?.manOfTheMatch);
        perf.result = {
          won: norm(match.result?.winner) === norm(bowlingTeam),
          mom: mom === name,
        };
      }

      perf.bowling = {
        ...perf.bowling,
        bowled: balls > 0,
        balls,
        runs,
        wickets: actualWickets,
        maidens,
      };
    }

    /* =====================================================
       FIELDING
    ===================================================== */

    for (const dismissal of Object.values(innings.dismissals || {})) {
      if (!dismissal?.fielder) continue;

      const name = norm(dismissal.fielder);
      const seasonStats = getSeasonStats(match.seasonId, name);
      const overallStats = getOverallStats(name);

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
      Array.from(teamMap.values()).map((team) => ({
        replaceOne: {
          filter: { _id: team._id },
          replacement: team,
        },
      })),
    );
  }

  if (seasonStatsMap.size) {
    await PlayerSeasonStats.insertMany(Array.from(seasonStatsMap.values()));
  }

  if (overallStatsMap.size) {
    await OverallPlayerStats.insertMany(Array.from(overallStatsMap.values()));
  }

  if (profileMap.size) {
    await PlayerProfile.insertMany(Array.from(profileMap.values()));
  }

  if (performanceMap.size) {
    await PlayerMatchPerformance.insertMany(
      Array.from(performanceMap.values()),
    );
  }

  console.log("✅ Aggregated Stats Saved");
}

/* =========================================================
   BACKFILL
========================================================= */

async function backfill() {
  console.log("🚀 Starting Backfill");

  const matches = await Match.find({}).sort({ createdAt: 1 }).lean();

  console.log(`📦 Total Matches: ${matches.length}`);

  for (const match of matches) {
    await Season.findByIdAndUpdate(match.seasonId, {
      $inc: { matchesCount: 1 },
    });
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
