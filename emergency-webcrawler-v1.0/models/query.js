import mongoose, { Schema } from "mongoose";

const querySchema = new Schema(
  {
    searchBase: String,
    emergencyType: String,
    fromDate: String,
    toDate: String,
    specialParameters: String,
  },
  {
    timestamps: true,
  }
);
const QueryDB =
  mongoose.models.QueryDB || mongoose.model("QueryDB", querySchema);
export default QueryDB;
