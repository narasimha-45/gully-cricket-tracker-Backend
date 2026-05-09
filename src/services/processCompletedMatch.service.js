import Match from "../models/match.model.js";
import Player from "../models/player.model.js";
import Team from "../models/team.model.js";

export const processCompletedMatch = async (match) => {
  const session = await Match.startSession();
  session.startTransaction();

  try {
    const { seasonId } = match;

    /* ------------------ 1. UPSERT PLAYERS (SEASON-SCOPED) ------------------ */
    const allPlayerNames = new Set();

    Object.values(match.teams).forEach((team) => {
      team.players.forEach((p) => {
        allPlayerNames.add(p.trim().toLowerCase());
      });
    });

    const playersMap = {};

    for (const name of allPlayerNames) {
      const player = await Player.findOneAndUpdate(
        { name, seasonId },
        {
          $setOnInsert: {
            name,
            seasonId,
          },
        },
        { upsert: true, new: true, session }
      );

      playersMap[name] = player;
    }

    /* ------------------ 2. UPSERT TEAMS ------------------ */
    for (const key of ["teamA", "teamB"]) {
      const teamData = match.teams[key];

      const playerIds = teamData.players.map((name) => {
        const key = name.trim().toLowerCase();
        if (!playersMap[key]) {
          throw new Error(`Player not found in playersMap: ${name}`);
        }
        return playersMap[key]._id;
      });

      await Team.findOneAndUpdate(
        { name: teamData.name, seasonId },
        {
          name: teamData.name,
          seasonId,
          players: playerIds,
        },
        { upsert: true, session }
      );
    }

    /* ------------------ 3. PROCESS INNINGS ------------------ */
    for (const inning of match.innings) {
      /* -------- Batting -------- */
      for (const [name, stats] of Object.entries(inning.battingStats || {})) {
        const key = name.trim().toLowerCase();
        const player = playersMap[key];

        if (!player) {
          throw new Error(`Batting player not found: ${name}`);
        }

        const isOut = !!stats.dismissal;
        const isDuck = isOut && stats.runs === 0;

        await Player.updateOne(
          { _id: player._id },
          {
            $inc: {
              "batting.innings": stats.balls > 0 ? 1 : 0,
              "batting.runs": stats.runs,
              "batting.balls": stats.balls,
              "batting.fours": stats.fours,
              "batting.sixes": stats.sixes,
              "batting.outs": isOut ? 1 : 0,
              "batting.ducks": isDuck ? 1 : 0,
            },
          },
          { session }
        );
      }

      /* -------- Bowling -------- */
      for (const [name, stats] of Object.entries(inning.bowlingStats || {})) {
        const key = name.trim().toLowerCase();
        const player = playersMap[key];

        if (!player) {
          throw new Error(`Bowling player not found: ${name}`);
        }

        await Player.updateOne(
          { _id: player._id },
          {
            $inc: {
              "bowling.innings": stats.balls > 0 ? 1 : 0,
              "bowling.balls": stats.balls,
              "bowling.runs": stats.runs,
              "bowling.wickets": stats.wickets,
              "bowling.maidens": stats.maidens,
            },
          },
          { session }
        );
      }
    }

    /* ------------------ 3.5 FIELDING (DERIVED) ------------------ */

    const fieldingMap = {}; // { playerName: { catches, runOuts } }

    for (const inning of match.innings) {
      for (const dismissal of Object.values(inning.dismissals || {})) {
        const { type, fielder } = dismissal;
        if (!fielder) continue;

        const key = fielder.trim().toLowerCase();

        fieldingMap[key] ||= { catches: 0, runOuts: 0 };

        if (type === "CAUGHT" || type === "STUMPED") {
          fieldingMap[key].catches += 1;
        }

        if (type === "RUN_OUT") {
          fieldingMap[key].runOuts += 1;
        }
      }
    }

    /* ------------------ 3.5 FIELDING STATS ------------------ */
    for (const [key, stats] of Object.entries(fieldingMap)) {
      const player = playersMap[key];

      if (!player) {
        throw new Error(`Fielding player not found: ${key}`);
      }

      await Player.updateOne(
        { _id: player._id },
        {
          $inc: {
            "misc.catches": stats.catches,
            "misc.runOuts": stats.runOuts,
          },
        },
        { session }
      );
    }

    /* ------------------ 3.6 MAN OF THE MATCH ------------------ */
    if (match.result?.manOfTheMatch) {
      const momKey = match.result.manOfTheMatch.trim().toLowerCase();
      const momPlayer = playersMap[momKey];

      if (!momPlayer) {
        throw new Error(
          `Man of the Match player not found: ${match.result.manOfTheMatch}`
        );
      }

      await Player.updateOne(
        { _id: momPlayer._id },
        {
          $inc: {
            "misc.mom": 1,
          },
        },
        { session }
      );
    }

    /* ------------------ 4. SAVE MATCH ------------------ */
    const savedMatch = await Match.create(
      [
        {
          ...match,
          status: "COMPLETED",
          completedAt: new Date(),
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return savedMatch[0];
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};
