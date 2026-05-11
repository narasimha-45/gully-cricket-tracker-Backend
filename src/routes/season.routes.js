import express from "express";

import {
 

  createSeasonController,

  getSeasonsController,

} from "../controllers/season.controller.js";

const router = express.Router();

/* ======================================================
   CREATE SEASON
   POST /api/seasons
====================================================== */

router.post(
  "/",
  createSeasonController
);

/* ======================================================
   GET ALL SEASONS
   GET /api/seasons
====================================================== */

router.get(
  "/",
  getSeasonsController
);

export default router;