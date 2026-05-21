import mongoose from "mongoose";

const OverallPartnershipAggregateSchema = new mongoose.Schema(
  {
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

    innings: Number,
    runs: Number,
    balls: Number,

    highest: Number,

    fiftyPlus: Number,
    hundredPlus: Number,

    byWicket: {
      type: Map,
      of: {
        innings: Number,
        runs: Number,
      },
      default: {},
    },

    lastMatchAt: Date,
  },
  {
    timestamps: true,
  },
);

OverallPartnershipAggregateSchema.index(
  {
    player1Id: 1,
    player2Id: 1,
  },
  {
    unique: true,
  },
);

const OverallPartnershipAggregate =
  mongoose.models.OverallPartnershipAggregate ||
  mongoose.model(
    "OverallPartnershipAggregate",
    OverallPartnershipAggregateSchema,
  );

export default OverallPartnershipAggregate;
