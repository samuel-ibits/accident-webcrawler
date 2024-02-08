import { NextResponse } from "next/server";
import connectMongoDB from "../../../../libs/mongodb.js";
import TempoaryDB from "../../../../models/tempoary.js";
import QueryDB from "../../../../models/query.js";

//handles update each request
export async function PUT(request, { params }) {
  const { id } = params;
  const {
    newAccidentType: accidentType,
    newLocation: location,
    newDateOfOccurance: dateOfOccurance,
    newTimeOfOcccurance: timeOfOcccurance,
    newAccidentDetails: accidentDetails,
    newStatus: status,
  } = await request.json();
  await connectMongoDB();
  const data = await TempoaryDB.findByIdAndUpdate(id, {
    accidentType,
    location,
    dateOfOccurance,
    timeOfOcccurance,
    accidentDetails,
    status,
  });
  return NextResponse.json({ message: "updated" }, { status: 200 });
}

//handles update each request
export async function GET(request, { params }) {
  const { id } = params;
  // const { newEmergencyType:emergencyType, newFromDate: fromDate, newToDate:toDate, newSpecialParameters:specialParameters, newSearchBase: searchBase }= await request.json()
  await connectMongoDB();
  const data = await TempoaryDB.findOne({ _id: id });
  return NextResponse.json(
    { message: "updated" },
    { data: data },
    { status: 200 }
  );
}
