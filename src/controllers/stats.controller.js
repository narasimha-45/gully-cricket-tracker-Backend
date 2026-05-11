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

export const getSeasonBattingLeaderboard = async (req, res) => {
  handleResponse(res, () =>
    leaderboardService.getSeasonBattingLeaderboard(req.params.seasonId),
  );
};

export const getOverallBattingLeaderboard = async (req, res) => {
  handleResponse(res, () => leaderboardService.getOverallBattingLeaderboard());
}


/* ======================================================
   BOWLING LEADERBOARD
====================================================== */

export const getSeasonBowlingLeaderboard = async (req, res) => {
  handleResponse(res, () =>
    leaderboardService.getSeasonBowlingLeaderboard(req.params.seasonId),
  );
};

export const getOverallBowlingLeaderboard = async (req, res) => {
  handleResponse(res, () => leaderboardService.getOverallBowlingLeaderboard());
}

/* ======================================================
   FIELDING LEADERBOARD
====================================================== */

export const getSeasonFieldingLeaderboard = async (req, res) => {
  handleResponse(res, () =>
    leaderboardService.getSeasonFieldingLeaderboard(req.params.seasonId),
  );
};

export const getOverallFieldingLeaderboard = async (req, res) => {
  handleResponse(res, () => leaderboardService.getOverallFieldingLeaderboard());
}

/* ======================================================
   MOM LEADERBOARD
====================================================== */

export const getMomLeaderboard = async (req, res) => {
  handleResponse(res, () =>
    leaderboardService.getMomLeaderboard(req.params.seasonId),
  );
};
