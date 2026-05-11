import { z } from "zod";

/* ======================================================
   ENUMS
====================================================== */

const dismissalTypes = [
  "BOWLED",
  "CAUGHT",
  "LBW",
  "RUN_OUT",
  "STUMPED",
  "HIT_WICKET",
  "NOT_OUT",
];

/* ======================================================
   DISMISSAL
====================================================== */

const dismissalSchema = z.object({
  type: z.enum(dismissalTypes),

  bowler: z.string().nullable(),

  fielder: z.string().nullable(),
});

/* ======================================================
   BATTING
====================================================== */

const battingSchema = z.object({
  runs: z.number().min(0),

  balls: z.number().min(0),

  fours: z.number().min(0),

  sixes: z.number().min(0),

  dismissal:
    dismissalSchema.nullable(),
});

/* ======================================================
   BOWLING
====================================================== */

const bowlingSchema = z.object({
  balls: z.number().min(0),

  maidens: z.number().min(0),

  runs: z.number().min(0),

  wickets: z.number().min(0),
});

/* ======================================================
   INNINGS
====================================================== */

const inningsSchema = z.object({
  battingTeam: z.string(),

  bowlingTeam: z.string(),

  totalRuns: z.number().min(0),

  wickets: z.number().min(0),

  balls: z.number().min(0),

  battingStats: z.record(
    battingSchema
  ),

  bowlingStats: z.record(
    bowlingSchema
  ),

  dismissals: z.record(
    dismissalSchema
  ),
});

/* ======================================================
   MATCH
====================================================== */

export const matchSchema =
  z.object({
    seasonId: z.string(),

    venue: z.string(),

    toss: z.object({
      wonBy: z.string(),

      decision: z.enum([
        "BAT",
        "BOWL",
      ]),
    }),

    result: z.object({
      winner: z.string(),

      margin: z.number(),

      type: z.string(),

      manOfTheMatch:
        z.string(),
    }),

    innings: z.array(
      inningsSchema
    ),
  });