import express from "express";
import cors from "cors";

import seasonRoutes from "./routes/season.routes.js";
import matchRoutes from "./routes/match.routes.js";
import statsRoutes from "./routes/stats.routes.js"
import teamRoutes from "./routes/team.routes.js"

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/seasons",seasonRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/teams", teamRoutes);


export default app;
