import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

/* =========================================================
   CONNECTIONS
========================================================= */

const OLD_URI = process.env.MONGO_OLD_URI;
const NEW_URI = process.env.MONGO_URI;

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

const Season                      = mongoose.model("Season",                      GenericSchema, "seasons");
const Match                       = mongoose.model("Match",                       GenericSchema, "matches");
const PlayerProfile               = mongoose.model("PlayerProfile",               GenericSchema, "playerprofiles");
const TeamProfile                 = mongoose.model("TeamProfile",                 GenericSchema, "teamprofiles");
const OverallPlayerStats          = mongoose.model("OverallPlayerStats",          GenericSchema, "overallplayerstats");
const SeasonPlayerStats           = mongoose.model("SeasonPlayerStats",           GenericSchema, "seasonplayerstats");
const OverallTeamStats            = mongoose.model("OverallTeamStats",            GenericSchema, "overallteamstats");
const SeasonTeamStats             = mongoose.model("SeasonTeamStats",             GenericSchema, "seasonteamstats");
const OverallPlayerRivalry        = mongoose.model("OverallPlayerRivalry",        GenericSchema, "overallplayerrivalries");
const SeasonPlayerRivalry         = mongoose.model("SeasonPlayerRivalry",         GenericSchema, "seasonplayerrivalries");
const OverallPartnershipAggregate = mongoose.model("OverallPartnershipAggregate", GenericSchema, "overallpartnershipaggregates");
const SeasonPartnershipAggregate  = mongoose.model("SeasonPartnershipAggregate",  GenericSchema, "seasonpartnershipaggregates");
const OverallPlayerSplits         = mongoose.model("OverallPlayerSplits",         GenericSchema, "overallplayersplits");
const SeasonPlayerSplits          = mongoose.model("SeasonPlayerSplits",          GenericSchema, "seasonplayersplits");

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

function ballsToOvers(balls) {
  return Math.floor(balls / 6) + (balls % 6 > 0 ? (balls % 6) / 10 : 0);
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

/**
 * Increment a nested counter object of shape:
 *   { total: N, [subKey]: N }
 * Used for dismissedBy and dismissedBatters tracking.
 */
function incNested(obj, key, subKey) {
  if (!obj[key]) obj[key] = { total: 0 };
  obj[key].total  = (obj[key].total  || 0) + 1;
  obj[key][subKey] = (obj[key][subKey] || 0) + 1;
}

/* =========================================================
   DEFAULT DOCUMENT SHAPES
========================================================= */

function defaultTeamStats() {
  return {
    played:    0,
    wins:      0,
    losses:    0,
    ties:      0,
    noResults: 0,
    points:    0,           // season only — harmless to store in overall too

    runsScored:    0,
    wicketsLost:   0,
    ballsFaced:    0,

    runsConceded:  0,
    wicketsTaken:  0,
    ballsBowled:   0,

    foursScored:      0,
    sixesScored:      0,
    foursConceded:    0,
    sixesConceded:    0,

    dotBallsPlayed:   0,
    dotBallsBowled:   0,

    highestScore: { runs: 0,   wickets: 0, overs: 0, matchId: null },
    lowestScore:  { runs: null, wickets: 0, overs: 0, matchId: null },
  };
}

function defaultBattingStats() {
  return {
    innings:  0,
    runs:     0,
    balls:    0,
    fours:    0,
    sixes:    0,
    outs:     0,
    notOuts:  0,
    ducks:    0,

    highestScore: { runs: 0, matchId: null, seasonId: null },

    scoreRanges: Array(11).fill(0),   // base calls it scoreRanges

    dismissalTypes: {
      bowled:    0,
      caught:    0,
      lbw:       0,
      runOut:    0,
      stumped:   0,
      hitWicket: 0,
    },

    // { [bowlerName]: { total, bowled, caught, … } }
    dismissedBy: {},
  };
}

function defaultBowlingStats() {
  return {
    innings:  0,
    balls:    0,
    runs:     0,
    wickets:  0,
    maidens:  0,

    bestBowling: { wickets: 0, runs: 999, matchId: null, seasonId: null },

    wicketTypes: {
      bowled:    0,
      caught:    0,
      lbw:       0,
      stumped:   0,
      hitWicket: 0,
      // runOut intentionally excluded — not credited to bowler
    },

    wicketHauls: { w3: 0, w4: 0, w5: 0 },

    // { [batterName]: { total, bowled, caught, … } }
    dismissedBatters: {},
  };
}

function defaultFieldingStats() {
  return { catches: 0, stumpings: 0, runOuts: 0 };
}

function defaultPlayerStats() {
  return {
    totalMatches: 0,
    batting:      defaultBattingStats(),
    bowling:      defaultBowlingStats(),
    fielding:     defaultFieldingStats(),
    achievements: { mom: 0 },
  };
}

function defaultRivalryDismissals() {
  return {
    total:     0,
    bowled:    0,
    caught:    0,
    lbw:       0,
    runOut:    0,
    stumped:   0,
    hitWicket: 0,
  };
}

/* =========================================================
   IDENTITY MAPS  (name / id → profile doc created in DB)
========================================================= */

const playerMap = new Map(); // normalized name  → PlayerProfile doc  (has ._id)
const teamMap   = new Map(); // normalized name  → TeamProfile doc    (has ._id)

/* =========================================================
   IN-MEMORY ACCUMULATORS
   Pure JS — zero DB calls during compute phase.
   Flushed in one bulkWrite per collection at the end.
========================================================= */

const acc = {
  // seasonId (string)                         → { matchesCount }
  seasons:        new Map(),

  // teamId (string)                           → { totalMatches, lastMatchAt, seasonsPlayed:Set }
  teamProfiles:   new Map(),

  // playerId (string)                         → { totalMatches, lastMatchAt, seasonsPlayed:Set, teamsPlayedFor:Set }
  playerProfiles: new Map(),

  // teamName (string)                         → team stats doc
  overallTeam:    new Map(),

  // `${seasonId}:${teamName}`                 → team stats doc
  seasonTeam:     new Map(),

  // playerId (string)                         → player stats doc
  overallPlayer:  new Map(),

  // `${seasonId}:${playerId}`                 → player stats doc
  seasonPlayer:   new Map(),

  // `${batterId}:${bowlerId}`                 → rivalry doc
  overallRivalry: new Map(),

  // `${seasonId}:${batterId}:${bowlerId}`     → rivalry doc
  seasonRivalry:  new Map(),
};

/* ── Accumulator getters ── */

function getTeamAcc(map, key, extras = {}) {
  if (!map.has(key)) map.set(key, { ...extras, stats: defaultTeamStats() });
  return map.get(key);
}

function getPlayerAcc(map, key, extras = {}) {
  if (!map.has(key)) map.set(key, { ...extras, ...defaultPlayerStats() });
  return map.get(key);
}

function getRivalryAcc(map, key, extras = {}) {
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
   One DB write per unique player/team — stored in identity maps
   so every later step can resolve name → ObjectId.
========================================================= */

async function createProfiles(oldMatches) {
  for (const match of oldMatches) {
    for (const side of [match.teams.teamA, match.teams.teamB]) {
      const teamName = renameTeam(side.name);

      if (!teamMap.has(teamName)) {
        const doc = await TeamProfile.create({
          name:         teamName,
          displayName:  side.name,
          totalMatches: 0,
          seasonsPlayed: [],
          lastMatchAt:  null,
          createdAt:    new Date(),
          updatedAt:    new Date(),
        });
        teamMap.set(teamName, doc);
      }

      for (const rawPlayer of side.players) {
        const playerName = normalize(rawPlayer);
        if (!playerMap.has(playerName)) {
          const doc = await PlayerProfile.create({
            name:          playerName,
            displayName:   rawPlayer,
            totalMatches:  0,
            seasonsPlayed: [],
            teamsPlayedFor: [],
            lastMatchAt:   null,
            createdAt:     new Date(),
            updatedAt:     new Date(),
          });
          playerMap.set(playerName, doc);
        }
      }
    }
  }

  console.log(`✅ Profiles Created — Players: ${playerMap.size}  Teams: ${teamMap.size}`);
}

/* =========================================================
   MIGRATE MATCHES
   Rewrites name references → ObjectId references and applies
   team renames, then bulk-inserts into the new DB.
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
      // keep name fields intact for analytics (battingTeam/bowlingTeam strings still used)
      battingTeam:  renameTeam(inn.battingTeam),
      bowlingTeam:  renameTeam(inn.bowlingTeam),
      // add id references for convenience
      battingTeamId: renameTeam(inn.battingTeam) === teamA.name ? teamA._id : teamB._id,
      bowlingTeamId: renameTeam(inn.bowlingTeam) === teamA.name ? teamA._id : teamB._id,
      analytics: {
        hasBallByBall:    !!inn.ballByBall?.length,
        hasRivalries:     !!inn.ballByBall?.length,
        hasPartnerships:  !!inn.ballByBall?.length,
        analyticsVersion: 1,
      },
    }));

    const result = match.result
      ? {
          ...match.result,
          winner:        renameTeam(match.result.winner),
          winnerTeamId:  renameTeam(match.result.winner) === teamA.name ? teamA._id : teamB._id,
          manOfTheMatchId: playerMap.get(normalize(match.result.manOfTheMatch || ""))?._id ?? null,
        }
      : null;

    migrated.push({
      ...match,
      teams: {
        teamA: { teamId: teamA._id, name: teamA.name, players: teamAPlayers },
        teamB: { teamId: teamB._id, name: teamB.name, players: teamBPlayers },
      },
      innings,
      result,
    });
  }

  if (migrated.length) await Match.insertMany(migrated);
  console.log(`✅ Matches Migrated: ${migrated.length}`);
}

/* =========================================================
   COMPUTE ANALYTICS  — pure CPU, zero DB round-trips
========================================================= */

function computeAnalytics(matches) {
  console.log(`🧮 Computing analytics for ${matches.length} matches...`);

  for (const match of matches) {
    const seasonId     = String(match.seasonId);
    const matchId      = match._id;
    const winnerName   = normalize(match.result?.winner || "");
    const momName      = normalize(match.result?.manOfTheMatch || "");

    /* ── Season match count ── */
    if (!acc.seasons.has(seasonId)) acc.seasons.set(seasonId, { matchesCount: 0 });
    acc.seasons.get(seasonId).matchesCount += 1;

    const teamAName = match.teams.teamA.name;   // already renamed
    const teamBName = match.teams.teamB.name;
    const teamAId   = String(match.teams.teamA.teamId);
    const teamBId   = String(match.teams.teamB.teamId);

    /* ── Team Profiles ── */
    for (const [tid, tname] of [[teamAId, teamAName], [teamBId, teamBName]]) {
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

    /* ── Team Stats ── */
    const otA = getTeamAcc(acc.overallTeam, teamAName, { name: teamAName, teamId: match.teams.teamA.teamId });
    const otB = getTeamAcc(acc.overallTeam, teamBName, { name: teamBName, teamId: match.teams.teamB.teamId });
    const stA = getTeamAcc(acc.seasonTeam, `${seasonId}:${teamAName}`, { seasonId: match.seasonId, name: teamAName, teamId: match.teams.teamA.teamId });
    const stB = getTeamAcc(acc.seasonTeam, `${seasonId}:${teamBName}`, { seasonId: match.seasonId, name: teamBName, teamId: match.teams.teamB.teamId });

    // played
    for (const t of [otA, otB, stA, stB]) t.stats.played += 1;

    // result
    if (!match.result || winnerName === "") {
      for (const t of [otA, otB, stA, stB]) t.stats.noResults += 1;
    } else if (winnerName === "tied") {
      for (const t of [otA, otB, stA, stB]) t.stats.ties += 1;
      stA.stats.points += 1;
      stB.stats.points += 1;
    } else {
      const [winOT, loseOT, winST, loseST] =
        winnerName === teamAName
          ? [otA, otB, stA, stB]
          : [otB, otA, stB, stA];

      winOT.stats.wins   += 1;  loseOT.stats.losses += 1;
      winST.stats.wins   += 1;  loseST.stats.losses += 1;
      winST.stats.points += 2;
    }

    // innings-level team stats
    for (const inn of match.innings || []) {
      if (inn.isSuperOver) continue;   // super overs excluded from team stats

      const battingName  = normalize(inn.battingTeam);
      const bowlingName  = normalize(inn.bowlingTeam);

      const battingOT  = battingName === teamAName ? otA : otB;
      const bowlingOT  = bowlingName === teamAName ? otA : otB;
      const battingST  = battingName === teamAName ? stA : stB;
      const bowlingST  = bowlingName === teamAName ? stA : stB;

      const runs    = inn.totalRuns || 0;
      const wickets = inn.wickets   || 0;
      const balls   = inn.balls     || 0;
      const overs   = ballsToOvers(balls);

      // batting side
      for (const t of [battingOT, battingST]) {
        t.stats.runsScored  += runs;
        t.stats.wicketsLost += wickets;
        t.stats.ballsFaced  += balls;

        if (runs > (t.stats.highestScore.runs || 0)) {
          t.stats.highestScore = { runs, wickets, overs, matchId };
        }
        if (t.stats.lowestScore.runs === null || runs < t.stats.lowestScore.runs) {
          t.stats.lowestScore = { runs, wickets, overs, matchId };
        }
      }

      // bowling side
      for (const t of [bowlingOT, bowlingST]) {
        t.stats.runsConceded  += runs;
        t.stats.wicketsTaken  += wickets;
        t.stats.ballsBowled   += balls;
      }

      // ball-by-ball: fours, sixes, dot balls
      for (const ball of inn.ballByBall || []) {
        const batterRuns = ball.runs || 0;
        const isLegal    = !ball.extras?.wides && !ball.extras?.noBalls;
        const totalRuns  = batterRuns + (ball.extras?.wides || 0) + (ball.extras?.noBalls || 0);

        if (batterRuns === 4) {
          battingOT.stats.foursScored   += 1;  battingST.stats.foursScored   += 1;
          bowlingOT.stats.foursConceded += 1;  bowlingST.stats.foursConceded += 1;
        }
        if (batterRuns === 6) {
          battingOT.stats.sixesScored   += 1;  battingST.stats.sixesScored   += 1;
          bowlingOT.stats.sixesConceded += 1;  bowlingST.stats.sixesConceded += 1;
        }
        if (isLegal && totalRuns === 0) {
          battingOT.stats.dotBallsPlayed += 1;  battingST.stats.dotBallsPlayed += 1;
          bowlingOT.stats.dotBallsBowled += 1;  bowlingST.stats.dotBallsBowled += 1;
        }
      }
    }

    /* ── Player Stats ── */

    // One Set per match — ensures totalMatches counted only once per player
    const processedPlayers = new Set();

    for (const inn of match.innings || []) {
      const battingTeamName  = normalize(inn.battingTeam);
      const bowlingTeamName  = normalize(inn.bowlingTeam);
      const battingStats     = inn.battingStats  || {};
      const bowlingStats     = inn.bowlingStats  || {};
      const dismissals       = inn.dismissals    || {};

      /* ── Batting ── */
      for (const [rawName, batter] of Object.entries(battingStats)) {
        const name     = normalize(rawName);
        const playerId = playerMap.get(name)?._id;
        if (!playerId) continue;

        const pid = String(playerId);
        const op  = getPlayerAcc(acc.overallPlayer, pid,                    { playerId });
        const sp  = getPlayerAcc(acc.seasonPlayer,  `${seasonId}:${pid}`,   { seasonId: match.seasonId, playerId });

        // count match once
        if (!processedPlayers.has(pid)) {
          processedPlayers.add(pid);
          op.totalMatches += 1;
          sp.totalMatches += 1;
        }

        const runs    = batter.runs   || 0;
        const balls   = batter.balls  || 0;
        const fours   = batter.fours  || 0;
        const sixes   = batter.sixes  || 0;
        const dismissal = batter.dismissal || null;
        const didBat  = balls > 0 || runs > 0;
        const isOut   = !!dismissal && dismissal.type !== "NOT_OUT";

        for (const p of [op, sp]) {
          if (didBat) {
            p.batting.innings  += 1;
            p.batting.runs     += runs;
            p.batting.balls    += balls;
            p.batting.fours    += fours;
            p.batting.sixes    += sixes;

            if (isOut) p.batting.outs    += 1;
            else        p.batting.notOuts += 1;

            if (isOut && runs === 0) p.batting.ducks += 1;

            p.batting.scoreRanges[getBucket(runs)] += 1;
          }

          // highest score
          if (runs > p.batting.highestScore.runs) {
            p.batting.highestScore = { runs, matchId, seasonId: match.seasonId };
          }

          // dismissal type
          if (dismissal?.type) {
            const dKey = dismissalKey(dismissal.type);
            if (dKey && p.batting.dismissalTypes[dKey] !== undefined) {
              p.batting.dismissalTypes[dKey] += 1;
            }
          }

          // dismissedBy — credit bowler (not on run outs)
          if (dismissal?.bowler && dismissal?.type && dismissal.type !== "RUN_OUT") {
            const bName = normalize(dismissal.bowler);
            const dType = dismissalKey(dismissal.type) || "other";
            incNested(p.batting.dismissedBy, bName, dType);
          }
        }

        // MoM
        if (momName && momName === name) {
          op.achievements.mom += 1;
          sp.achievements.mom += 1;
        }
      }

      /* ── Bowling ── */

      // actualWickets must come from the dismissals map (base code pattern):
      // - only credit bowler if bowler field matches
      // - RUN_OUT does NOT count as a bowler wicket
      const bowlerWickets = {}; // name → { wickets, wicketTypes, dismissedBatters }

      for (const [batterName, dismissal] of Object.entries(dismissals)) {
        if (!dismissal?.bowler) continue;
        if (dismissal.type === "RUN_OUT") continue;   // run-outs not credited to bowler

        const bwlName = normalize(dismissal.bowler);
        if (!bowlerWickets[bwlName]) {
          bowlerWickets[bwlName] = { count: 0, types: {}, batters: {} };
        }

        bowlerWickets[bwlName].count += 1;

        const dKey = dismissalKey(dismissal.type);
        if (dKey) bowlerWickets[bwlName].types[dKey] = (bowlerWickets[bwlName].types[dKey] || 0) + 1;

        const btrName = normalize(batterName);
        const dType   = dKey || "other";
        if (!bowlerWickets[bwlName].batters[btrName]) bowlerWickets[bwlName].batters[btrName] = { total: 0 };
        bowlerWickets[bwlName].batters[btrName].total += 1;
        bowlerWickets[bwlName].batters[btrName][dType] = (bowlerWickets[bwlName].batters[btrName][dType] || 0) + 1;
      }

      for (const [rawName, bowler] of Object.entries(bowlingStats)) {
        const name     = normalize(rawName);
        const playerId = playerMap.get(name)?._id;
        if (!playerId) continue;

        const pid = String(playerId);
        const op  = getPlayerAcc(acc.overallPlayer, pid,                  { playerId });
        const sp  = getPlayerAcc(acc.seasonPlayer,  `${seasonId}:${pid}`, { seasonId: match.seasonId, playerId });

        // count match once
        if (!processedPlayers.has(pid)) {
          processedPlayers.add(pid);
          op.totalMatches += 1;
          sp.totalMatches += 1;
        }

        const balls         = bowler.balls   || 0;
        const runs          = bowler.runs    || 0;
        const maidens       = bowler.maidens || 0;
        const wkData        = bowlerWickets[name] || { count: 0, types: {}, batters: {} };
        const actualWickets = wkData.count;

        for (const p of [op, sp]) {
          if (balls > 0) p.bowling.innings += 1;

          p.bowling.balls   += balls;
          p.bowling.runs    += runs;
          p.bowling.wickets += actualWickets;
          p.bowling.maidens += maidens;

          // best bowling
          const best = p.bowling.bestBowling;
          if (
            actualWickets > best.wickets ||
            (actualWickets === best.wickets && runs < best.runs)
          ) {
            p.bowling.bestBowling = { wickets: actualWickets, runs, matchId, seasonId: match.seasonId };
          }

          // wicket types
          for (const [wType, wCount] of Object.entries(wkData.types)) {
            if (p.bowling.wicketTypes[wType] !== undefined) {
              p.bowling.wicketTypes[wType] += wCount;
            }
          }

          // wicket hauls
          if (actualWickets >= 3) p.bowling.wicketHauls.w3 += 1;
          if (actualWickets >= 4) p.bowling.wicketHauls.w4 += 1;
          if (actualWickets >= 5) p.bowling.wicketHauls.w5 += 1;

          // dismissedBatters
          for (const [btrName, btrData] of Object.entries(wkData.batters)) {
            if (!p.bowling.dismissedBatters[btrName]) {
              p.bowling.dismissedBatters[btrName] = { total: 0 };
            }
            p.bowling.dismissedBatters[btrName].total += btrData.total;
            for (const [k, v] of Object.entries(btrData)) {
              if (k === "total") continue;
              p.bowling.dismissedBatters[btrName][k] = (p.bowling.dismissedBatters[btrName][k] || 0) + v;
            }
          }
        }

      }

      /* ── Fielding ── */
      for (const [batterName, dismissal] of Object.entries(dismissals)) {
        if (!dismissal?.fielder) continue;

        const name     = normalize(dismissal.fielder);
        const playerId = playerMap.get(name)?._id;
        if (!playerId) continue;

        const pid = String(playerId);
        const op  = getPlayerAcc(acc.overallPlayer, pid,                  { playerId });
        const sp  = getPlayerAcc(acc.seasonPlayer,  `${seasonId}:${pid}`, { seasonId: match.seasonId, playerId });

        // count match once
        if (!processedPlayers.has(pid)) {
          processedPlayers.add(pid);
          op.totalMatches += 1;
          sp.totalMatches += 1;
        }

        switch (dismissal.type) {
          case "CAUGHT":
            op.fielding.catches   += 1;
            sp.fielding.catches   += 1;
            break;
          case "STUMPED":
            op.fielding.stumpings += 1;
            sp.fielding.stumpings += 1;
            break;
          case "RUN_OUT":
            op.fielding.runOuts   += 1;
            sp.fielding.runOuts   += 1;
            break;
        }
      }

      /* ── Rivalries (batter vs bowler) ── */
      for (const [batterName, dismissal] of Object.entries(dismissals)) {
        if (!dismissal?.bowler) continue;

        const batterId = playerMap.get(normalize(batterName))?._id;
        const bowlerId = playerMap.get(normalize(dismissal.bowler))?._id;
        if (!batterId || !bowlerId) continue;

        const btrId = String(batterId);
        const bwlId = String(bowlerId);

        const or = getRivalryAcc(acc.overallRivalry, `${btrId}:${bwlId}`,             { batterId, bowlerId });
        const sr = getRivalryAcc(acc.seasonRivalry,  `${seasonId}:${btrId}:${bwlId}`, { seasonId: match.seasonId, batterId, bowlerId });

        const dKey = dismissalKey(dismissal.type);
        for (const r of [or, sr]) {
          r.dismissals.total += 1;
          if (dKey && r.dismissals[dKey] !== undefined) r.dismissals[dKey] += 1;
        }
      }
    }
  }

  console.log("✅ Analytics Computed");
}

/* =========================================================
   FLUSH — one bulkWrite per collection, all in parallel
========================================================= */

async function flush() {
  console.log("💾 Flushing to DB...");

  const ops = [];

  /* ── Seasons ── */
  if (acc.seasons.size) {
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
  }

  /* ── Team Profiles ── */
  if (acc.teamProfiles.size) {
    ops.push(
      TeamProfile.bulkWrite(
        [...acc.teamProfiles.entries()].map(([id, data]) => ({
          updateOne: {
            filter: { _id: new mongoose.Types.ObjectId(id) },
            update: {
              $inc: { totalMatches: data.totalMatches },
              $set: { lastMatchAt: data.lastMatchAt, updatedAt: new Date() },
              $addToSet: {
                seasonsPlayed: { $each: [...data.seasonsPlayed].map((s) => new mongoose.Types.ObjectId(s)) },
              },
            },
          },
        })),
        { ordered: false },
      ),
    );
  }

  /* ── Player Profiles ── */
  if (acc.playerProfiles.size) {
    ops.push(
      PlayerProfile.bulkWrite(
        [...acc.playerProfiles.entries()].map(([id, data]) => ({
          updateOne: {
            filter: { _id: new mongoose.Types.ObjectId(id) },
            update: {
              $inc: { totalMatches: data.totalMatches },
              $set: { lastMatchAt: data.lastMatchAt, updatedAt: new Date() },
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
  }

  /* ── Overall Team Stats ── */
  if (acc.overallTeam.size) {
    ops.push(
      OverallTeamStats.bulkWrite(
        [...acc.overallTeam.values()].map((doc) => ({
          updateOne: {
            filter: { name: doc.name },
            update: { $setOnInsert: { name: doc.name, teamId: doc.teamId }, $set: { stats: doc.stats } },
            upsert: true,
          },
        })),
        { ordered: false },
      ),
    );
  }

  /* ── Season Team Stats ── */
  if (acc.seasonTeam.size) {
    ops.push(
      SeasonTeamStats.bulkWrite(
        [...acc.seasonTeam.values()].map((doc) => ({
          updateOne: {
            filter: { seasonId: doc.seasonId, name: doc.name },
            update: {
              $setOnInsert: { seasonId: doc.seasonId, name: doc.name, teamId: doc.teamId },
              $set: { stats: doc.stats },
            },
            upsert: true,
          },
        })),
        { ordered: false },
      ),
    );
  }

  /* ── Overall Player Stats ── */
  if (acc.overallPlayer.size) {
    ops.push(
      OverallPlayerStats.bulkWrite(
        [...acc.overallPlayer.values()].map((doc) => ({
          updateOne: {
            filter: { playerId: doc.playerId },
            update: {
              $setOnInsert: { playerId: doc.playerId },
              $set: {
                totalMatches: doc.totalMatches,
                batting:      doc.batting,
                bowling:      doc.bowling,
                fielding:     doc.fielding,
                achievements: doc.achievements,
              },
            },
            upsert: true,
          },
        })),
        { ordered: false },
      ),
    );
  }

  /* ── Season Player Stats ── */
  if (acc.seasonPlayer.size) {
    ops.push(
      SeasonPlayerStats.bulkWrite(
        [...acc.seasonPlayer.values()].map((doc) => ({
          updateOne: {
            filter: { seasonId: doc.seasonId, playerId: doc.playerId },
            update: {
              $setOnInsert: { seasonId: doc.seasonId, playerId: doc.playerId },
              $set: {
                totalMatches: doc.totalMatches,
                batting:      doc.batting,
                bowling:      doc.bowling,
                fielding:     doc.fielding,
                achievements: doc.achievements,
              },
            },
            upsert: true,
          },
        })),
        { ordered: false },
      ),
    );
  }

  /* ── Overall Player Rivalries ── */
  if (acc.overallRivalry.size) {
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
  }

  /* ── Season Player Rivalries ── */
  if (acc.seasonRivalry.size) {
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
  }

  await Promise.all(ops);
  console.log("✅ Flush Complete");
  console.log(`   Seasons: ${acc.seasons.size}`);
  console.log(`   Team profiles: ${acc.teamProfiles.size}`);
  console.log(`   Player profiles: ${acc.playerProfiles.size}`);
  console.log(`   Overall team stats: ${acc.overallTeam.size}`);
  console.log(`   Season team stats: ${acc.seasonTeam.size}`);
  console.log(`   Overall player stats: ${acc.overallPlayer.size}`);
  console.log(`   Season player stats: ${acc.seasonPlayer.size}`);
  console.log(`   Overall rivalries: ${acc.overallRivalry.size}`);
  console.log(`   Season rivalries: ${acc.seasonRivalry.size}`);
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
    computeAnalytics(matches);  // pure CPU — no DB calls
    await flush();              // one bulkWrite per collection, all parallel

    console.log("🎉 MIGRATION COMPLETED");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();