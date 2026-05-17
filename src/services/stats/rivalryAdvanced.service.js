import PlayerRivalryStats from "../../models/PlayerRivalryStats.js";

const normalize = (v) =>
  v.trim().toLowerCase();

export const getAdvancedRivalry = async ({
  batter,
  bowler,
  seasonId,
}) => {
  const rivalry =
    await PlayerRivalryStats.findOne({
      batter: normalize(batter),

      bowler: normalize(bowler),

      seasonId:
        seasonId === "overall"
          ? null
          : seasonId,
    }).lean();

  if (!rivalry) {
    return {
      batter,
      bowler,

      stats: {
        balls: 0,
        runs: 0,
        dots: 0,
        fours: 0,
        sixes: 0,
        dismissals: 0,
      },

      strikeRate: 0,
      dotPercentage: 0,
    };
  }
 const balls =
    rivalry.stats.balls || 0;

  const runs =
    rivalry.stats.runs || 0;

  const dots =
    rivalry.stats.dots || 0;

  return {
    ...rivalry,

    strikeRate:
      balls > 0
        ? Number(
            (
              (runs / balls) * 100
            ).toFixed(2)
          )
        : 0,

    dotPercentage:
      balls > 0        ? Number(
            (
              (dots / balls) * 100
            ).toFixed(2)
          )
        : 0,
  };
};