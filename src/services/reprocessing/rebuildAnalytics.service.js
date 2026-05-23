import Match from "../../models/match.model.js";

import Season from "../../models/season.model.js";

import PlayerProfile from "../../models/PlayerProfile.js";

import TeamProfile from "../../models/TeamProfile.js";

import OverallPlayerStats from "../../models/OverallPlayerStats.js";

import SeasonPlayerStats from "../../models/SeasonPlayerStats.js";

import OverallTeamStats from "../../models/OverallTeamStats.js";

import SeasonTeamStats from "../../models/SeasonTeamStats.js";

import OverallPlayerRivalry from "../../models/OverallPlayerRivalry.js";

import SeasonPlayerRivalry from "../../models/SeasonPlayerRivalry.js";

import OverallPartnershipAggregate from "../../models/OverallPartnershipAggregate.js";

import SeasonPartnershipAggregate from "../../models/SeasonPartnershipAggregate.js";

import PartnershipInnings from "../../models/PartnershipInnings.js";

import OverallPlayerSplits from "../../models/OverallPlayerSplits.js";

import SeasonPlayerSplits from "../../models/SeasonPlayerSplits.js";

import { processCompletedMatch } from "../processing/processCompletedMatch.service.js";

/* ======================================================
   CLEAR DERIVED COLLECTIONS
====================================================== */

const clearDerivedCollections =
  async () => {
    console.log(
      "Clearing derived collections...",
    );

    await Promise.all([
      /* =========================================
         PLAYER STATS
      ========================================= */

      OverallPlayerStats.deleteMany(
        {},
      ),

      SeasonPlayerStats.deleteMany(
        {},
      ),

      /* =========================================
         TEAM STATS
      ========================================= */

      OverallTeamStats.deleteMany(
        {},
      ),

      SeasonTeamStats.deleteMany(
        {},
      ),

      /* =========================================
         RIVALRIES
      ========================================= */

      OverallPlayerRivalry.deleteMany(
        {},
      ),

      SeasonPlayerRivalry.deleteMany(
        {},
      ),

      /* =========================================
         PARTNERSHIPS
      ========================================= */

      OverallPartnershipAggregate.deleteMany(
        {},
      ),

      SeasonPartnershipAggregate.deleteMany(
        {},
      ),

      PartnershipInnings.deleteMany(
        {},
      ),

      /* =========================================
         SPLITS
      ========================================= */

      OverallPlayerSplits.deleteMany(
        {},
      ),

      SeasonPlayerSplits.deleteMany(
        {},
      ),
    ]);

    console.log(
      "Derived collections cleared successfully",
    );
  };

/* ======================================================
   RESET PLAYER PROFILES
====================================================== */

const resetPlayerProfiles =
  async () => {
    console.log(
      "Resetting player profiles...",
    );

    await PlayerProfile.updateMany(
      {},
      {
        $set: {
          seasonsPlayed: [],

          teamsPlayedFor:
            [],

          debutSeasonId:
            null,

          totalMatches: 0,

          lastMatchAt:
            null,
        },
      },
    );

    console.log(
      "Player profiles reset successfully",
    );
  };

/* ======================================================
   RESET TEAM PROFILES
====================================================== */

const resetTeamProfiles =
  async () => {
    console.log(
      "Resetting team profiles...",
    );

    await TeamProfile.updateMany(
      {},
      {
        $set: {
          seasonsPlayed: [],

          totalMatches: 0,

          lastMatchAt:
            null,
        },
      },
    );

    console.log(
      "Team profiles reset successfully",
    );
  };

/* ======================================================
   RESET SEASONS
====================================================== */

const resetSeasons =
  async () => {
    console.log(
      "Resetting seasons...",
    );

    const completedMatches =
      await Match.aggregate([
        {
          $match: {
            status:
              "COMPLETED",
          },
        },

        {
          $group: {
            _id: "$seasonId",

            matchesCount:
              {
                $sum: 1,
              },
          },
        },
      ]);

    /*
     * Reset all first
     */

    await Season.updateMany(
      {},
      {
        $set: {
          matchesCount: 0,
        },
      },
    );

    /*
     * Restore actual counts
     */

    for (const season of completedMatches) {
      await Season.updateOne(
        {
          _id: season._id,
        },

        {
          $set: {
            matchesCount:
              season.matchesCount,
          },
        },
      );
    }

    console.log(
      "Season counts rebuilt successfully",
    );
  };

/* ======================================================
   LOAD MATCHES
====================================================== */

const loadCompletedMatches =
  async () => {
    console.log(
      "Loading completed matches...",
    );

    const matches =
      await Match.find({
        status:
          "COMPLETED",
      }).sort({
        completedAt: 1,

        createdAt: 1,
      });

    console.log(
      `Loaded ${matches.length} completed matches`,
    );

    return matches;
  };

/* ======================================================
   REPROCESS MATCHES
====================================================== */

const reprocessMatches =
  async (matches) => {
    console.log(
      "Starting match reprocessing...",
    );

    let successCount = 0;

    let failedCount = 0;

    const failures = [];

    for (
      let index = 0;
      index < matches.length;
      index++
    ) {
      const match =
        matches[index];

      try {
        console.log(
          "========================================",
        );

        console.log(
          `Processing Match ${index + 1}/${matches.length}`,
        );

        console.log(
          `Match ID: ${match._id}`,
        );

        await processCompletedMatch(
          match,
        );

        successCount += 1;

        console.log(
          `Processed Successfully (${successCount}/${matches.length})`,
        );
      } catch (err) {
        failedCount += 1;

        failures.push({
          matchId:
            match._id,

          error:
            err.message,
        });

        console.error(
          `Failed Match ${match._id}`,
        );

        console.error(err);
      }
    }

    console.log(
      "Match reprocessing completed",
    );

    return {
      successCount,

      failedCount,

      failures,
    };
  };

/* ======================================================
   REBUILD ANALYTICS
====================================================== */

export const rebuildAnalytics =
  async () => {
    console.log(
      "========================================",
    );

    console.log(
      "STARTING FULL ANALYTICS REBUILD",
    );

    console.log(
      "========================================",
    );

    const startedAt =
      Date.now();

    /* =========================================
       CLEAR DERIVED COLLECTIONS
    ========================================= */

    await clearDerivedCollections();

    /* =========================================
       RESET PROFILES
    ========================================= */

    await resetPlayerProfiles();

    await resetTeamProfiles();

    /* =========================================
       RESET SEASONS
    ========================================= */

    await resetSeasons();

    /* =========================================
       LOAD MATCHES
    ========================================= */

    const matches =
      await loadCompletedMatches();

    /* =========================================
       REPROCESS
    ========================================= */

    const results =
      await reprocessMatches(
        matches,
      );

    const duration =
      (
        (Date.now() -
          startedAt) /
        1000
      ).toFixed(2);

    console.log(
      "========================================",
    );

    console.log(
      "ANALYTICS REBUILD COMPLETED",
    );

    console.log(
      "========================================",
    );

    console.log(
      `Duration: ${duration}s`,
    );

    console.log(
      `Success: ${results.successCount}`,
    );

    console.log(
      `Failed: ${results.failedCount}`,
    );

    return {
      success: true,

      durationInSeconds:
        Number(duration),

      processedMatches:
        results.successCount,

      failedMatches:
        results.failedCount,

      totalMatches:
        matches.length,

      failures:
        results.failures,
    };
  };