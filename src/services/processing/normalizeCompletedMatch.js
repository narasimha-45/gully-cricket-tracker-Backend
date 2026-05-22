/* ======================================================
   NORMALIZE
====================================================== */

const normalize = (value = "") =>
  value.trim().toLowerCase();

/* ======================================================
   GET PLAYER ID
====================================================== */

const getPlayerId = ({
  playerName,
  playerMap,
}) => {
  const player = playerMap.get(
    normalize(playerName)
  );

  if (!player) {
    throw new Error(
      `Player not found: ${playerName}`
    );
  }

  return player._id;
};

/* ======================================================
   GET TEAM ID
====================================================== */

const getTeamId = ({
  teamName,
  teamMap,
}) => {
  const team = teamMap.get(
    normalize(teamName)
  );

  if (!team) {
    throw new Error(
      `Team not found: ${teamName}`
    );
  }

  return team._id;
};

/* ======================================================
   NORMALIZE BATTING STATS
====================================================== */

const normalizeBattingStats = ({
  battingStats,
  playerMap,
}) => {
  const normalized = {};

  for (const [playerName, stats] of Object.entries(
    battingStats || {}
  )) {
    const playerId = getPlayerId({
      playerName,
      playerMap,
    });

    normalized[playerId] = {
      ...stats,

      playerId,
    };

    if (stats.dismissal?.bowler) {
      normalized[playerId].dismissal.bowlerId =
        getPlayerId({
          playerName:
            stats.dismissal.bowler,
          playerMap,
        });
    }

    if (stats.dismissal?.fielder) {
      normalized[playerId].dismissal.fielderId =
        getPlayerId({
          playerName:
            stats.dismissal.fielder,
          playerMap,
        });
    }
  }

  return normalized;
};

/* ======================================================
   NORMALIZE BOWLING STATS
====================================================== */

const normalizeBowlingStats = ({
  bowlingStats,
  playerMap,
}) => {
  const normalized = {};

  for (const [playerName, stats] of Object.entries(
    bowlingStats || {}
  )) {
    const playerId = getPlayerId({
      playerName,
      playerMap,
    });

    normalized[playerId] = {
      ...stats,

      playerId,
    };
  }

  return normalized;
};

/* ======================================================
   NORMALIZE DISMISSALS
====================================================== */

const normalizeDismissals = ({
  dismissals,
  playerMap,
}) => {
  const normalized = {};

  for (const [playerName, dismissal] of Object.entries(
    dismissals || {}
  )) {
    const playerId = getPlayerId({
      playerName,
      playerMap,
    });

    normalized[playerId] = {
      ...dismissal,

      playerId,
    };

    if (dismissal?.bowler) {
      normalized[playerId].bowlerId =
        getPlayerId({
          playerName:
            dismissal.bowler,
          playerMap,
        });
    }

    if (dismissal?.fielder) {
      normalized[playerId].fielderId =
        getPlayerId({
          playerName:
            dismissal.fielder,
          playerMap,
        });
    }
  }

  return normalized;
};

/* ======================================================
   NORMALIZE BALL BY BALL
====================================================== */

const normalizeBallByBall = ({
  deliveries,
  playerMap,
}) => {
  return (deliveries || []).map(
    (delivery) => {
      const normalizedDelivery = {
        ...delivery,

        strikerId: getPlayerId({
          playerName:
            delivery.striker,
          playerMap,
        }),

        nonStrikerId: getPlayerId({
          playerName:
            delivery.nonStriker,
          playerMap,
        }),

        bowlerId: getPlayerId({
          playerName:
            delivery.bowler,
          playerMap,
        }),
      };

      if (delivery.wicket) {
        normalizedDelivery.wicket = {
          ...delivery.wicket,

          outBatsmanId:
            getPlayerId({
              playerName:
                delivery.wicket
                  .outBatsman,
              playerMap,
            }),

          helperId:
            delivery.wicket.helper
              ? getPlayerId({
                  playerName:
                    delivery.wicket
                      .helper,
                  playerMap,
                })
              : null,
        };
      }

      return normalizedDelivery;
    }
  );
};

/* ======================================================
   NORMALIZE INNINGS
====================================================== */

const normalizeInnings = ({
  innings,
  teamMap,
  playerMap,
}) => {
  return {
    ...innings,

    battingTeamId: getTeamId({
      teamName:
        innings.battingTeam,
      teamMap,
    }),

    bowlingTeamId: getTeamId({
      teamName:
        innings.bowlingTeam,
      teamMap,
    }),

    battingOrder: Object.keys(
      innings.battingStats || {}
    ).map((playerName) =>
      getPlayerId({
        playerName,
        playerMap,
      })
    ),

    battingStats:
      normalizeBattingStats({
        battingStats:
          innings.battingStats,
        playerMap,
      }),

    bowlingStats:
      normalizeBowlingStats({
        bowlingStats:
          innings.bowlingStats,
        playerMap,
      }),

    dismissals:
      normalizeDismissals({
        dismissals:
          innings.dismissals,
        playerMap,
      }),

    ballByBall:
      normalizeBallByBall({
        deliveries:
          innings.ballByBall,
        playerMap,
      }),

    analytics: {
      hasBallByBall:
        (innings.ballByBall || [])
          .length > 0,

      hasRivalries:
        (innings.ballByBall || [])
          .length > 0,

      hasPartnerships:
        (innings.ballByBall || [])
          .length > 0,
    },
  };
};

/* ======================================================
   NORMALIZE MATCH
====================================================== */

export const normalizeCompletedMatch = async ({
  rawMatch,
  teamMap,
  playerMap,
}) => {
  return {
    ...rawMatch,

    teams: {
      teamA: {
        ...rawMatch.teams.teamA,

        teamId: getTeamId({
          teamName:
            rawMatch.teams.teamA.name,
          teamMap,
        }),

        players:
          rawMatch.teams.teamA.players.map(
            (playerName) =>
              getPlayerId({
                playerName,
                playerMap,
              })
          ),
      },

      teamB: {
        ...rawMatch.teams.teamB,

        teamId: getTeamId({
          teamName:
            rawMatch.teams.teamB.name,
          teamMap,
        }),

        players:
          rawMatch.teams.teamB.players.map(
            (playerName) =>
              getPlayerId({
                playerName,
                playerMap,
              })
          ),
      },
    },

    toss: {
      ...rawMatch.toss,

      winnerTeamId: getTeamId({
        teamName:
          rawMatch.toss.winner,
        teamMap,
      }),
    },

    innings: (
      rawMatch.innings || []
    ).map((innings) =>
      normalizeInnings({
        innings,
        teamMap,
        playerMap,
      })
    ),

    result: {
      ...rawMatch.result,

      winnerTeamId: getTeamId({
        teamName:
          rawMatch.result.winner,
        teamMap,
      }),

      manOfTheMatchId:
        rawMatch.result
          .manOfTheMatch
          ? getPlayerId({
              playerName:
                rawMatch.result
                  .manOfTheMatch,
              playerMap,
            })
          : null,
    },

    status: "COMPLETED",

    completedAt: new Date(),
  };
};