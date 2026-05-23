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

const OldMatch = oldConnection.model("Match", GenericSchema, "matches");

/* =========================================================
   NEW MODELS
========================================================= */

import Season from "../models/season.model.js";
import Match from "../models/match.model.js";

import PlayerProfile from "../models/PlayerProfile.js";
import TeamProfile from "../models/TeamProfile.js";

import OverallPlayerStats from "../models/OverallPlayerStats.js";
import SeasonPlayerStats from "../models/SeasonPlayerStats.js";

import OverallTeamStats from "../models/OverallTeamStats.js";
import SeasonTeamStats from "../models/SeasonTeamStats.js";

import OverallPlayerSplits from "../models/OverallPlayerSplits.js";
import SeasonPlayerSplits from "../models/SeasonPlayerSplits.js";

import OverallPlayerRivalry from "../models/OverallPlayerRivalry.js";
import SeasonPlayerRivalry from "../models/SeasonPlayerRivalry.js";

/* =========================================================
   HELPERS
========================================================= */

const normalize = (v = "") => v.trim().toLowerCase();

function renameTeam(name) {
  const n = normalize(name);
  if (n === "lokesh team" || n === "lokesh's team") return "eagles";
  if (n === "narasimha team" || n === "narasimha's team") return "spider";
  return n;
}

function ballsToOvers(balls = 0) {
  return Math.floor(balls / 6) + (balls % 6) / 10;
}

function getBucket(runs) {
  if (runs >= 100) return 9;
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
    case "RUN_OUT":
      return "runOut";
    case "STUMPED":
      return "stumped";
    case "HIT_WICKET":
      return "hitWicket";
    default:
      return null;
  }
}

const updateBestBowling = (split, wickets, runs) => {
  const current = split.bestBowling || {
    wickets: 0,
    runs: 9999,
  };

  const better =
    wickets > current.wickets ||
    (wickets === current.wickets && runs < current.runs);

  if (better) {
    split.bestBowling = {
      wickets,
      runs,
    };
  }
};

function pushRecentMatch(bucket, matchId, limit = 20) {
  if (!bucket.recentMatches) bucket.recentMatches = [];
  bucket.count += 1;
  bucket.recentMatches.unshift(matchId);
  bucket.recentMatches = bucket.recentMatches.slice(0, limit);
}

function pushRecentPerformance(target, perf, limit = 100) {
  if (!target.recentPerformances) target.recentPerformances = [];
  target.recentPerformances.unshift(perf);
  target.recentPerformances = target.recentPerformances.slice(0, limit);
}

function updateTopList(list, playerId, dismissalType = null) {
  const existing = list.find((x) => String(x.playerId) === String(playerId));

  if (existing) {
    existing.count += 1;
    if (dismissalType) {
      if (!existing.dismissalBreakdown) existing.dismissalBreakdown = {};
      existing.dismissalBreakdown[dismissalType] =
        (existing.dismissalBreakdown[dismissalType] || 0) + 1;
    }
  } else {
    const entry = { playerId, count: 1, dismissalBreakdown: {} };
    if (dismissalType) {
      entry.dismissalBreakdown[dismissalType] = 1;
    }
    list.push(entry);
  }

  list.sort((a, b) => b.count - a.count);
  return list.slice(0, 1000);
}

/* =========================================================
   DEFAULTS
========================================================= */

function defaultMatchRef() {
  return { count: 0, recentMatches: [] };
}

function defaultTeamStats() {
  return {
    played: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    noResults: 0,
    points: 0,

    wonBattingFirst: defaultMatchRef(),
    lostBattingFirst: defaultMatchRef(),
    wonBowlingFirst: defaultMatchRef(),
    lostBowlingFirst: defaultMatchRef(),
    successfulChases: defaultMatchRef(),
    failedChases: defaultMatchRef(),
    defendedTotals: defaultMatchRef(),
    failedDefends: defaultMatchRef(),

    runsScored: 0,
    wicketsLost: 0,
    ballsFaced: 0,

    runsConceded: 0,
    wicketsTaken: 0,
    ballsBowled: 0,

    biggestWins: {
      byRuns: { margin: 0, matchId: null },
      byWickets: { margin: 0, matchId: null },
    },

    highestScore: { runs: 0, wickets: 0, overs: 0, matchId: null },
    lowestScore: { runs: null, wickets: 0, overs: 0, matchId: null },
    highestSuccessfulChase: { target: 0, achieved: 0, matchId: null },
    lowestDefendedScore: { defended: 0, matchId: null },
  };
}

function defaultPlayerStats() {
  return {
    totalMatches: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    noResults: 0,

    batting: {
      innings: 0,
      outs: 0,
      notOuts: 0,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      ducks: 0,

      highestScore: { runs: 0, matchId: null },
      scoreBuckets: Array(10).fill(0),

      milestones: {
        thirtyPlus: 0,
        fiftyPlus: 0,
        hundredPlus: 0,
      },

      dismissalTypes: {
        bowled: 0,
        caught: 0,
        lbw: 0,
        runOut: 0,
        stumped: 0,
        hitWicket: 0,
        notOut: 0,
      },

      mostDismissedBy: [],
    },

    bowling: {
      innings: 0,
      balls: 0,
      runs: 0,
      wickets: 0,
      maidens: 0,

      bestBowling: { wickets: 0, runs: 999, matchId: null },

      wicketTypes: {
        bowled: 0,
        caught: 0,
        lbw: 0,
        stumped: 0,
        hitWicket: 0,
      },

      wicketHauls: { threeWickets: 0, fiveWickets: 0 },

      mostDismissedBatters: [],
    },

    fielding: { catches: 0, stumpings: 0, runOuts: 0 },

    achievements: { mom: 0 },

    recentPerformances: [],
  };
}

/* =========================================================
   IDENTITY MAPS
========================================================= */

const playerMap = new Map(); // normalized name → PlayerProfile doc
const teamMap = new Map(); // normalized name → TeamProfile doc

/* =========================================================
   ACCUMULATORS
========================================================= */

const acc = {
  overallPlayer: new Map(),
  seasonPlayer: new Map(),
  overallTeam: new Map(),
  seasonTeam: new Map(),
  overallPlayerSplits: new Map(),
  seasonPlayerSplits: new Map(),
};

function getPlayerAcc(map, key, extras = {}) {
  if (!map.has(key))
    map.set(key, {
      ...extras,
      seasonsPlayed: new Set(),
      ...defaultPlayerStats(),
    });
  return map.get(key);
}

function getTeamAcc(map, key, extras = {}) {
  if (!map.has(key))
    map.set(key, {
      ...extras,
      seasonsPlayed: new Set(),
      stats: defaultTeamStats(),
    });
  return map.get(key);
}

function defaultSplit() {
  return {
    matches: 0,
    innings: 0,
    runs: 0,
    balls: 0,
    outs: 0,
    wickets: 0,
    fours: 0,
    sixes: 0,
  };
}

function ensureSplit(container, key) {
  if (!container[key]) {
    container[key] = defaultSplit();
  }

  return container[key];
}

function getPlayerSplitAcc(map, key, extras = {}) {
  if (!map.has(key)) {
    map.set(key, {
      ...extras,

      batting: {
        byPosition: {},
        byOpponent: {},
        byTeam: {},
        byMatchResult: {},
        byInnings: {},
      },

      bowling: {
        byOpponent: {},
        byTeam: {},
        byMatchResult: {},
        byInnings: {},
      },

      battingInnings: [],

      bowlingInnings: [],
    });
  }

  return map.get(key);
}

/* =========================================================
   CLEAR DB
========================================================= */

async function clearDB() {
  console.log("🧹 Clearing new DB...");

  // Drop stale indexes that may conflict (e.g. old name_1 unique index)
  await Promise.all([
    OverallTeamStats.collection.dropIndexes().catch(() => {}),
    SeasonTeamStats.collection.dropIndexes().catch(() => {}),
  ]);

  await Promise.all([
    Season.deleteMany({}),
    Match.deleteMany({}),
    PlayerProfile.deleteMany({}),
    TeamProfile.deleteMany({}),
    OverallPlayerStats.deleteMany({}),
    SeasonPlayerStats.deleteMany({}),
    OverallTeamStats.deleteMany({}),
    SeasonTeamStats.deleteMany({}),
    OverallPlayerSplits.deleteMany({}),
    SeasonPlayerSplits.deleteMany({}),
    OverallPlayerRivalry.deleteMany({}),
    SeasonPlayerRivalry.deleteMany({}),
  ]);

  console.log("✅ DB Cleared");
}

/* =========================================================
   MIGRATE SEASONS
========================================================= */

async function migrateSeasons() {
  const seasons = await OldSeason.find({}).lean();
  if (seasons.length) await Season.insertMany(seasons);
  console.log(`✅ Seasons Migrated: ${seasons.length}`);
}

/* =========================================================
   CREATE PROFILES
========================================================= */

async function createProfiles(oldMatches) {
  for (const match of oldMatches) {
    for (const side of [match.teams.teamA, match.teams.teamB]) {
      const teamName = renameTeam(side.name);

      if (!teamMap.has(teamName)) {
        const doc = await TeamProfile.create({ name: teamName });
        teamMap.set(teamName, doc);
      }

      for (const rawPlayer of side.players) {
        const playerName = normalize(rawPlayer);
        if (!playerMap.has(playerName)) {
          const doc = await PlayerProfile.create({ name: playerName });
          playerMap.set(playerName, doc);
        }
      }
    }
  }

  console.log(
    `✅ Profiles Created:\n   Players: ${playerMap.size}\n   Teams: ${teamMap.size}`,
  );
}

/* =========================================================
   MIGRATE MATCHES
========================================================= */

async function migrateMatches(oldMatches) {
  const migrated = [];
  for (const match of oldMatches) {
    const teamA = teamMap.get(renameTeam(match.teams.teamA.name));
    const teamB = teamMap.get(renameTeam(match.teams.teamB.name));

    const innings = (match.innings || []).map((inn, index) => {
      const battingTeam = renameTeam(inn.battingTeam);
      const bowlingTeam = renameTeam(inn.bowlingTeam);

      return {
        ...inn,
        inningsNumber: inn.inningsNumber ?? index + 1,
        battingTeam,
        bowlingTeam,
        battingTeamId: battingTeam === teamA.name ? teamA._id : teamB._id,
        bowlingTeamId: bowlingTeam === teamA.name ? teamA._id : teamB._id,
      };
    });

    const result = match.result || {};

    migrated.push({
      ...match,

      teams: {
        teamA: {
          teamId: teamA._id,
          name: teamA.name,
          players: match.teams.teamA.players.map(
            (p) => playerMap.get(normalize(p))?._id,
          ),
        },
        teamB: {
          teamId: teamB._id,
          name: teamB.name,
          players: match.teams.teamB.players.map(
            (p) => playerMap.get(normalize(p))?._id,
          ),
        },
      },

      innings,

      result: {
        margin: result.margin,
        type: result.type,

        winnerTeamId:
          renameTeam(match.result?.winner) === teamA.name
            ? teamA._id
            : teamB._id,
        manOfTheMatchId: playerMap.get(normalize(match.result?.manOfTheMatch))
          ?._id,
      },
    });
  }
  if (migrated.length) {
    await Match.insertMany(migrated);

    // Count matches per season
    const seasonMatchCounts = {};

    for (const match of migrated) {
      const seasonId = String(match.seasonId);

      seasonMatchCounts[seasonId] = (seasonMatchCounts[seasonId] || 0) + 1;
    }

    // Increment totalMatches in seasons collection
    await Promise.all(
      Object.entries(seasonMatchCounts).map(([seasonId, count]) =>
        Season.updateOne({ _id: seasonId }, { $inc: { matchesCount: count } }),
      ),
    );
  }
  console.log(`✅ Matches Migrated: ${migrated.length}`);
}

/* =========================================================
   COMPUTE ANALYTICS
========================================================= */

function computeAnalytics(matches) {
  console.log(`🚀 Rebuilding Analytics for ${matches.length} matches`);

  for (const match of matches) {
    const seasonId = String(match.seasonId);
    const matchId = String(match._id); // ← always a plain string
    const winnerTeamId = match.result?.winnerTeamId;
    const teamAId = match.teams.teamA.teamId;
    const teamBId = match.teams.teamB.teamId;
    const manOfTheMatchId = match.result?.manOfTheMatchId
      ? String(match.result.manOfTheMatchId)
      : null;

    // console.log(manOfTheMatchName);

    /* ── Team accumulators ─────────────────────────────── */

    const otA = getTeamAcc(acc.overallTeam, String(teamAId), {
      teamId: teamAId,
      name: match.teams.teamA.name,
    });
    const otB = getTeamAcc(acc.overallTeam, String(teamBId), {
      teamId: teamBId,
      name: match.teams.teamB.name,
    });
    const stA = getTeamAcc(acc.seasonTeam, `${seasonId}_${teamAId}`, {
      seasonId: match.seasonId,
      teamId: teamAId,
      name: match.teams.teamA.name,
    });
    const stB = getTeamAcc(acc.seasonTeam, `${seasonId}_${teamBId}`, {
      seasonId: match.seasonId,
      teamId: teamBId,
      name: match.teams.teamB.name,
    });

    for (const t of [otA, otB, stA, stB]) t.stats.played += 1;

    otA.seasonsPlayed.add(String(seasonId));
    otB.seasonsPlayed.add(String(seasonId));

    if (String(winnerTeamId) === String(teamAId)) {
      otA.stats.wins += 1;
      stA.stats.wins += 1;
      otB.stats.losses += 1;
      stB.stats.losses += 1;
      otA.stats.points += 2;
      stA.stats.points += 2;
    } else if (String(winnerTeamId) === String(teamBId)) {
      otB.stats.wins += 1;
      stB.stats.wins += 1;
      otA.stats.losses += 1;
      stA.stats.losses += 1;
      otB.stats.points += 2;
      stB.stats.points += 2;
    } else {
      for (const t of [otA, otB, stA, stB]) {
        t.stats.ties += 1;
        t.stats.points += 1;
      }
    }

    /*
     * matchPerfMap  — pid → single perf object for this match
     * Built across all innings, flushed to recentPerformances ONCE
     * after all innings → guarantees exactly 1 entry per player per match.
     */
    const matchPerfMap = new Map();
    const processedPlayers = new Set();

    /* ── INNINGS LOOP ──────────────────────────────────── */

    for (const innings of match.innings || []) {
      const battingStats = innings.battingStats || {};
      const bowlingStats = innings.bowlingStats || {};
      const battingTeamId = innings.battingTeamId;
      const bowlingTeamId = innings.bowlingTeamId;
      const innKey = innings.inningsNumber === 1 ? "FIRST" : "SECOND";

      const battingWon = String(battingTeamId) === String(winnerTeamId);
      const bowlingWon = String(bowlingTeamId) === String(winnerTeamId);

      const battingOT = String(battingTeamId) === String(teamAId) ? otA : otB;
      const battingST = String(battingTeamId) === String(teamAId) ? stA : stB;
      const bowlingOT = String(bowlingTeamId) === String(teamAId) ? otA : otB;
      const bowlingST = String(bowlingTeamId) === String(teamAId) ? stA : stB;

      /* ── Team innings totals ─────────────────────── */

      for (const [bt, bwt] of [
        [battingOT, bowlingOT],
        [battingST, bowlingST],
      ]) {
        bt.stats.runsScored += innings.totalRuns || 0;
        bt.stats.wicketsLost += innings.wickets || 0;
        bt.stats.ballsFaced += innings.balls || 0;

        bwt.stats.runsConceded += innings.totalRuns || 0;
        bwt.stats.wicketsTaken += innings.wickets || 0;
        bwt.stats.ballsBowled += innings.balls || 0;
      }

      /* ── Highest / lowest team score ─────────────── */

      for (const t of [battingOT, battingST]) {
        const s = t.stats;
        const totalRuns = innings.totalRuns || 0;

        if (totalRuns > s.highestScore.runs) {
          s.highestScore = {
            runs: totalRuns,
            wickets: innings.wickets || 0,
            overs: ballsToOvers(innings.balls || 0),
            matchId,
          };
        }

        if (s.lowestScore.runs === null || totalRuns < s.lowestScore.runs) {
          s.lowestScore = {
            runs: totalRuns,
            wickets: innings.wickets || 0,
            overs: ballsToOvers(innings.balls || 0),
            matchId,
          };
        }
      }

      const battingOrder = Object.keys(battingStats);

      /* ================================================
         BATTING
      ================================================ */

      for (const [rawName, batter] of Object.entries(battingStats)) {
        const name = normalize(rawName);
        const playerId = playerMap.get(name)?._id;
        if (!playerId) continue;

        const pid = String(playerId);

        const op = getPlayerAcc(acc.overallPlayer, pid, {
          playerId,
        });

        op.seasonsPlayed.add(String(seasonId));

        const sp = getPlayerAcc(acc.seasonPlayer, `${seasonId}_${pid}`, {
          seasonId: match.seasonId,
          playerId,
        });

        /* Once per match */
        if (!processedPlayers.has(pid)) {
          processedPlayers.add(pid);
          op.totalMatches += 1;
          sp.totalMatches += 1;
          if (battingWon) {
            op.wins += 1;
            sp.wins += 1;
          } else {
            op.losses += 1;
            sp.losses += 1;
          }
        }

        const runs = batter.runs || 0;
        const balls = batter.balls || 0;
        const fours = batter.fours || 0;
        const sixes = batter.sixes || 0;
        const dismissal = batter.dismissal || null;
        const isOut = dismissal && dismissal.type !== "NOT_OUT";

        for (const p of [op, sp]) {
          p.batting.innings += 1;
          p.batting.runs += runs;
          p.batting.balls += balls;
          p.batting.fours += fours;
          p.batting.sixes += sixes;

          if (isOut) {
            p.batting.outs += 1;
            const dKey = dismissalKey(dismissal.type);
            if (dKey && p.batting.dismissalTypes[dKey] !== undefined) {
              p.batting.dismissalTypes[dKey] += 1;
            }
            if (dismissal.bowler) {
              const bowlerId = playerMap.get(normalize(dismissal.bowler))?._id;
              if (bowlerId) {
                p.batting.mostDismissedBy = updateTopList(
                  p.batting.mostDismissedBy,
                  bowlerId,
                  dismissalKey(dismissal.type), // ← pass the type
                );
              }
            }
          } else {
            p.batting.notOuts += 1;
            p.batting.dismissalTypes.notOut += 1;
          }

          if (runs === 0 && isOut) p.batting.ducks += 1;
          if (runs >= 30) p.batting.milestones.thirtyPlus += 1;
          if (runs >= 50) p.batting.milestones.fiftyPlus += 1;
          if (runs >= 100) p.batting.milestones.hundredPlus += 1;

          p.batting.scoreBuckets[getBucket(runs)] += 1;

          if (runs > p.batting.highestScore.runs) {
            p.batting.highestScore = { runs, matchId };
          }
        }
        // console.log("Man Of the Match:", match.result);

        const isMom = manOfTheMatchId && String(playerId) === manOfTheMatchId;

        if (isMom) {
          op.achievements.mom += 1;
          sp.achievements.mom += 1;
        }

        /* Create perf entry for this match if it doesn't exist yet */
        if (!matchPerfMap.has(pid)) {
          matchPerfMap.set(pid, {
            matchId,
            playedFor: battingTeamId,
            opponent: bowlingTeamId,
            runs: 0,
            ballsFaced: 0,
            wickets: 0,
            ballsBowled: 0,
            oversBowled: 0,
            catches: 0,
            runOuts: 0,
            stumpings: 0,
            won: battingWon,
            mom: false,
            date: match.createdAt,
          });
        }

        /* Accumulate batting into the shared perf entry */
        const perf = matchPerfMap.get(pid);
        perf.runs += runs;
        perf.ballsFaced += balls;
        if (isMom) perf.mom = true;

        /* ── Splits ────────────────────────────────── */

        const position = battingOrder.indexOf(rawName) + 1;

        const ops = getPlayerSplitAcc(acc.overallPlayerSplits, pid, {
          playerId,
        });

        const sps = getPlayerSplitAcc(
          acc.seasonPlayerSplits,
          `${seasonId}_${pid}`,
          {
            seasonId: match.seasonId,
            playerId,
          },
        );

        for (const splitDoc of [ops, sps]) {
          /* ==========================================
     BY POSITION
  ========================================== */

          const pos = ensureSplit(
            splitDoc.batting.byPosition,
            String(position),
          );

          pos.matches += 1;
          pos.innings += 1;
          pos.runs += runs;
          pos.balls += balls;
          pos.fours += fours;
          pos.sixes += sixes;

          if (isOut) {
            pos.outs += 1;
          }

          /* ==========================================
     BY OPPONENT
  ========================================== */

          const opp = ensureSplit(
            splitDoc.batting.byOpponent,
            String(bowlingTeamId),
          );

          opp.matches += 1;
          opp.innings += 1;
          opp.runs += runs;
          opp.balls += balls;
          opp.fours += fours;
          opp.sixes += sixes;

          if (isOut) {
            opp.outs += 1;
          }

          /* ==========================================
     BY TEAM
  ========================================== */

          const team = ensureSplit(
            splitDoc.batting.byTeam,
            String(battingTeamId),
          );

          team.matches += 1;
          team.innings += 1;
          team.runs += runs;
          team.balls += balls;
          team.fours += fours;
          team.sixes += sixes;

          if (isOut) {
            team.outs += 1;
          }

          /* ==========================================
     BY RESULT
  ========================================== */

          const resultKey = battingWon ? "wins" : "losses";

          const res = ensureSplit(splitDoc.batting.byMatchResult, resultKey);

          res.matches += 1;
          res.innings += 1;
          res.runs += runs;
          res.balls += balls;
          res.fours += fours;
          res.sixes += sixes;

          if (isOut) {
            res.outs += 1;
          }

          /* ==========================================
   BY INNINGS
========================================== */

          const inningsKey = innings.inningsNumber === 1 ? "FIRST" : "SECOND";

          const inns = ensureSplit(splitDoc.batting.byInnings, inningsKey);

          inns.matches += 1;
          inns.innings += 1;

          inns.runs += runs;
          inns.balls += balls;

          inns.fours += fours;
          inns.sixes += sixes;

          if (isOut) {
            inns.outs += 1;
          }

          /* ==========================================
     EVENT STORAGE
  ========================================== */

          splitDoc.battingInnings.push({
            key: `${matchId}_${innings.inningsNumber}_${pid}`,

            matchId: match._id,

            seasonId: match.seasonId,

            inningsNumber: innings.inningsNumber || 1,

            playedFor: battingTeamId,

            opponent: bowlingTeamId,

            battingPosition: position,

            runs,

            balls,

            fours,

            sixes,

            out: Boolean(isOut),

            won: battingWon,

            date: match.createdAt,
          });
        }
      }

      /* ================================================
         BOWLING
      ================================================ */

      for (const [rawName, bowler] of Object.entries(bowlingStats)) {
        const name = normalize(rawName);
        const playerId = playerMap.get(name)?._id;
        if (!playerId) continue;

        const pid = String(playerId);

        const op = getPlayerAcc(acc.overallPlayer, pid, { playerId });
        const sp = getPlayerAcc(acc.seasonPlayer, `${seasonId}_${pid}`, {
          seasonId: match.seasonId,
          playerId,
        });

        const wickets = bowler.wickets || 0;
        const balls = bowler.balls || 0;
        const runs = bowler.runs || 0;

        /* Once per match — registers bowlers who didn't bat */
        if (!processedPlayers.has(pid)) {
          processedPlayers.add(pid);
          op.totalMatches += 1;
          sp.totalMatches += 1;
          if (bowlingWon) {
            op.wins += 1;
            sp.wins += 1;
          } else {
            op.losses += 1;
            sp.losses += 1;
          }
        }

        /* ── Build dismissal map from battingStats (OUTSIDE the p loop) ── */
        const batterDismissalTypes = {};
        for (const [rawBatterName, batter] of Object.entries(battingStats)) {
          if (batter.dismissal?.bowler && batter.dismissal.type !== "NOT_OUT") {
            if (normalize(batter.dismissal.bowler) === name) {
              batterDismissalTypes[normalize(rawBatterName)] = dismissalKey(
                batter.dismissal.type,
              );
            }
          }
        }

        for (const p of [op, sp]) {
          p.bowling.innings += 1;
          p.bowling.balls += balls;
          p.bowling.runs += runs;
          p.bowling.wickets += wickets;
          p.bowling.maidens += bowler.maidens || 0;

          if (wickets >= 3) p.bowling.wicketHauls.threeWickets += 1;
          if (wickets >= 5) p.bowling.wicketHauls.fiveWickets += 1;

          if (
            wickets > p.bowling.bestBowling.wickets ||
            (wickets === p.bowling.bestBowling.wickets &&
              runs < p.bowling.bestBowling.runs)
          ) {
            p.bowling.bestBowling = { wickets, runs, matchId };
          }

          for (const dType of Object.keys(p.bowling.wicketTypes)) {
            p.bowling.wicketTypes[dType] += bowler.wicketTypes?.[dType] || 0;
          }

          /* ── mostDismissedBatters with dismissalBreakdown ── */
          for (const [batterName, dtype] of Object.entries(
            batterDismissalTypes,
          )) {
            const batterId = playerMap.get(batterName)?._id;
            if (batterId) {
              p.bowling.mostDismissedBatters = updateTopList(
                p.bowling.mostDismissedBatters,
                batterId,
                dtype,
              );
            }
          }
        }

        /* Create perf entry if bowler didn't bat */
        if (!matchPerfMap.has(pid)) {
          matchPerfMap.set(pid, {
            matchId,
            playedFor: bowlingTeamId,
            opponent: battingTeamId,
            runs: 0,
            ballsFaced: 0,
            wickets: 0,
            ballsBowled: 0,
            oversBowled: 0,
            catches: 0,
            runOuts: 0,
            stumpings: 0,
            won: bowlingWon,
            mom: false,
            date: match.createdAt,
          });
        }

        const perf = matchPerfMap.get(pid);
        perf.wickets += wickets;
        perf.ballsBowled += balls;
        perf.oversBowled = ballsToOvers(perf.ballsBowled);

        /* ── Bowling splits (unchanged) ── */

        const ops = getPlayerSplitAcc(acc.overallPlayerSplits, pid, {
          playerId,
        });

        const sps = getPlayerSplitAcc(
          acc.seasonPlayerSplits,
          `${seasonId}_${pid}`,
          {
            seasonId: match.seasonId,
            playerId,
          },
        );

        for (const splitDoc of [ops, sps]) {
          /* ==========================================
     BY OPPONENT
  ========================================== */

          const opp = ensureSplit(
            splitDoc.bowling.byOpponent,
            String(battingTeamId),
          );

          opp.matches += 1;
          opp.innings += 1;
          opp.wickets += wickets;
          opp.runs += runs;
          opp.balls += balls;

          /* ==========================================
     BY TEAM
  ========================================== */

          const team = ensureSplit(
            splitDoc.bowling.byTeam,
            String(bowlingTeamId),
          );

          team.matches += 1;
          team.innings += 1;
          team.wickets += wickets;
          team.runs += runs;
          team.balls += balls;
          /* ==========================================
     BY RESULT
  ========================================== */

          const resultKey = bowlingWon ? "wins" : "losses";

          const res = ensureSplit(splitDoc.bowling.byMatchResult, resultKey);

          res.matches += 1;
          res.innings += 1;
          res.wickets += wickets;
          res.runs += runs;
          res.balls += balls;
          /* ==========================================
   BY INNINGS
========================================== */

          const inningsKey = innings.inningsNumber === 1 ? "FIRST" : "SECOND";

          const inns = ensureSplit(splitDoc.bowling.byInnings, inningsKey);

          inns.matches += 1;
          inns.innings += 1;

          inns.wickets += wickets;

          inns.runs += runs;
          inns.balls += balls;

          /* ==========================================
   BEST BOWLING
========================================== */

          updateBestBowling(opp, wickets, runs);

          updateBestBowling(team, wickets, runs);

          updateBestBowling(res, wickets, runs);

          updateBestBowling(inns, wickets, runs);

          /* ==========================================
     EVENT STORAGE
  ========================================== */

          splitDoc.bowlingInnings.push({
            key: `${matchId}_${innings.inningsNumber}_${pid}`,

            matchId: match._id,

            seasonId: match.seasonId,

            inningsNumber: innings.inningsNumber || 1,

            playedFor: bowlingTeamId,

            opponent: battingTeamId,

            wickets,

            balls,

            runs,

            won: bowlingWon,

            date: match.createdAt,
          });
        }
      }

      /* ================================================
         FIELDING
      ================================================ */

      for (const [, batter] of Object.entries(battingStats)) {
        const dismissal = batter.dismissal || null;
        if (!dismissal || dismissal.type === "NOT_OUT") continue;

        const fielderName = normalize(
          dismissal.fielder || dismissal.caughtBy || "",
        );
        if (!fielderName) continue;

        const fielderId = playerMap.get(fielderName)?._id;
        if (!fielderId) continue;

        const fid = String(fielderId);
        const fop = getPlayerAcc(acc.overallPlayer, fid, {
          playerId: fielderId,
        });
        const fsp = getPlayerAcc(acc.seasonPlayer, `${seasonId}_${fid}`, {
          seasonId: match.seasonId,
          playerId: fielderId,
        });

        for (const p of [fop, fsp]) {
          if (dismissal.type === "CAUGHT") p.fielding.catches += 1;
          if (dismissal.type === "STUMPED") p.fielding.stumpings += 1;
          if (dismissal.type === "RUN_OUT") p.fielding.runOuts += 1;
        }

        /* Patch the shared perf entry */
        if (matchPerfMap.has(fid)) {
          const perf = matchPerfMap.get(fid);
          if (dismissal.type === "CAUGHT") perf.catches += 1;
          if (dismissal.type === "STUMPED") perf.stumpings += 1;
          if (dismissal.type === "RUN_OUT") perf.runOuts += 1;
        }
      }
    } // end innings loop

    /* ── Flush matchPerfMap → recentPerformances ──────── */
    // Exactly 1 entry per player per match, all stats merged.

    for (const [pid, perf] of matchPerfMap) {
      const op = acc.overallPlayer.get(pid);
      const sp = acc.seasonPlayer.get(`${seasonId}_${pid}`);
      if (op) pushRecentPerformance(op, perf);
      if (sp) pushRecentPerformance(sp, perf);
    }

    /* ── CHASE / DEFEND ──────────────────────────────── */

    if ((match.innings || []).length >= 2) {
      const first = match.innings[0];
      const second = match.innings[1];

      const firstWon = String(first.battingTeamId) === String(winnerTeamId);
      const secondWon = String(second.battingTeamId) === String(winnerTeamId);

      const firstOT =
        String(first.battingTeamId) === String(teamAId) ? otA : otB;
      const secondOT =
        String(second.battingTeamId) === String(teamAId) ? otA : otB;
      const firstST =
        String(first.battingTeamId) === String(teamAId) ? stA : stB;
      const secondST =
        String(second.battingTeamId) === String(teamAId) ? stA : stB;

      if (firstWon) {
        for (const t of [firstOT, firstST]) {
          pushRecentMatch(t.stats.wonBattingFirst, matchId);
          pushRecentMatch(t.stats.defendedTotals, matchId);
        }
        for (const t of [secondOT, secondST]) {
          pushRecentMatch(t.stats.lostBowlingFirst, matchId);
          pushRecentMatch(t.stats.failedChases, matchId);
        }
      }

      if (secondWon) {
        for (const t of [secondOT, secondST]) {
          pushRecentMatch(t.stats.wonBowlingFirst, matchId);
          pushRecentMatch(t.stats.successfulChases, matchId);
        }
        for (const t of [firstOT, firstST]) {
          pushRecentMatch(t.stats.lostBattingFirst, matchId);
          pushRecentMatch(t.stats.failedDefends, matchId);
        }
      }

      /* Highest successful chase */
      if (secondWon) {
        const target = (first.totalRuns || 0) + 1;
        const achieved = second.totalRuns || 0;
        for (const t of [secondOT, secondST]) {
          if (target > t.stats.highestSuccessfulChase.target) {
            t.stats.highestSuccessfulChase = { target, achieved, matchId };
          }
        }
      }

      /* Lowest defended score */
      if (firstWon) {
        const defended = first.totalRuns || 0;
        for (const t of [firstOT, firstST]) {
          if (
            t.stats.lowestDefendedScore.defended === 0 ||
            defended < t.stats.lowestDefendedScore.defended
          ) {
            t.stats.lowestDefendedScore = { defended, matchId };
          }
        }
      }

      /* Biggest win by runs */
      if (firstWon) {
        const margin = (first.totalRuns || 0) - (second.totalRuns || 0);
        for (const t of [firstOT, firstST]) {
          if (margin > t.stats.biggestWins.byRuns.margin) {
            t.stats.biggestWins.byRuns = { margin, matchId };
          }
        }
      }

      /* Biggest win by wickets */
      if (secondWon) {
        const margin = 10 - (second.wickets || 0);
        for (const t of [secondOT, secondST]) {
          if (margin > t.stats.biggestWins.byWickets.margin) {
            t.stats.biggestWins.byWickets = { margin, matchId };
          }
        }
      }
    }
  } // end match loop

  console.log("✅ Analytics Computed");
}

/* =========================================================
   FLUSH
========================================================= */

async function flush() {
  console.log("💾 Flushing to DB...");

  for (const doc of acc.overallTeam.values()) {
    doc.seasonsPlayed = [...doc.seasonsPlayed];
  }

  for (const doc of acc.overallPlayer.values()) {
    doc.seasonsPlayed = [...doc.seasonsPlayed];
  }

  await Promise.all([
    OverallPlayerStats.bulkWrite(
      [...acc.overallPlayer.values()].map((doc) => ({
        updateOne: {
          filter: { playerId: doc.playerId },
          update: { $set: doc },
          upsert: true,
        },
      })),
    ),

    SeasonPlayerStats.bulkWrite(
      [...acc.seasonPlayer.values()].map((doc) => ({
        updateOne: {
          filter: { seasonId: doc.seasonId, playerId: doc.playerId },
          update: { $set: doc },
          upsert: true,
        },
      })),
    ),

    OverallTeamStats.bulkWrite(
      [...acc.overallTeam.values()].map((doc) => ({
        updateOne: {
          filter: { teamId: doc.teamId },
          update: { $set: doc },
          upsert: true,
        },
      })),
    ),

    SeasonTeamStats.bulkWrite(
      [...acc.seasonTeam.values()].map((doc) => ({
        updateOne: {
          filter: { seasonId: doc.seasonId, teamId: doc.teamId },
          update: { $set: doc },
          upsert: true,
        },
      })),
    ),

    OverallPlayerSplits.bulkWrite(
      [...acc.overallPlayerSplits.values()].map((doc) => ({
        updateOne: {
          filter: { playerId: doc.playerId },
          update: { $set: doc },
          upsert: true,
        },
      })),
    ),

    SeasonPlayerSplits.bulkWrite(
      [...acc.seasonPlayerSplits.values()].map((doc) => ({
        updateOne: {
          filter: { seasonId: doc.seasonId, playerId: doc.playerId },
          update: { $set: doc },
          upsert: true,
        },
      })),
    ),
  ]);

  console.log("✅ Flush Completed");
}

/* =========================================================
   MAIN
========================================================= */

async function main() {
  try {
    await clearDB();
    await migrateSeasons();

    const oldMatches = await OldMatch.find({}).lean();

    await createProfiles(oldMatches);
    await migrateMatches(oldMatches);

    const matches = await Match.find({}).sort({ createdAt: 1 }).lean();

    computeAnalytics(matches);

    await flush();

    console.log("🎉 MIGRATION COMPLETED");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
