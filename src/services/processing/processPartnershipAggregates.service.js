import {
  getPartnershipAggregateAccumulator,
} from "./shared/accumulatorHelpers.js";

import {
  getCanonicalPartnershipPair,
} from "./shared/helpers.js";

/* ======================================================
   PROCESS PARTNERSHIP AGGREGATES
====================================================== */

export const processPartnershipAggregates =
  async (
    match,
    accumulators
  ) => {
    const seasonId =
      match.seasonId;

    const winnerTeamId =
      match.result
        ?.winnerTeamId;

    /* =========================================
       INNINGS LOOP
    ========================================= */

    for (const innings of match.innings) {
      const battingTeamId =
        innings.battingTeamId;

      const battingWon =
        String(
          battingTeamId
        ) ===
        String(
          winnerTeamId
        );

      /*
       * Partnership tracker
       *
       * key:
       * strikerId_nonStrikerId
       */

      const partnerships =
        new Map();

      /* =========================================
         BALL LOOP
      ========================================= */

      for (const delivery of
        innings.ballByBall ||
        []) {
        const strikerId =
          delivery.strikerId;

        const nonStrikerId =
          delivery.nonStrikerId;

        if (
          !strikerId ||
          !nonStrikerId
        ) {
          continue;
        }

        const [
          player1Id,
          player2Id,
        ] =
          getCanonicalPartnershipPair(
            strikerId,
            nonStrikerId
          );

        const partnershipKey =
          `${player1Id}_${player2Id}`;

        if (
          !partnerships.has(
            partnershipKey
          )
        ) {
          partnerships.set(
            partnershipKey,
            {
              player1Id,

              player2Id,

              runs: 0,

              balls: 0,

              fours: 0,

              sixes: 0,
            }
          );
        }

        const partnership =
          partnerships.get(
            partnershipKey
          );

        const runs =
          delivery.runs || 0;

        const type =
          delivery.type;

        const isLegalBall =
          type !== "WIDE" &&
          type !== "NO_BALL";

        /* =========================================
           RUNS
        ========================================= */

        partnership.runs +=
          runs;

        /* =========================================
           BALLS
        ========================================= */

        if (
          isLegalBall
        ) {
          partnership.balls +=
            1;
        }

        /* =========================================
           BOUNDARIES
        ========================================= */

        if (
          runs === 4
        ) {
          partnership.fours +=
            1;
        }

        if (
          runs === 6
        ) {
          partnership.sixes +=
            1;
        }
      }

      /* =========================================
         UPDATE ACCUMULATORS
      ========================================= */

      for (const partnership of
        partnerships.values()) {
        const overallAggregate =
          getPartnershipAggregateAccumulator(
            {
              map:
                accumulators.overallPartnerships,

              key:
                `${partnership.player1Id}_${partnership.player2Id}`,

              payload: {
                player1Id:
                  partnership.player1Id,

                player2Id:
                  partnership.player2Id,
              },
            }
          );

        const seasonAggregate =
          getPartnershipAggregateAccumulator(
            {
              map:
                accumulators.seasonPartnerships,

              key:
                `${seasonId}_${partnership.player1Id}_${partnership.player2Id}`,

              payload: {
                seasonId,

                player1Id:
                  partnership.player1Id,

                player2Id:
                  partnership.player2Id,
              },
            }
          );

        for (const aggregate of [
          overallAggregate,
          seasonAggregate,
        ]) {
          aggregate.innings +=
            1;

          aggregate.runs +=
            partnership.runs;

          aggregate.balls +=
            partnership.balls;

          aggregate.fours +=
            partnership.fours;

          aggregate.sixes +=
            partnership.sixes;

          if (
            battingWon
          ) {
            aggregate.wins +=
              1;
          } else {
            aggregate.losses +=
              1;
          }

          /* =========================================
             HIGHEST PARTNERSHIP
          ========================================= */

          if (
            partnership.runs >
            aggregate.highest
              .runs
          ) {
            aggregate.highest =
              {
                runs:
                  partnership.runs,

                matchId:
                  match._id,
              };
          }
        }
      }
    }
  };