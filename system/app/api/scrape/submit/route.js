import { NextResponse } from "next/server";

function formatDate(inputDate) {
    const date = new Date(inputDate);
    
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    // Add leading zero if needed
    const formattedDay = (day < 10) ? `0${day}` : day;
    const formattedMonth = (month < 10) ? `0${month}` : month;
    const formattedHours = (hours < 10) ? `0${hours}` : hours;
    const formattedMinutes = (minutes < 10) ? `0${minutes}` : minutes;
    
    // Determine AM/PM
    const period = (hours < 12) ? 'AM' : 'PM';
  
    // Convert hours to 12-hour format
    const formattedHours12 = (hours > 12) ? hours - 12 : hours;
    
    // Construct the formatted date string
    const formattedDate = `${formattedDay}/${formattedMonth}/${year} ${formattedHours12}:${formattedMinutes} ${period}`;
    
    return formattedDate;
  }
  
  const inputDate = "2024-03-13T10:46";
  const formattedDate = formatDate(inputDate);
  console.log(formattedDate); // Output: 13/03/2024 10:46 AM

  

// Handles POST requests to /api
export async function POST(request) {
    const {accidentType,
      location,
      dateOfOccurance,
      timeOfOcccurance,
      accidentDetails,
      status,
      category_id
   } =
      await request.json();
console.log("category_id",category_id)


const body={
    "category_id":category_id,
      "title": accidentType,
      "description": accidentDetails,
      "address":location,
      "start_date_time": formatDate(dateOfOccurance),
      "status": 0,
      "approve_status":0,
      "latitude":0,
      "longitude": 0,
      "state": location,
      "country":location
  
}
   try {
    
// send to secure view db
const endpoint= 'https://dev.mysecureview.com/api/live/store_incident'
const ress =await fetch(endpoint, {
  method: 'POST',
  headers: {
    "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SECURE_VIEW_BEARER_TOKEN}`,
    "Content-Type": "application/json"
  },
body: JSON.stringify(body),
});
const responseData = await ress.json();
console.log("validate",responseData)

    
    return NextResponse.json({responseData});
   } catch (error) {
    console.log(error)
    return NextResponse.json({ error},);
   }

   
  }