/* ======================================================
   PROCESS BALL ANALYTICS
====================================================== */

export const processBallAnalytics =
  async (
    match,
    accumulators
  ) => {
    /*
     * This processor is intentionally lightweight.
     *
     * Core analytics are already handled inside:
     *
     * - processPlayerStats
     * - processRivalries
     * - processPartnershipAggregates
     * - processPartnershipRecords
     * - processPlayerSplits
     *
     * This file enriches innings analytics flags
     * and prepares future extensibility.
     */

    for (const innings of match.innings) {
      const deliveries =
        innings.ballByBall || [];

      if (
        deliveries.length === 0
      ) {
        innings.analytics = {
          hasBallByBall: false,

          hasRivalries: false,

          hasPartnerships: false,
        };

        continue;
      }

      /* =========================================
         FLAGS
      ========================================= */

      innings.analytics = {
        hasBallByBall: true,

        hasRivalries: true,

        hasPartnerships: true,
      };

      /* =========================================
         FUTURE ANALYTICS PLACEHOLDER
      ========================================= */

      /*
       * Future:
       *
       * - phase analytics
       * - wagon wheels
       * - control %
       * - false shot %
       * - pressure overs
       * - dots by phase
       * - boundary zones
       * - matchup pressure
       * - bowling lengths
       * - scoring areas
       *
       * Intentionally isolated here.
       */
    }
  };