import OverallPlayerStats from "../../models/OverallPlayerStats.js";
import PlayerSeasonStats from "../../models/PlayerSeasonStats.js";
import { getDerivedStats } from "./leaderboard.service.js";

/* ======================================================
   HELPERS
====================================================== */

const normalize = (name) => name.trim().toLowerCase();

/* ======================================================
   BATTER VS BOWLER (RIVALRY)
====================================================== */

export const getBatterVsBowler = async ({ batter, bowler, seasonId }) => {
  if (!batter || !bowler) {
    throw new Error("Batter and bowler are required");
  }

  const Model = seasonId && seasonId !== "overall" ? PlayerSeasonStats : OverallPlayerStats;
  const query = { name: normalize(batter) };
  if (seasonId && seasonId !== "overall") query.seasonId = seasonId;

  const batterStats = await Model.findOne(query).lean();

  const bowlerQuery = { name: normalize(bowler) };
  if (seasonId && seasonId !== "overall") bowlerQuery.seasonId = seasonId;
  const bowlerStats = await Model.findOne(bowlerQuery).lean();

  if (!batterStats || !bowlerStats) {
    throw new Error("Stats not found for one or both players");
  }

  const bName = normalize(batter);
  const boName = normalize(bowler);

  const batterDismissalInfo = batterStats.batting.dismissedBy?.[boName] || { total: 0 };
  const bowlerDismissalInfo = bowlerStats.bowling.dismissedBatters?.[bName] || { total: 0 };

  const totalDismissals = Math.max(
    typeof batterDismissalInfo === "number" ? batterDismissalInfo : (batterDismissalInfo.total || 0),
    typeof bowlerDismissalInfo === "number" ? bowlerDismissalInfo : (bowlerDismissalInfo.total || 0)
  );

  const breakdown = typeof batterDismissalInfo === "object" ? { ...batterDismissalInfo } : { total: batterDismissalInfo };
  delete breakdown.total;

  return {
    batter: bName,
    bowler: boName,
    seasonId: seasonId || "overall",
    totalDismissals,
    breakdown,
    validated: (batterDismissalInfo.total || batterDismissalInfo) === (bowlerDismissalInfo.total || bowlerDismissalInfo),
    batting: {},
  };
};

/* ======================================================
   PLAYER COMPARISON (HEAD TO HEAD)
===================================================== */

export const getPlayerHeadToHead = async ({ player1, player2, seasonId }) => {
  if (!player1 || !player2) {
    throw new Error("Both players are required for comparison");
  }

  const Model = seasonId && seasonId !== "overall" ? PlayerSeasonStats : OverallPlayerStats;
  
  const p1Query = { name: normalize(player1) };
  if (seasonId && seasonId !== "overall") p1Query.seasonId = seasonId;
  
  const p2Query = { name: normalize(player2) };
  if (seasonId && seasonId !== "overall") p2Query.seasonId = seasonId;

  const [s1, s2] = await Promise.all([
    Model.findOne(p1Query).lean(),
    Model.findOne(p2Query).lean()
  ]);

  if (!s1 || !s2) {
    throw new Error("One or both players not found");
  }

  return {
    seasonId: seasonId || "overall",
    players: [
      { name: s1.name, stats: s1, derived: getDerivedStats(s1) },
      { name: s2.name, stats: s2, derived: getDerivedStats(s2) }
    ]
  };
};

/* ======================================================
   TEAM HEAD TO HEAD
====================================================== */

export const getTeamHeadToHead = async () => {
  return {
    message: "Coming soon",
  };
};
