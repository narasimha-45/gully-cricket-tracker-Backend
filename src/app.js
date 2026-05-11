import express from "express";
import cors from "cors";

import seasonRoutes from "./routes/season.routes.js";
import matchRoutes from "./routes/match.routes.js";
import statsRoutes from "./routes/stats.routes.js";
import teamRoutes from "./routes/team.routes.js";
import adminRoutes from "./routes/admin.routes.js";

const app = express();

/* ======================================================
   MIDDLEWARE
====================================================== */

app.use(cors());

app.use(express.json());

/* ======================================================
   ROUTES
====================================================== */

app.use("/api/matches", matchRoutes);

app.use("/api/seasons", seasonRoutes);

app.use("/api/stats", statsRoutes);

app.use("/api/teams", teamRoutes);

app.use("/api/admin", adminRoutes);

/* ======================================================
   HEALTH CHECK
====================================================== */

app.get("/", (req, res) => {
  return res.json({
    success: true,
    message: "Gully Cricket Tracker API Running",
  });
});

/* ======================================================
   GLOBAL ERROR HANDLER
====================================================== */

app.use((err, req, res, next) => {
  console.error(err);

  return res.status(500).json({
    success: false,
    message: err.message,
  });
});

export default app;
