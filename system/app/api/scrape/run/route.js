// "use server";

import { NextResponse } from "next/server";
import connectMongoDB from "../../../../libs/mongodb.js";
import TempoaryDB from "../../../../models/tempoary.js";
import QueryDB from "../../../../models/query.js";
import Gateways from "../../../gateway/gateway.js";

const Gateway = new Gateways();

// Handles POST requests to /api
export async function POST(request) {
  //get destructure data

  const { emergencyType, fromDate, toDate, specialParameters, searchBase } =
    await request.json();
  //Gateway stuff, send data to proper execution route
  if (typeof Gateway[searchBase] === "function") {
    await Gateway[searchBase]({
      emergencyType,
      fromDate,
      toDate,
      specialParameters,
      searchBase,
    });
  } else {
    console.log("method not found", searchBase);
  }
  //db stuffs
  await connectMongoDB();
  await QueryDB.create({
    searchBase,
    emergencyType,
    fromDate,
    toDate,
    specialParameters,
  });

  return NextResponse.json({ message: "Sent Request to Background Crawler" }, { status: 201 });
}

// Handles GET requests to /api
export async function GET(request) {
  await connectMongoDB();
  const data = await QueryDB.find();
  const queries = await QueryDB.countDocuments();
  return NextResponse.json({ message: "fetched",queries: queries, data: data });
}

//handles delete each request
export async function DELETE(request) {
  const id = request.nextUrl.searchParams.get("id");
  await connectMongoDB();
  const data = await QueryDB.findByIdAndDelete(id);
  return NextResponse.json({ message: "deleted" }, { status: 200 });
}
