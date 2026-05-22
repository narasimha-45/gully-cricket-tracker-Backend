import {
  getRivalryAccumulator,
} from "./shared/accumulatorHelpers.js";

import {
  dismissalKey,
} from "./shared/helpers.js";

/* ======================================================
   PROCESS RIVALRIES
====================================================== */

export const processRivalries =
  async (
    match,
    accumulators
  ) => {
    const seasonId =
      match.seasonId;

    /* =========================================
       INNINGS LOOP
    ========================================= */

    for (const innings of match.innings) {
      for (const delivery of
        innings.ballByBall ||
        []) {
        const batterId =
          delivery.strikerId;

        const bowlerId =
          delivery.bowlerId;

        if (
          !batterId ||
          !bowlerId
        ) {
          continue;
        }

        /* =========================================
           GET ACCUMULATORS
        ========================================= */

        const overallRivalry =
          getRivalryAccumulator(
            {
              map:
                accumulators.overallPlayerRivalries,

              key:
                `${batterId}_${bowlerId}`,

              payload: {
                batterId,

                bowlerId,
              },
            }
          );

        const seasonRivalry =
          getRivalryAccumulator(
            {
              map:
                accumulators.seasonPlayerRivalries,

              key:
                `${seasonId}_${batterId}_${bowlerId}`,

              payload: {
                seasonId,

                batterId,

                bowlerId,
              },
            }
          );

        const rivalries = [
          overallRivalry,
          seasonRivalry,
        ];

        /* =========================================
           DELIVERY METRICS
        ========================================= */

        const runs =
          delivery.runs || 0;

        const type =
          delivery.type;

        const isLegalBall =
          type !== "WIDE" &&
          type !== "NO_BALL";

        for (const rivalry of rivalries) {
          rivalry.runs += runs;

          if (
            runs === 4
          ) {
            rivalry.fours += 1;
          }

          if (
            runs === 6
          ) {
            rivalry.sixes += 1;
          }

          if (
            isLegalBall
          ) {
            rivalry.balls += 1;
          }
        }

        /* =========================================
           WICKET
        ========================================= */

        if (
          delivery.isWicket &&
          delivery.wicket
        ) {
          const outBatsmanId =
            delivery.wicket
              .outBatsmanId;

          /*
           * Rivalry wicket only valid
           * if striker got dismissed
           */

          if (
            String(
              outBatsmanId
            ) ===
            String(
              batterId
            )
          ) {
            for (const rivalry of rivalries) {
              rivalry.wickets +=
                1;

              const key =
                dismissalKey(
                  delivery.wicket
                    .type
                );

              if (
                key &&
                rivalry.dismissals[
                  key
                ] !== undefined
              ) {
                rivalry.dismissals[
                  key
                ] += 1;
              }
            }
          }
        }
      }
    }
  };