import * as playerStatsService from "../services/stats/playerStats.service.js";
import * as leaderboardService from "../services/stats/leaderboard.service.js";
import * as rivalryService from "../services/stats/rivalry.service.js";
import * as teamService from "../services/team/teamQuery.service.js";
import * as teamStatsService from "../services/stats/teamStats.service.js";

/* ======================================================
   TEAM PROFILE
====================================================== */

export const getTeamProfile = async (req, res) => {
  handleResponse(res, () => teamStatsService.getTeamProfile(req.params.idOrName, req.query));
};

export const searchTeams = async (req, res) => {
  handleResponse(res, () => teamStatsService.searchTeams(req.query.q));
};

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
  handleResponse(res, () => rivalryService.getPlayerHeadToHead(req.query));
};

/* ======================================================
   COMMON RESPONSE HANDLER
====================================================== */

const handleResponse = async (res, serviceCall) => {
  try {
    const data = await serviceCall();
    console.log("data",data)
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

import * as playerSplitsService from "../services/stats/playerSplits.service.js";

/* ======================================================
   SEARCH PLAYERS
====================================================== */

export const searchPlayers = async (req, res) => {
  handleResponse(res, () => playerStatsService.searchPlayers(req.query.q));
};

/* ======================================================
   PLAYER SPLITS
====================================================== */

export const getPlayerSplits = async (req, res) => {
  handleResponse(res, () => playerSplitsService.getPlayerSplits(req.params.name, req.query));
};

/* ======================================================
   BATTING LEADERBOARD
====================================================== */

import * as leaderboardFilteredService from "../services/stats/leaderboardFiltered.service.js";

export const getSeasonBattingLeaderboard = async (req, res) => {
  handleResponse(res, () =>
    leaderboardFilteredService.getFilteredBattingLeaderboard({ ...req.query, seasonId: req.params.seasonId })
  );
};

export const getOverallBattingLeaderboard = async (req, res) => {
  handleResponse(res, () => leaderboardFilteredService.getFilteredBattingLeaderboard(req.query));
}


/* ======================================================
   BOWLING LEADERBOARD
====================================================== */

export const getSeasonBowlingLeaderboard = async (req, res) => {
  handleResponse(res, () =>
    leaderboardFilteredService.getFilteredBowlingLeaderboard({ ...req.query, seasonId: req.params.seasonId })
  );
};

export const getOverallBowlingLeaderboard = async (req, res) => {
  handleResponse(res, () => leaderboardFilteredService.getFilteredBowlingLeaderboard(req.query));
}

/* ======================================================
   FIELDING LEADERBOARD
====================================================== */

export const getSeasonFieldingLeaderboard = async (req, res) => {
  handleResponse(res, () =>
    leaderboardFilteredService.getFilteredFieldingLeaderboard({ ...req.query, seasonId: req.params.seasonId }),
  );
};

export const getOverallFieldingLeaderboard = async (req, res) => {
  handleResponse(res, () => leaderboardFilteredService.getFilteredFieldingLeaderboard(req.query));
}

/* ======================================================
   MOM LEADERBOARD
====================================================== */

export const getMomLeaderboard = async (req, res) => {
  handleResponse(res, () =>
    leaderboardFilteredService.getFilteredMomLeaderboard({ ...req.query, seasonId: req.params.seasonId }),
  );
};
