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

export const incrementNestedValue = (obj, key1, key2) => {
  if (!obj[key1]) obj[key1] = { total: 0 };
  if (typeof obj[key1] === "number") {
    obj[key1] = { total: obj[key1] };
  }
  obj[key1].total = (obj[key1].total || 0) + 1;
  obj[key1][key2] = (obj[key1][key2] || 0) + 1;
};
