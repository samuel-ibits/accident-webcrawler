import mongoose, { Schema } from "mongoose";

const tempoarySchema = new Schema(
  {
    accidentType: { type: String },
    location: { type: String },
    dateOfOccurance: { type: String },
    timeOfOcccurance: { type: String },
    accidentDetails: { type: String },
    status: { type: String },
  },
  {
    timestamps: true,
  }
);
const TempoaryDB =
  mongoose.models.TempoaryDB || mongoose.model("TempoaryDB", tempoarySchema);
export default TempoaryDB;
