/* ======================================================
   NORMALIZE
====================================================== */

export const normalize = (value = "") => value.trim().toLowerCase();

/* ======================================================
   BALLS TO OVERS
====================================================== */

export const ballsToOvers = (balls = 0) => {
  return Math.floor(balls / 6) + (balls % 6) / 10;
};

/* ======================================================
   GET RUN BUCKET
====================================================== */

export const getRunBucket = (runs = 0) => {
  if (runs >= 100) return 9;

  return Math.floor(runs / 10);
};

/* ======================================================
   DISMISSAL KEY
====================================================== */

export const dismissalKey = (type) => {
  switch (type) {
    case "BOWLED":
      return "bowled";

    case "CAUGHT":
      return "caught";

    case "LBW":
      return "lbw";

    case "RUN_OUT":
      return "runOut";

    case "STUMPED":
      return "stumped";

    case "HIT_WICKET":
      return "hitWicket";

    default:
      return null;
  }
};

/* ======================================================
   PUSH RECENT MATCH
====================================================== */

export const pushRecentMatch = (bucket, matchId, limit = 10000) => {
  if (!bucket.recentMatches) {
    bucket.recentMatches = [];
  }

  bucket.count += 1;

  bucket.recentMatches.unshift(matchId);

  bucket.recentMatches = bucket.recentMatches.slice(0, limit);
};

/* ======================================================
   UPDATE TOP LIST
====================================================== */

export const updateTopList = (list, playerId) => {
  if (!Array.isArray(list)) list = []; 
  const existing = list.find(
    (entry) => String(entry.playerId) === String(playerId),
  );

  if (existing) {
    existing.count += 1;
  } else {
    list.push({
      playerId,
      count: 1,
    });
  }

  list.sort((a, b) => b.count - a.count);

  return list.slice(0, 10);
};

/* ======================================================
   ENSURE SPLIT
====================================================== */

export const ensureSplit = (target, key, defaultPlayerSplit) => {
  if (!target[key]) {
    target[key] = defaultPlayerSplit();
  }

  return target[key];
};

/* ======================================================
   GET CANONICAL PARTNERSHIP PAIR
====================================================== */

export const getCanonicalPartnershipPair = (player1Id, player2Id) => {
  return [player1Id, player2Id].map(String).sort();
};
