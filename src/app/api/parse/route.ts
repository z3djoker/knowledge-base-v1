import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";
import { getUploadedFilePath } from "@/lib/files";
import { saveParsedFile } from "@/lib/parsed-files";
import { parseUploadedDocument } from "@/lib/parsers";

type ParseRequestBody = {
  fileName?: string;
};

export async function POST(request: Request) {
  try {
    const auth = await requireAdminApi();

    if (auth.response) {
      return auth.response;
    }

    const body = (await request.json()) as ParseRequestBody;

    if (!body.fileName) {
      return NextResponse.json(
        { error: "No file name provided." },
        { status: 400 },
      );
    }

    const filePath = await getUploadedFilePath(body.fileName);
    const parsedDocument = await parseUploadedDocument(filePath);
    const parsedFile = await saveParsedFile({
      fileName: body.fileName,
      fileType: parsedDocument.fileType,
      parsedAt: new Date().toISOString(),
      text: parsedDocument.text,
      metadata: parsedDocument.metadata,
    });

    return NextResponse.json({ parsedFile }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to parse file.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
