import mongoose, { Schema } from "mongoose";

const tempoarySchema = new Schema(
  {
    accidentType: { type: String },
    location: { type: String },
    dateOfOccurance: { type: String },
    timeOfOcccurance: { type: String },
    accidentDetails: { type: String },
    category_id: { type: String },
    status: { type: String, default: "New" },
  },
  {
    timestamps: true,
  }
);

// Set default value for status field if it is not provided
tempoarySchema.pre('save', function(next) {
  if (!this.status || this.status.trim() === '') {
    this.status = 'New';
  }
  next();
});

const TempoaryDB =
mongoose.models.TempoaryDB || mongoose.model("TempoaryDB", tempoarySchema);
export default TempoaryDB;
