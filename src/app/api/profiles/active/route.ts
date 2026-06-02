import { NextResponse } from "next/server";
import { getActiveViewerProfile } from "@/services/profile/viewer-profile-service";

export async function GET() {
  const profile = await getActiveViewerProfile();
  return NextResponse.json({ profile });
}
