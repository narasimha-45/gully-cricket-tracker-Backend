import OverallPlayerStats from "../../models/OverallPlayerStats.js";

/* ======================================================
   HELPERS
====================================================== */

const normalize = (name) => name.trim().toLowerCase();

/* ======================================================
   BATTER VS BOWLER
====================================================== */

export const getBatterVsBowler = async ({ batter, bowler }) => {
  if (!batter || !bowler) {
    throw new Error("Batter and bowler are required");
  }

  const batterStats = await OverallPlayerStats.findOne({
    name: normalize(batter),
  }).lean();

  const bowlerStats = await OverallPlayerStats.findOne({
    name: normalize(bowler),
  }).lean();

  if (!batterStats) {
    throw new Error("Batter not found");
  }

  if (!bowlerStats) {
    throw new Error("Bowler not found");
  }

  /* =========================================
       DISMISSALS
    ========================================= */

  const dismissals = batterStats.batting.dismissedBy?.[normalize(bowler)] || 0;

  /* =========================================
       BOWLER SIDE VALIDATION
    ========================================= */

  const bowlerDismissals =
    bowlerStats.bowling.dismissedBatters?.[normalize(batter)] || 0;

  return {
    batter: normalize(batter),

    bowler: normalize(bowler),

    dismissals,

    validated: dismissals === bowlerDismissals,

    batting: {
      /*
          FUTURE:
          ball-by-ball engine

          runs vs bowler
          balls vs bowler
          strike rate
        */
    },
  };
};

/* ======================================================
   TEAM HEAD TO HEAD
====================================================== */

export const getTeamHeadToHead = async () => {
  return {
    message: "Coming soon",
  };
};

/* ======================================================
   PLAYER HEAD TO HEAD
====================================================== */

export const getPlayerHeadToHead = async () => {
  return {
    message: "Coming soon",
  };
};
