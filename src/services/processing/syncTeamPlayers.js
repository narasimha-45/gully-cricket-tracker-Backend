import TeamProfile from "../../models/TeamProfile.js";

export const syncTeamPlayers = async ({
  rawMatch,
  teamMap,
  playerMap,
}) => {
  const updates = [];

  for (const sideKey of [
    "teamA",
    "teamB",
  ]) {
    const side = rawMatch.teams[sideKey];

    const team =
      teamMap.get(side.name.toLowerCase());

    if (!team) continue;

    const playerIds = side.players
      .map(
        (playerName) =>
          playerMap.get(
            playerName.toLowerCase(),
          )?._id,
      )
      .filter(Boolean);

    updates.push(
      TeamProfile.updateOne(
        {
          _id: team._id,
        },
        {
          $addToSet: {
            players: {
              $each: playerIds,
            },
          },
        },
      ),
    );
  }

  await Promise.all(updates);
};