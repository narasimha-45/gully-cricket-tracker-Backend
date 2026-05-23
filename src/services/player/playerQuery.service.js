export const getSeasonPlayers = async (seasonId) => {
  const profiles = await SeasonPlayerSplits.find({ seasonId }).lean();
  const playerIds = profiles.map((p) => p.playerId);
  return PlayerProfile.find({ _id: { $in: playerIds } })
    .select("name")
    .lean()
    .then((players) => {
      const playerMap = new Map(players.map((p) => [String(p._id), p.name]));
      return profiles.map((profile) => ({
        ...profile,
        playerName: playerMap.get(String(profile.playerId)),
      }));
    });
};

export const getOverallPlayers = async () => {
  const profiles = await OverallPlayerSplits.find({}).lean();
  const playerIds = profiles.map((p) => p.playerId);
  return PlayerProfile.find({ _id: { $in: playerIds } })
    .select("name")
    .lean()
    .then((players) => {
      const playerMap = new Map(players.map((p) => [String(p._id), p.name]));
      return profiles.map((profile) => ({
        ...profile,
        playerName: playerMap.get(String(profile.playerId)),
      }));
    });
};
