import * as matchQueryService from "../services/match/matchQuery.service.js";
import * as matchCommandService from "../services/match/matchCommand.service.js";
import { completeMatch } from "../services/match/matchComplete.service.js";

/* ======================================================
   COMMON HANDLER
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
   MATCH CREATE
====================================================== */

export const submitMatch = async (req, res) => {
  handleResponse(res, () => matchCommandService.createMatch(req.body));
}

/* ======================================================
   SCORECARD
====================================================== */

export const getMatchScorecard = async (req, res) => {
  handleResponse(res, () =>
    matchQueryService.getMatchScorecard(req.params.matchId),
  );
};

/* ======================================================
   RECENT MATCHES
====================================================== */

export const getRecentMatches = async (req, res) => {
  handleResponse(res, () => matchQueryService.getRecentMatches());
};

/* ======================================================
   SEASON MATCHES
====================================================== */

export const getSeasonMatches = async (req, res) => {
  handleResponse(res, () =>
    matchQueryService.getSeasonMatches(req.params.seasonId),
  );
};

/* ======================================================
   COMPLETE MATCH (from live tracker frontend)
====================================================== */

export const completeMatchHandler = async (req, res) => {
  handleResponse(res, () => completeMatch(req.body));
};
