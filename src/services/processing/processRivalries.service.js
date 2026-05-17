import PlayerRivalryStats from "../../models/PlayerRivalryStats.js";

/* ======================================================
   HELPERS
====================================================== */

const normalize = (v) => v?.trim()?.toLowerCase?.() || "";

/* ======================================================
   PROCESS RIVALRIES
====================================================== */

export const processRivalries = async (match) => {
  const bulkOps = [];

  /* =========================================
     ONLY NEW MATCHES WITH BALL DATA
  ========================================= */
  const inningsToProcess = (match.innings || []).filter(
    (inn) =>
      !inn.isSuperOver &&
      Array.isArray(inn.ballByBall) &&
      inn.ballByBall.length > 0,
  );

  for (const innings of inningsToProcess) {
    for (const ball of innings.ballByBall) {
      const batter = normalize(ball.striker);

      const bowler = normalize(ball.bowler);

      if (!batter || !bowler) {
        continue;
      }
      const runs = ball.runs || 0;

      const isLegal = ball.type === "RUN";

      const isDot = isLegal && runs === 0;

      const isFour = runs === 4;

      const isSix = runs === 6;

      const isDismissal = !!ball.isWicket;

      /* =====================================
         OVERALL
      ===================================== */

      bulkOps.push({
        updateOne: {
          filter: { batter, bowler, seasonId: null },

          update: {
            $inc: {
              "stats.balls": isLegal ? 1 : 0,

              "stats.runs": runs,

              "stats.dots": isDot ? 1 : 0,

              "stats.fours": isFour ? 1 : 0,

              "stats.sixes": isSix ? 1 : 0,

              "stats.dismissals": isDismissal ? 1 : 0,
            },
          },

          upsert: true,
        },
      });

      /* =====================================
         SEASON
      ===================================== */

      bulkOps.push({
        updateOne: {
          filter: {
            batter,
            bowler,
            seasonId: match.seasonId,
          },

          update: {
            $inc: {
              "stats.balls": isLegal ? 1 : 0,

              "stats.runs": runs,

              "stats.dots": isDot ? 1 : 0,

              "stats.fours": isFour ? 1 : 0,

              "stats.sixes": isSix ? 1 : 0,

              "stats.dismissals": isDismissal ? 1 : 0,
            },
          },

          upsert: true,
        },
      });
    }
  }

  if (bulkOps.length > 0) {
    await PlayerRivalryStats.bulkWrite(bulkOps);
  }

  return true;
};
