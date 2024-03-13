import { NextResponse } from "next/server";
import connectMongoDB from "../../../../libs/mongodb.js";
import TempoaryDB from "../../../../models/tempoary.js";


// Handles GET requests to /api
export async function GET(request) {
  await connectMongoDB();


   const data= await TempoaryDB.find({status:'New'})
   const accepted = await TempoaryDB.countDocuments({ status: "Accepted" });
   const rejected = await TempoaryDB.countDocuments({ status: "Rejected" });
   const news = await TempoaryDB.countDocuments({ status: "New" });
  return NextResponse.json({ message: "fetched", 
  accepted:accepted, rejected: rejected, new:news,
   data:data});
}
