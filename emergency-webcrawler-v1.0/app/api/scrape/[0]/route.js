

import { NextResponse } from "next/server";
import connectMongoDB from "../../../../libs/mongodb.js";
import TempoaryDB from "../../../../models/tempoary.js";
import QueryDB from "../../../../models/query.js";


//handles update each request
  export async function PUT(request, {params}) {

const {id}= params
const { newEmergencyType:emergencyType, newFromDate: fromDate, newToDate:toDate, newSpecialParameters:specialParameters, newSearchBase: searchBase }= await request.json()
    await connectMongoDB();
    const data = await TempoaryDB.findByIdAndUpdate(id, {
      emergencyType,
      fromDate,
      toDate,
      specialParameters,
      searchBase,
    });
    return NextResponse.json({ message: "updated" }, { status: 200 });

  }
  
//handles update each request
  export async function GET(request, {params}) {

const {id}= params; 
// const { newEmergencyType:emergencyType, newFromDate: fromDate, newToDate:toDate, newSpecialParameters:specialParameters, newSearchBase: searchBase }= await request.json()
    await connectMongoDB();
    const data = await TempoaryDB.findOne({_id:id});
    return NextResponse.json({ message: "updated" },{data:data}, { status: 200 });

  }