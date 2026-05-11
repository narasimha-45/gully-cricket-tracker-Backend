import express from "express";

import { rebuildAllAnalytics } from "../controllers/admin.controller.js";

const router = express.Router();

/* ======================================================
   REBUILD ANALYTICS
====================================================== */

router.post("/rebuild-analytics", rebuildAllAnalytics);

export default router;
