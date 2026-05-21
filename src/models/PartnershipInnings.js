import mongoose from "mongoose";

const PartnershipInningsSchema =
  new mongoose.Schema(
    {
      seasonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Season",
        required: true,
      },

      matchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Match",
        required: true,
      },

      inningsNumber: {
        type: Number,
        required: true,
      },

      wicket: {
        type: Number,
        required: true,
      },

      battingTeamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeamProfile",
        required: true,
      },

      opponentTeamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeamProfile",
        required: true,
      },

      player1Id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PlayerProfile",
        required: true,
      },

      player2Id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PlayerProfile",
        required: true,
      },

      runs: {
        type: Number,
        default: 0,
      },

      balls: {
        type: Number,
        default: 0,
      },

      fours: {
        type: Number,
        default: 0,
      },

      sixes: {
        type: Number,
        default: 0,
      },

      startScore: {
        type: Number,
        default: 0,
      },

      endScore: {
        type: Number,
        default: 0,
      },

      won: {
        type: Boolean,
        default: false,
      },

      successfulChase: {
        type: Boolean,
        default: false,
      },

      defended: {
        type: Boolean,
        default: false,
      },

      date: Date,
    },
    {
      timestamps: true,
    }
  );

/* =====================================================
   INDEXES
===================================================== */

PartnershipInningsSchema.index({
  player1Id: 1,
  player2Id: 1,
});

PartnershipInningsSchema.index({
  seasonId: 1,
});

PartnershipInningsSchema.index({
  matchId: 1,
});

PartnershipInningsSchema.index({
  runs: -1,
});

const PartnershipInnings =
  mongoose.models.PartnershipInnings ||
  mongoose.model(
    "PartnershipInnings",
    PartnershipInningsSchema
  );

export default PartnershipInnings;