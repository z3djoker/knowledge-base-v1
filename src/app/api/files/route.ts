import { NextResponse } from "next/server";
import { listUploadedFiles } from "@/lib/files";

export async function GET() {
  const files = await listUploadedFiles();

  return NextResponse.json({ files });
}
