// "use server";


import { NextResponse } from "next/server";
import connectMongoDB from "../../../../libs/mongodb.js";
import TempoaryDB from "../../../../models/tempoary.js";


// Handles GET requests to /api
export async function GET(request) {
  await connectMongoDB();
   const data= await TempoaryDB.find()
  const queries = await TempoaryDB.countDocuments();
  return NextResponse.json({
    message: "fetched",
    queries: queries,
    data: data,
  });
}

// Handles POST requests to /api
export async function POST(request) {
  const {accidentType,
    location,
    dateOfOccurance,
    timeOfOcccurance,
    accidentDetails,
    status
 } =
    await request.json();
  await connectMongoDB();
  await TempoaryDB.create({
    accidentType,
    location,
    dateOfOccurance,
    timeOfOcccurance,
    accidentDetails,
    status,
  });
  return NextResponse.json({ message: "created" }, { status: 201 });
}

  //handles delete each request
  export async function DELETE(request) {
const id= request.nextUrl.searchParams.get("id")
    await connectMongoDB();
    const data = await TempoaryDB.findByIdAndDelete(id);
    return NextResponse.json({ message: "deleted" }, { status: 200 });
  }
