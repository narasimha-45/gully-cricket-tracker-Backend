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
const OldMatch  = oldConnection.model("Match",  GenericSchema, "matches");

/* =========================================================
   NEW MODELS
========================================================= */

const Season                   = mongoose.model("Season",                   GenericSchema, "seasons");
const Match                    = mongoose.model("Match",                    GenericSchema, "matches");
const PlayerProfile            = mongoose.model("PlayerProfile",            GenericSchema, "playerprofiles");
const TeamProfile              = mongoose.model("TeamProfile",              GenericSchema, "teamprofiles");
const OverallPlayerStats       = mongoose.model("OverallPlayerStats",       GenericSchema, "overallplayerstats");
const SeasonPlayerStats        = mongoose.model("SeasonPlayerStats",        GenericSchema, "seasonplayerstats");
const OverallTeamStats         = mongoose.model("OverallTeamStats",         GenericSchema, "overallteamstats");
const SeasonTeamStats          = mongoose.model("SeasonTeamStats",          GenericSchema, "seasonteamstats");
const OverallPlayerRivalry     = mongoose.model("OverallPlayerRivalry",     GenericSchema, "overallplayerrivalries");
const SeasonPlayerRivalry      = mongoose.model("SeasonPlayerRivalry",      GenericSchema, "seasonplayerrivalries");
const OverallPartnershipAggregate = mongoose.model("OverallPartnershipAggregate", GenericSchema, "overallpartnershipaggregates");
const SeasonPartnershipAggregate  = mongoose.model("SeasonPartnershipAggregate",  GenericSchema, "seasonpartnershipaggregates");
const OverallPlayerSplits      = mongoose.model("OverallPlayerSplits",      GenericSchema, "overallplayersplits");
const SeasonPlayerSplits       = mongoose.model("SeasonPlayerSplits",       GenericSchema, "seasonplayersplits");

/* =========================================================
   HELPERS
========================================================= */

const normalize = (v = "") => v.trim().toLowerCase();

function renameTeam(name) {
  const n = normalize(name);
  if (n === "lokesh team"    || n === "lokesh's team")    return "eagles";
  if (n === "narasimha team" || n === "narasimha's team") return "spider";
  return n;
}

function getBucket(runs) {
  if (runs >= 100) return 10;
  return Math.floor(runs / 10);
}

function dismissalKey(type) {
  switch (type) {
    case "BOWLED":     return "bowled";
    case "CAUGHT":     return "caught";
    case "LBW":        return "lbw";
    case "RUN_OUT":    return "runOut";
    case "STUMPED":    return "stumped";
    case "HIT_WICKET": return "hitWicket";
    default:           return null;
  }
}

function updateTopList(arr = [], playerId) {
  const pid = String(playerId);
  const existing = arr.find((x) => String(x.playerId) === pid);
  if (existing) {
    existing.count += 1;
  } else {
    arr.push({ playerId, count: 1 });
  }
  arr.sort((a, b) => b.count - a.count);
  return arr.slice(0, 10);
}

/* ── Default document shapes ── */

function defaultTeamStats() {
  return { played: 0, wins: 0, losses: 0, runsScored: 0, wicketsLost: 0, ballsFaced: 0 };
}

function defaultBattingStats() {
  return {
    innings: 0, runs: 0, balls: 0, fours: 0, sixes: 0,
    outs: 0, notOuts: 0, ducks: 0,
    scoreBuckets: Array(11).fill(0),
    dismissalTypes: { bowled: 0, caught: 0, lbw: 0, runOut: 0, stumped: 0, hitWicket: 0 },
    mostDismissedBy: [],
  };
}

function defaultBowlingStats() {
  return { innings: 0, balls: 0, runs: 0, wickets: 0, maidens: 0 };
}

function defaultPlayerStats() {
  return { totalMatches: 0, batting: defaultBattingStats(), bowling: defaultBowlingStats() };
}

function defaultRivalryDismissals() {
  return { total: 0, bowled: 0, caught: 0, lbw: 0, runOut: 0, stumped: 0, hitWicket: 0 };
}

/* =========================================================
   MEMORY MAPS
========================================================= */

const playerMap = new Map(); // normalized name → playerDoc
const teamMap   = new Map(); // normalized name → teamDoc

/* =========================================================
   IN-MEMORY ACCUMULATORS
   All stats are computed here; flushed to DB in one bulkWrite
   per collection at the end — zero sequential awaits per match.
========================================================= */

// key → accumulated plain object
const acc = {
  seasons:          new Map(), // seasonId  → { matchesCount }
  teamProfiles:     new Map(), // teamId    → { totalMatches, lastMatchAt, seasonsPlayed }
  playerProfiles:   new Map(), // playerId  → { totalMatches, lastMatchAt, seasonsPlayed, teamsPlayedFor }
  overallTeam:      new Map(), // teamId    → stats doc
  seasonTeam:       new Map(), // `${seasonId}:${teamId}` → stats doc
  overallPlayer:    new Map(), // playerId  → stats doc
  seasonPlayer:     new Map(), // `${seasonId}:${playerId}` → stats doc
  overallRivalry:   new Map(), // `${batterId}:${bowlerId}` → rivalry doc
  seasonRivalry:    new Map(), // `${seasonId}:${batterId}:${bowlerId}` → rivalry doc
};

/* ── Accumulator getters (create default on first access) ── */

function getTeamStats(map, key, extras = {}) {
  if (!map.has(key)) map.set(key, { ...extras, stats: defaultTeamStats() });
  return map.get(key);
}

function getPlayerStats(map, key, extras = {}) {
  if (!map.has(key)) map.set(key, { ...extras, ...defaultPlayerStats() });
  return map.get(key);
}

function getRivalry(map, key, extras = {}) {
  if (!map.has(key)) map.set(key, { ...extras, dismissals: defaultRivalryDismissals() });
  return map.get(key);
}

/* =========================================================
   CLEAR DATABASE
========================================================= */

async function clearDB() {
  console.log("🧹 Clearing new DB...");
  await Promise.all([
    Season.deleteMany({}),
    Match.deleteMany({}),
    PlayerProfile.deleteMany({}),
    TeamProfile.deleteMany({}),
    OverallPlayerStats.deleteMany({}),
    SeasonPlayerStats.deleteMany({}),
    OverallTeamStats.deleteMany({}),
    SeasonTeamStats.deleteMany({}),
    OverallPlayerRivalry.deleteMany({}),
    SeasonPlayerRivalry.deleteMany({}),
    OverallPartnershipAggregate.deleteMany({}),
    SeasonPartnershipAggregate.deleteMany({}),
    OverallPlayerSplits.deleteMany({}),
    SeasonPlayerSplits.deleteMany({}),
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
   CREATE PLAYER + TEAM PROFILES
========================================================= */

async function createProfiles(matches) {
  for (const match of matches) {
    for (const team of [match.teams.teamA, match.teams.teamB]) {
      const teamName = renameTeam(team.name);

      if (!teamMap.has(teamName)) {
        const doc = await TeamProfile.create({
          name: teamName,
          displayName: team.name,
          totalMatches: 0,
          seasonsPlayed: [],
        });
        teamMap.set(teamName, doc);
      }

      for (const rawPlayer of team.players) {
        const playerName = normalize(rawPlayer);
        if (!playerMap.has(playerName)) {
          const doc = await PlayerProfile.create({
            name: playerName,
            displayName: rawPlayer,
            totalMatches: 0,
            seasonsPlayed: [],
            teamsPlayedFor: [],
          });
          playerMap.set(playerName, doc);
        }
      }
    }
  }

  console.log(`✅ Profiles Created:\nPlayers: ${playerMap.size}\nTeams: ${teamMap.size}`);
}

/* =========================================================
   MIGRATE MATCHES
========================================================= */

async function migrateMatches(oldMatches) {
  const migrated = [];

  for (const match of oldMatches) {
    const teamA = teamMap.get(renameTeam(match.teams.teamA.name));
    const teamB = teamMap.get(renameTeam(match.teams.teamB.name));

    if (!teamA || !teamB) {
      console.warn(`⚠️  Skipping match ${match._id}: team not found`);
      continue;
    }

    const teamAPlayers = match.teams.teamA.players
      .map((p) => playerMap.get(normalize(p))?._id).filter(Boolean);
    const teamBPlayers = match.teams.teamB.players
      .map((p) => playerMap.get(normalize(p))?._id).filter(Boolean);

    const innings = (match.innings || []).map((inn) => ({
      ...inn,
      battingTeamId: renameTeam(inn.battingTeam) === teamA.name ? teamA._id : teamB._id,
      bowlingTeamId: renameTeam(inn.bowlingTeam) === teamA.name ? teamA._id : teamB._id,
      analytics: {
        hasBallByBall:   !!inn.ballByBall?.length,
        hasRivalries:    !!inn.ballByBall?.length,
        hasPartnerships: !!inn.ballByBall?.length,
        analyticsVersion: 1,
      },
    }));

    const result = match.result
      ? {
          ...match.result,
          winnerTeamId:
            renameTeam(match.result.winner) === teamA.name ? teamA._id : teamB._id,
          manOfTheMatchId:
            playerMap.get(normalize(match.result.manOfTheMatch || ""))?._id ?? null,
        }
      : null;

    migrated.push({
      ...match,
      teams: {
        teamA: { teamId: teamA._id, players: teamAPlayers },
        teamB: { teamId: teamB._id, players: teamBPlayers },
      },
      innings,
      result,
    });
  }

  if (migrated.length) await Match.insertMany(migrated);
  console.log(`✅ Matches Migrated: ${migrated.length}`);
}

/* =========================================================
   COMPUTE ANALYTICS  (pure in-memory — no DB calls)
========================================================= */

function computeAnalytics(matches) {
  console.log(`🧮 Computing analytics for ${matches.length} matches...`);

  for (const match of matches) {
    const seasonId    = String(match.seasonId);
    const winnerTeamId = match.result?.winnerTeamId ? String(match.result.winnerTeamId) : null;

    /* ── Season ── */
    if (!acc.seasons.has(seasonId)) acc.seasons.set(seasonId, { matchesCount: 0 });
    acc.seasons.get(seasonId).matchesCount += 1;

    /* ── Team Profiles ── */
    for (const side of [match.teams.teamA, match.teams.teamB]) {
      const tid = String(side.teamId);
      if (!acc.teamProfiles.has(tid)) {
        acc.teamProfiles.set(tid, { totalMatches: 0, lastMatchAt: null, seasonsPlayed: new Set() });
      }
      const tp = acc.teamProfiles.get(tid);
      tp.totalMatches += 1;
      tp.seasonsPlayed.add(seasonId);
      if (!tp.lastMatchAt || match.createdAt > tp.lastMatchAt) tp.lastMatchAt = match.createdAt;
    }

    /* ── Player Profiles ── */
    for (const side of [match.teams.teamA, match.teams.teamB]) {
      for (const playerId of side.players) {
        const pid = String(playerId);
        if (!acc.playerProfiles.has(pid)) {
          acc.playerProfiles.set(pid, {
            totalMatches: 0, lastMatchAt: null,
            seasonsPlayed: new Set(), teamsPlayedFor: new Set(),
          });
        }
        const pp = acc.playerProfiles.get(pid);
        pp.totalMatches += 1;
        pp.seasonsPlayed.add(seasonId);
        pp.teamsPlayedFor.add(String(side.teamId));
        if (!pp.lastMatchAt || match.createdAt > pp.lastMatchAt) pp.lastMatchAt = match.createdAt;
      }
    }

    /* ── Innings ── */
    for (const inn of match.innings) {
      const battingTeamId = String(inn.battingTeamId);
      const battingStats  = inn.battingStats  || {};
      const bowlingStats  = inn.bowlingStats  || {};

      /* ── Team Stats ── */
      const ot = getTeamStats(acc.overallTeam, battingTeamId,          { teamId: inn.battingTeamId });
      const st = getTeamStats(acc.seasonTeam,  `${seasonId}:${battingTeamId}`, { seasonId: match.seasonId, teamId: inn.battingTeamId });

      for (const t of [ot, st]) {
        t.stats.played      += 1;
        t.stats.runsScored  += inn.totalRuns || 0;
        t.stats.wicketsLost += inn.wickets   || 0;
        t.stats.ballsFaced  += inn.balls     || 0;
        if (battingTeamId === winnerTeamId) t.stats.wins   += 1;
        else                                t.stats.losses += 1;
      }

      /* ── Player Batting ── */
      for (const rawName in battingStats) {
        const batting  = battingStats[rawName];
        const playerId = playerMap.get(normalize(rawName))?._id;
        if (!playerId) continue;

        const pid = String(playerId);
        const op  = getPlayerStats(acc.overallPlayer, pid,                    { playerId });
        const sp  = getPlayerStats(acc.seasonPlayer,  `${seasonId}:${pid}`,   { seasonId: match.seasonId, playerId });

        for (const p of [op, sp]) {
          p.totalMatches       += 1;
          p.batting.innings    += 1;
          p.batting.runs       += batting.runs   || 0;
          p.batting.balls      += batting.balls  || 0;
          p.batting.fours      += batting.fours  || 0;
          p.batting.sixes      += batting.sixes  || 0;

          if (batting.dismissal?.type === "NOT_OUT") p.batting.notOuts += 1;
          else                                        p.batting.outs    += 1;

          if ((batting.runs || 0) === 0) p.batting.ducks += 1;

          p.batting.scoreBuckets[getBucket(batting.runs || 0)] += 1;

          const dKey = dismissalKey(batting.dismissal?.type);
          if (dKey) p.batting.dismissalTypes[dKey] += 1;

          if (batting.dismissal?.bowler) {
            const bowlerId = playerMap.get(normalize(batting.dismissal.bowler))?._id;
            if (bowlerId) p.batting.mostDismissedBy = updateTopList(p.batting.mostDismissedBy, bowlerId);
          }
        }
      }

      /* ── Player Bowling ── */
      for (const rawName in bowlingStats) {
        const bowling  = bowlingStats[rawName];
        const playerId = playerMap.get(normalize(rawName))?._id;
        if (!playerId) continue;

        const pid = String(playerId);
        const op  = getPlayerStats(acc.overallPlayer, pid,                  { playerId });
        const sp  = getPlayerStats(acc.seasonPlayer,  `${seasonId}:${pid}`, { seasonId: match.seasonId, playerId });

        for (const p of [op, sp]) {
          p.bowling.innings  += 1;
          p.bowling.balls    += bowling.balls   || 0;
          p.bowling.runs     += bowling.runs    || 0;
          p.bowling.wickets  += bowling.wickets || 0;
          p.bowling.maidens  += bowling.maidens || 0;
        }
      }

      /* ── Rivalries ── */
      for (const [batterName, dismissal] of Object.entries(inn.dismissals || {})) {
        if (!dismissal?.bowler) continue;

        const batterId = playerMap.get(normalize(batterName))?._id;
        const bowlerId = playerMap.get(normalize(dismissal.bowler))?._id;
        if (!batterId || !bowlerId) continue;

        const btrId = String(batterId);
        const bwlId = String(bowlerId);

        const or = getRivalry(acc.overallRivalry, `${btrId}:${bwlId}`,              { batterId, bowlerId });
        const sr = getRivalry(acc.seasonRivalry,  `${seasonId}:${btrId}:${bwlId}`,  { seasonId: match.seasonId, batterId, bowlerId });

        const dKey = dismissalKey(dismissal.type);
        for (const r of [or, sr]) {
          r.dismissals.total += 1;
          if (dKey) r.dismissals[dKey] += 1;
        }
      }
    }
  }

  console.log("✅ Analytics Computed");
}

/* =========================================================
   FLUSH  (one bulkWrite per collection)
========================================================= */

async function flush() {
  console.log("💾 Flushing to DB...");

  const ops = [];

  /* ── Seasons ── */
  ops.push(
    Season.bulkWrite(
      [...acc.seasons.entries()].map(([id, data]) => ({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(id) },
          update: { $inc: { matchesCount: data.matchesCount } },
        },
      })),
      { ordered: false },
    ),
  );

  /* ── Team Profiles ── */
  ops.push(
    TeamProfile.bulkWrite(
      [...acc.teamProfiles.entries()].map(([id, data]) => ({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(id) },
          update: {
            $inc: { totalMatches: data.totalMatches },
            $set: { lastMatchAt: data.lastMatchAt },
            $addToSet: { seasonsPlayed: { $each: [...data.seasonsPlayed].map((s) => new mongoose.Types.ObjectId(s)) } },
          },
        },
      })),
      { ordered: false },
    ),
  );

  /* ── Player Profiles ── */
  ops.push(
    PlayerProfile.bulkWrite(
      [...acc.playerProfiles.entries()].map(([id, data]) => ({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(id) },
          update: {
            $inc: { totalMatches: data.totalMatches },
            $set: { lastMatchAt: data.lastMatchAt },
            $addToSet: {
              seasonsPlayed:  { $each: [...data.seasonsPlayed].map((s)  => new mongoose.Types.ObjectId(s)) },
              teamsPlayedFor: { $each: [...data.teamsPlayedFor].map((t) => new mongoose.Types.ObjectId(t)) },
            },
          },
        },
      })),
      { ordered: false },
    ),
  );

  /* ── Overall Team Stats ── */
  ops.push(
    OverallTeamStats.bulkWrite(
      [...acc.overallTeam.values()].map((doc) => ({
        updateOne: {
          filter: { teamId: doc.teamId },
          update: { $setOnInsert: { teamId: doc.teamId }, $set: { stats: doc.stats } },
          upsert: true,
        },
      })),
      { ordered: false },
    ),
  );

  /* ── Season Team Stats ── */
  ops.push(
    SeasonTeamStats.bulkWrite(
      [...acc.seasonTeam.values()].map((doc) => ({
        updateOne: {
          filter: { seasonId: doc.seasonId, teamId: doc.teamId },
          update: { $setOnInsert: { seasonId: doc.seasonId, teamId: doc.teamId }, $set: { stats: doc.stats } },
          upsert: true,
        },
      })),
      { ordered: false },
    ),
  );

  /* ── Overall Player Stats ── */
  ops.push(
    OverallPlayerStats.bulkWrite(
      [...acc.overallPlayer.values()].map((doc) => ({
        updateOne: {
          filter: { playerId: doc.playerId },
          update: {
            $setOnInsert: { playerId: doc.playerId },
            $set: { totalMatches: doc.totalMatches, batting: doc.batting, bowling: doc.bowling },
          },
          upsert: true,
        },
      })),
      { ordered: false },
    ),
  );

  /* ── Season Player Stats ── */
  ops.push(
    SeasonPlayerStats.bulkWrite(
      [...acc.seasonPlayer.values()].map((doc) => ({
        updateOne: {
          filter: { seasonId: doc.seasonId, playerId: doc.playerId },
          update: {
            $setOnInsert: { seasonId: doc.seasonId, playerId: doc.playerId },
            $set: { totalMatches: doc.totalMatches, batting: doc.batting, bowling: doc.bowling },
          },
          upsert: true,
        },
      })),
      { ordered: false },
    ),
  );

  /* ── Overall Rivalries ── */
  ops.push(
    OverallPlayerRivalry.bulkWrite(
      [...acc.overallRivalry.values()].map((doc) => ({
        updateOne: {
          filter: { batterId: doc.batterId, bowlerId: doc.bowlerId },
          update: {
            $setOnInsert: { batterId: doc.batterId, bowlerId: doc.bowlerId },
            $set: { dismissals: doc.dismissals },
          },
          upsert: true,
        },
      })),
      { ordered: false },
    ),
  );

  /* ── Season Rivalries ── */
  ops.push(
    SeasonPlayerRivalry.bulkWrite(
      [...acc.seasonRivalry.values()].map((doc) => ({
        updateOne: {
          filter: { seasonId: doc.seasonId, batterId: doc.batterId, bowlerId: doc.bowlerId },
          update: {
            $setOnInsert: { seasonId: doc.seasonId, batterId: doc.batterId, bowlerId: doc.bowlerId },
            $set: { dismissals: doc.dismissals },
          },
          upsert: true,
        },
      })),
      { ordered: false },
    ),
  );

  await Promise.all(ops);
  console.log("✅ Flush Complete");
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
    computeAnalytics(matches);   // pure CPU — no await
    await flush();               // single round-trip per collection

    console.log("🎉 MIGRATION COMPLETED");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();