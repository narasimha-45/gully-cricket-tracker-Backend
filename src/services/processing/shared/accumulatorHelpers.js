import {
  defaultPlayerStats,
  defaultTeamStats,
  defaultPlayerSplits,
  defaultRivalry,
  defaultPartnershipAggregate,
} from "./defaults.js";

/* ======================================================
   TEAM STATS ACCUMULATOR
====================================================== */

export const getTeamStatsAccumulator = ({
  map,
  key,
  payload,
}) => {
  if (!map.has(key)) {
    map.set(key, {
      ...payload,

      stats: defaultTeamStats(),
    });
  }

  return map.get(key);
};

/* ======================================================
   PLAYER STATS ACCUMULATOR
====================================================== */

export const getPlayerStatsAccumulator =
  ({
    map,
    key,
    payload,
  }) => {
    if (!map.has(key)) {
      map.set(key, {
        ...payload,

        ...defaultPlayerStats(),
      });
    }

    return map.get(key);
  };

/* ======================================================
   PLAYER SPLITS ACCUMULATOR
====================================================== */

export const getPlayerSplitsAccumulator =
  ({
    map,
    key,
    payload,
  }) => {
    if (!map.has(key)) {
      map.set(key, {
        ...payload,

        ...defaultPlayerSplits(),
      });
    }

    return map.get(key);
  };

/* ======================================================
   RIVALRY ACCUMULATOR
====================================================== */

export const getRivalryAccumulator =
  ({
    map,
    key,
    payload,
  }) => {
    if (!map.has(key)) {
      map.set(key, {
        ...payload,

        ...defaultRivalry(),
      });
    }

    return map.get(key);
  };

/* ======================================================
   PARTNERSHIP AGGREGATE ACCUMULATOR
====================================================== */

export const getPartnershipAggregateAccumulator =
  ({
    map,
    key,
    payload,
  }) => {
    if (!map.has(key)) {
      map.set(key, {
        ...payload,

        ...defaultPartnershipAggregate(),
      });
    }

    return map.get(key);
  };