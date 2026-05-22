import {
  getCanonicalPartnershipPair,
} from "./shared/helpers.js";

/* ======================================================
   PROCESS PARTNERSHIP RECORDS
====================================================== */

export const processPartnershipRecords =
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
       ENSURE ARRAY
    ========================================= */

    if (
      !accumulators.partnershipInnings
    ) {
      accumulators.partnershipInnings =
        [];
    }

    /* =========================================
       INNINGS LOOP
    ========================================= */

    for (
      let inningsIndex = 0;
      inningsIndex <
      match.innings.length;
      inningsIndex++
    ) {
      const innings =
        match.innings[
          inningsIndex
        ];

      const battingTeamId =
        innings.battingTeamId;

      const bowlingTeamId =
        innings.bowlingTeamId;

      const won =
        String(
          battingTeamId
        ) ===
        String(
          winnerTeamId
        );

      const successfulChase =
        inningsIndex === 1 &&
        won;

      const defended =
        inningsIndex === 0 &&
        won;

      /*
       * Partnership tracker
       *
       * wicketNumber => partnership
       */

      const wicketPartnerships =
        new Map();

      let currentWicket = 0;

      let currentPartnership =
        null;

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

        /*
         * Start partnership
         */

        if (
          !currentPartnership
        ) {
          const [
            player1Id,
            player2Id,
          ] =
            getCanonicalPartnershipPair(
              strikerId,
              nonStrikerId
            );

          currentPartnership =
            {
              seasonId,

              matchId:
                match._id,

              inningsNumber:
                inningsIndex +
                1,

              wicket:
                currentWicket,

              battingTeamId,

              opponentTeamId:
                bowlingTeamId,

              player1Id,

              player2Id,

              runs: 0,

              balls: 0,

              fours: 0,

              sixes: 0,

              startScore: 0,

              endScore: 0,

              won,

              successfulChase,

              defended,

              date:
                match.completedAt,
            };
        }

        const runs =
          delivery.runs || 0;

        const type =
          delivery.type;

        const isLegalBall =
          type !== "WIDE" &&
          type !== "NO_BALL";

        /* =========================================
           UPDATE PARTNERSHIP
        ========================================= */

        currentPartnership.runs +=
          runs;

        currentPartnership.endScore +=
          runs;

        if (
          isLegalBall
        ) {
          currentPartnership.balls +=
            1;
        }

        if (
          runs === 4
        ) {
          currentPartnership.fours +=
            1;
        }

        if (
          runs === 6
        ) {
          currentPartnership.sixes +=
            1;
        }

        /* =========================================
           WICKET ENDS PARTNERSHIP
        ========================================= */

        if (
          delivery.isWicket &&
          delivery.wicket
        ) {
          wicketPartnerships.set(
            currentWicket,
            currentPartnership
          );

          currentWicket += 1;

          currentPartnership =
            null;
        }
      }

      /*
       * Last unbeaten partnership
       */

      if (
        currentPartnership
      ) {
        wicketPartnerships.set(
          currentWicket,
          currentPartnership
        );
      }

      /* =========================================
         PUSH TO ACCUMULATOR
      ========================================= */

      for (const partnership of
        wicketPartnerships.values()) {
        accumulators.partnershipInnings.push(
          partnership
        );
      }
    }
  };