import mongoose from "mongoose";

const SeasonPartnershipAggregateSchema = new mongoose.Schema(
  {
    seasonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Season",
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

SeasonPartnershipAggregateSchema.index(
  {
    seasonId: 1,
    player1Id: 1,
    player2Id: 1,
  },
  {
    unique: true,
  },
);

const SeasonPartnershipAggregate =
  mongoose.models.SeasonPartnershipAggregate ||
  mongoose.model(
    "SeasonPartnershipAggregate",
    SeasonPartnershipAggregateSchema,
  );

export default SeasonPartnershipAggregate;
