import mongoose, { Schema } from "mongoose";

const tempoarySchema = new Schema(
  {
    accidentType: { type: String },
    location: { type: String },
    dateOfOccurance: { type: String },
    timeOfOcccurance: { type: String },
    accidentDetails: { type: String },
  },
  {
    timestamps: true,
  }
);
const TempoaryDB =
  mongoose.models.QueryDB || mongoose.model("TempoaryDB", tempoarySchema);
export default TempoaryDB;
