import { NextResponse } from "next/server";
import {
  listFileMetadata,
  saveFileMetadata,
} from "@/lib/file-metadata";
import { metadataOptions, type FileMetadataInput } from "@/lib/file-metadata-schema";
import { getUploadedFilePath } from "@/lib/files";

export const dynamic = "force-dynamic";

export async function GET() {
  const metadata = await listFileMetadata();

  return NextResponse.json({ metadata, options: metadataOptions });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FileMetadataInput;

    if (!body.fileName || !body.originalName) {
      return NextResponse.json(
        {
          error:
            "\u8bf7\u63d0\u4f9b\u6587\u4ef6\u540d\u548c\u539f\u59cb\u6587\u4ef6\u540d\u3002",
        },
        { status: 400 },
      );
    }

    await getUploadedFilePath(body.fileName);
    const metadata = await saveFileMetadata(body);

    return NextResponse.json({ metadata });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "\u4fdd\u5b58\u5143\u6570\u636e\u5931\u8d25\u3002";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
