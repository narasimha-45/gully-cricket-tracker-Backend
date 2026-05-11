import * as seasonQueryService
  from "../services/season/seasonQuery.service.js";

import * as seasonCommandService
  from "../services/season/seasonCommand.service.js";

/* ======================================================
   COMMON HANDLER
====================================================== */

const handleResponse =
  async (res, serviceCall) => {
    try {
      const data =
        await serviceCall();

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
   CREATE SEASON
====================================================== */

export const createSeasonController =
  async (req, res) => {
    handleResponse(res, () =>
      seasonCommandService.createSeason(
        req.validatedBody
      )
    );
  };

/* ======================================================
   GET ALL SEASONS
====================================================== */

export const getSeasonsController =
  async (req, res) => {
    handleResponse(res, () =>
      seasonQueryService.getAllSeasons()
    );
  };

/* ======================================================
   GET SEASON DETAILS
====================================================== */

export const getSeasonDetailsController =
  async (req, res) => {
    handleResponse(res, () =>
      seasonQueryService.getSeasonDetails(
        req.params.seasonId
      )
    );
  };