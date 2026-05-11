import * as playerStatsService from "../services/stats/playerStats.service.js";
import * as leaderboardService from "../services/stats/leaderboard.service.js";
import * as rivalryService from "../services/stats/rivalry.service.js";

/* ======================================================
   BATTER VS BOWLER
====================================================== */

export const getBatterVsBowler = async (req, res) => {
  handleResponse(res, () => rivalryService.getBatterVsBowler(req.query));
};

/* ======================================================
   TEAM HEAD TO HEAD
====================================================== */

export const getTeamHeadToHead = async (req, res) => {
  handleResponse(res, () => rivalryService.getTeamHeadToHead());
};

/* ======================================================
   PLAYER HEAD TO HEAD
====================================================== */

export const getPlayerHeadToHead = async (req, res) => {
  handleResponse(res, () => rivalryService.getPlayerHeadToHead());
};

/* ======================================================
   COMMON RESPONSE HANDLER
====================================================== */

const handleResponse = async (res, serviceCall) => {
  try {
    const data = await serviceCall();

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ======================================================
   PLAYER PROFILE
====================================================== */

export const getPlayerProfile = async (req, res) => {
  handleResponse(res, () =>
    playerStatsService.getPlayerProfile(req.params.name),
  );
};

/* ======================================================
   PLAYER MATCHES
====================================================== */

export const getPlayerMatches = async (req, res) => {
  handleResponse(res, () =>
    playerStatsService.getPlayerMatches(req.params.name, req.query),
  );
};

/* ======================================================
   PLAYER SEASON STATS
====================================================== */

export const getPlayerSeasonStats = async (req, res) => {
  handleResponse(res, () =>
    playerStatsService.getPlayerSeasonStats(
      req.params.name,
      req.params.seasonId,
    ),
  );
};

/* ======================================================
   SEARCH PLAYERS
====================================================== */

export const searchPlayers = async (req, res) => {
  handleResponse(res, () => playerStatsService.searchPlayers(req.query.q));
};

/* ======================================================
   BATTING LEADERBOARD
====================================================== */

export const getBattingLeaderboard = async (req, res) => {
  handleResponse(res, () =>
    leaderboardService.getBattingLeaderboard(req.params.seasonId),
  );
};

/* ======================================================
   BOWLING LEADERBOARD
====================================================== */

export const getBowlingLeaderboard = async (req, res) => {
  handleResponse(res, () =>
    leaderboardService.getBowlingLeaderboard(req.params.seasonId),
  );
};

/* ======================================================
   FIELDING LEADERBOARD
====================================================== */

export const getFieldingLeaderboard = async (req, res) => {
  handleResponse(res, () =>
    leaderboardService.getFieldingLeaderboard(req.params.seasonId),
  );
};

/* ======================================================
   MOM LEADERBOARD
====================================================== */

export const getMomLeaderboard = async (req, res) => {
  handleResponse(res, () =>
    leaderboardService.getMomLeaderboard(req.params.seasonId),
  );
};
