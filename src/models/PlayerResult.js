import { Schema, model, Types } from "mongoose";

const PlayerResultSchema = new Schema(
  {
   
    metrics: {
      lineCoverage: { type: Number, required: true },
      branchCoverage: { type: Number, required: true },
      mutationScore: { type: Number, required: true },
      executionTimeMs: { type: Number, required: true },
    },

    score: {
      type: Number,
      required: true,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const PlayerResult = model("PlayerResult", PlayerResultSchema);
