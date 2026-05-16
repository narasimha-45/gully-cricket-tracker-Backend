import express from "express";

import {
 

  createSeasonController,

  getSeasonsController,

} from "../controllers/season.controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/seasons:
 *   post:
 *     summary: Create a new season
 *     tags: [Seasons]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Season created successfully
 *   get:
 *     summary: Get all seasons
 *     tags: [Seasons]
 *     responses:
 *       200:
 *         description: List of all seasons
 */
router.post(
  "/",
  createSeasonController
);

router.get(
  "/",
  getSeasonsController
);

export default router;