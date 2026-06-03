import { NextResponse } from "next/server";
import { saveUploadedFile } from "@/lib/files";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const savedFile = await saveUploadedFile(file);

    return NextResponse.json({ file: savedFile }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to upload file.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
