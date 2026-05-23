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

const deliveryTypes = [
  "RUN",
  "WIDE",
  "NO_BALL",
  "BYE",
  "LEG_BYE",
  "WICKET",
];

const wicketTypes = [
  "BOWLED",
  "CAUGHT",
  "LBW",
  "RUN_OUT",
  "STUMPED",
  "HIT_WICKET",
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
   BALL WICKET
====================================================== */

const wicketSchema = z.object({
  type: z.enum(wicketTypes),

  outBatsman: z.string(),

  helper: z.string().nullable(),
});

/* ======================================================
   BALL
====================================================== */

const ballSchema = z.object({
  over: z.number().min(0),

  ballInOver: z.number().min(0),

  actualBallNum: z.number().min(0),

  striker: z.string(),

  nonStriker: z.string(),

  bowler: z.string(),

  runs: z.number().min(0),

  type: z.enum(deliveryTypes),

  isWicket: z.boolean(),

  wicket:
    wicketSchema.nullable(),

  timestamp: z.number(),
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
    z.string(),
    battingSchema,
  ),

  bowlingStats: z.record(
    z.string(),
    bowlingSchema,
  ),

  dismissals: z.record(
    z.string(),
    dismissalSchema,
  ),

  extras: z.object({
    wides: z.number().min(0),

    noBalls: z.number().min(0),
  }),

  ballByBall: z
    .array(ballSchema)
    .default([]),

  completed:
    z.boolean().default(true),
});

/* ======================================================
   TEAM
====================================================== */

const teamSchema = z.object({
  name: z.string(),

  players: z
    .array(z.string())
    .min(1),
});

/* ======================================================
   MATCH
====================================================== */

export const matchSchema =
  z.object({
    seasonId: z.string(),

    venue: z.string(),

    matchType: z
      .enum([
        "OVERS",
        "TEST",
        "CUSTOM",
      ])
      .default("OVERS"),

    totalOvers: z
      .number()
      .min(1),

    teams: z.object({
      teamA: teamSchema,

      teamB: teamSchema,
    }),

    toss: z.object({
      winner: z.string(),

      decision: z.string(),
    }),

    result: z.object({
      winner: z.string(),

      type: z.enum([
        "RUNS",
        "WICKETS",
        "TIE",
        "NO_RESULT",
      ]),

      margin: z.number(),

      manOfTheMatch:
        z.string(),
    }),

    innings: z
      .array(inningsSchema)
      .min(1),

    completedAt: z
      .string()
      .datetime()
      .optional(),
  })
  .superRefine(
    (match, ctx) => {
      /* =========================================
         TEAM VALIDATION
      ========================================= */

      if (
        match.teams.teamA.name ===
        match.teams.teamB.name
      ) {
        ctx.addIssue({
          code:
            z.ZodIssueCode.custom,

          path: [
            "teams",
          ],

          message:
            "Both teams cannot be same",
        });
      }

      /* =========================================
         INNINGS TEAM VALIDATION
      ========================================= */

      for (const [
        index,
        innings,
      ] of match.innings.entries()) {
        if (
          innings.battingTeam ===
          innings.bowlingTeam
        ) {
          ctx.addIssue({
            code:
              z.ZodIssueCode.custom,

            path: [
              "innings",
              index,
            ],

            message:
              "Batting and bowling teams cannot be same",
          });
        }
      }
    });