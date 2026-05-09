import express from "express";
import {
  getTeamsBySeason,
} from "../controllers/team.controller.js";

const router = express.Router();

router.get("/", getTeamsBySeason);

export default router;
