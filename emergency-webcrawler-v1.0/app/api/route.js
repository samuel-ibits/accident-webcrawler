import { NextResponse } from "next/server";
import { exec } from "child_process";
export default async function GET({ request: Request }) {
  let data = JSON.stringify("apis working over here");
  return NextResponse.json({ data });
}
