/* ======================================================
   NORMALIZE NAME
====================================================== */

export const normalizeName = (name = "") => {
  return name.trim().toLowerCase();
};

/* ======================================================
   SCORE BUCKET
====================================================== */

export const getScoreBucket = (runs) => {
  if (runs >= 100) return 10;

  return Math.floor(runs / 10);
};

/* ======================================================
   CREATE SCORE ARRAY
====================================================== */

export const createScoreArray = () => {
  return Array(11).fill(0);
};

/* ======================================================
   DISMISSAL TYPE
====================================================== */

export const normalizeDismissalType = (type) => {
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
   INCREMENT OBJECT VALUE
====================================================== */

export const incrementMapValue = (obj, key, value = 1) => {
  obj[key] = (obj[key] || 0) + value;
};

export const incrementNestedValue = (obj, key, nestedKey, amount = 1) => {
  if (!obj[key]) {
    obj[key] = {
      total: 0,
    };
  }

  obj[key].total = (obj[key].total || 0) + amount;

  if (nestedKey) {
    obj[key][nestedKey] = (obj[key][nestedKey] || 0) + amount;
  }
};
