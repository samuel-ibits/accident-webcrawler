// "use server";


import { NextResponse } from "next/server";
import connectMongoDB from "../../../../libs/mongodb.js";
import TempoaryDB from "../../../../models/tempoary.js";
import QueryDB from "../../../../models/query.js";


// Handles GET requests to /api
export async function GET(request) {
  await connectMongoDB();
   const data= await QueryDB.find()
  return NextResponse.json({ message: "fetched"},{data:data });
}

// Handles POST requests to /api
export async function POST(request) {
  const { emergencyType, fromDate, toDate, specialParameters, searchBase } =
    await request.json();
  await connectMongoDB();
  await QueryDB.create({
    searchBase,
    emergencyType,
    fromDate,
    toDate,
    specialParameters,
  });
  return NextResponse.json({ message: "created" }, { status: 201 });
}

  //handles delete each request
  export async function DELETE(request) {
const id= request.nextUrl.searchParams.get("id")
    await connectMongoDB();
    const data = await QueryDB.findByIdAndDelete(id);
    return NextResponse.json({ message: "deleted" }, { status: 200 });
  }
