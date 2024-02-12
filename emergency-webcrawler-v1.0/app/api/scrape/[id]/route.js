import { NextResponse } from "next/server";
import connectMongoDB from "../../../../libs/mongodb.js";
import TempoaryDB from "../../../../models/tempoary.js";
import QueryDB from "../../../../models/query.js";

  //send to main db
const sendToMainDb = async (id) => {
  try {
  const get = await fetch(`http://localhost:3000/api/scrape/${id}`, {
    method: "GET",
    cache: "no-store",
    headers: {
      "Content-type": "application/json",
    },
  });
  if (!get.ok) {
    throw new Error("failed to by id");
  }

const getData= await get.data;

 const post = await fetch(`http://localhost:3000/api/scrape/${id}`, {
   method: "POST",
   cache: "no-store",
   headers: {
     "Content-type": "application/json",
   },
   body: JSON.stringify( getData ),
 });
 if (!post.ok) {
   throw new Error("failed to update main db");
 }

   

    return res.json();
  } catch (error) {
    
    console.log("error loading main db", error);
     throw new Error("failed to send to main db");
  }
};






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

// await sendToMainDb(id)


  return NextResponse.json({ message: "updated" }, { status: 200 });
}

//handles get each request by id
export async function GET(request, { params }) {
  const { id } = params;
  // const { newEmergencyType:emergencyType, newFromDate: fromDate, newToDate:toDate, newSpecialParameters:specialParameters, newSearchBase: searchBase }= await request.json()
  await connectMongoDB();
  const data = await TempoaryDB.findOne({ _id: id });
  return NextResponse.json(
    { message: "gotten by id" },
    { data: data },
    { status: 200 }
  );
}
