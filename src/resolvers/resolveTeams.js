import TeamProfile from "../models/TeamProfile.js"

/* ======================================================
   NORMALIZE
====================================================== */

const normalize = (value = "") =>
  value.trim().toLowerCase();

/* ======================================================
   RESOLVE TEAMS
====================================================== */

export const resolveTeams = async (rawMatch) => {
  const teams = [
    rawMatch?.teams?.teamA,
    rawMatch?.teams?.teamB,
  ];

  const uniqueTeamNames = [
    ...new Set(
      teams.map((team) => normalize(team.name))
    ),
  ];

  /* =========================================
     FETCH EXISTING TEAMS
  ========================================= */

  const existingTeams = await TeamProfile.find({
    name: {
      $in: uniqueTeamNames,
    },
  });

  const teamMap = new Map();

  for (const team of existingTeams) {
    teamMap.set(team.name, team);
  }

  /* =========================================
     CREATE MISSING TEAMS
  ========================================= */

  const missingTeamNames = uniqueTeamNames.filter(
    (teamName) => !teamMap.has(teamName)
  );

  if (missingTeamNames.length > 0) {
    const createdTeams = await TeamProfile.insertMany(
      missingTeamNames.map((teamName) => ({
        name: teamName,
        displayName: teamName,
      }))
    );

    for (const team of createdTeams) {
      teamMap.set(team.name, team);
    }
  }

  /* =========================================
     RETURN TEAM MAP
  ========================================= */

  return teamMap;
};