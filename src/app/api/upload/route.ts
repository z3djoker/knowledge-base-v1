import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";
import { saveUploadedFile } from "@/lib/files";

export async function POST(request: Request) {
  try {
    const auth = await requireAdminApi();

    if (auth.response) {
      return auth.response;
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const savedFile = await saveUploadedFile(file);

    return NextResponse.json({ file: savedFile }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "上传文件失败。";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
