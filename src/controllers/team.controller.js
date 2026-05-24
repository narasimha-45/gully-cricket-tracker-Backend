import * as teamService from "../services/team/teamQuery.service.js";
import * as teamStandingsService from "../services/team/teamStandings.service.js";

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
   TEAM STANDINGS
====================================================== */

export const getTeamStandings = async (req, res) => {
  handleResponse(res, () => teamStandingsService.getTeamStandings(req.query.seasonId));
};

/* ======================================================
   TEAM PROFILE
====================================================== */

export const getTeamProfile = async (req, res) => {
  handleResponse(res, () => teamService.getTeamProfile(req.params.teamName));
};


export const getTeamPlayers = async(req,res) =>{
  handleResponse(res, () => teamService.getTeamPlayers(req.params.teamId));
}
/* ======================================================
   TEAM MATCHES
====================================================== */

export const getTeamMatches = async (req, res) => {
  handleResponse(res, () =>
    teamService.getTeamMatches(req.params.teamName, req.query),
  );
};

/* ======================================================
   SEASON TEAMS
====================================================== */

export const getSeasonTeams = async (req, res) => {
  handleResponse(res, () => teamService.getSeasonTeams(req.params.seasonId));
};

export const getAllTeams = async (req, res) => {
  handleResponse(res, () => teamService.getAllTeams());
};

/* ======================================================
   POINTS TABLE
====================================================== */

export const getPointsTable = async (req, res) => {
  handleResponse(res, () => teamService.getPointsTable(req.params.seasonId));
};
