export const processBallAnalytics = async (match, state, accumulators) => {
  const inningsToProcess = match.innings.filter(
    (inn) =>
      !inn.isSuperOver &&
      Array.isArray(inn.ballByBall) &&
      inn.ballByBall.length > 0,
  );
};
