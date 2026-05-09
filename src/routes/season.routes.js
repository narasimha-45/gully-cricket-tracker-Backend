import express from "express";
import {
  createSeasonController,
  getSeasonsController
} from "../controllers/season.controller.js";

const router = express.Router();

router.get("/", getSeasonsController);
router.post("/", createSeasonController);

export default router;
