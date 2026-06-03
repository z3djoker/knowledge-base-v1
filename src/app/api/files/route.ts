import { NextResponse } from "next/server";
import { deleteUploadedFile, listUploadedFiles } from "@/lib/files";
import { deleteParsedFile } from "@/lib/parsed-files";

export const dynamic = "force-dynamic";

export async function GET() {
  const files = await listUploadedFiles();

  return NextResponse.json({ files });
}

type DeleteFileRequestBody = {
  fileName?: string;
};

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as DeleteFileRequestBody;

    if (!body.fileName) {
      return NextResponse.json(
        {
          error:
            "\u8bf7\u63d0\u4f9b\u8981\u5220\u9664\u7684\u6587\u4ef6\u540d\u3002",
        },
        { status: 400 },
      );
    }

    await deleteUploadedFile(body.fileName);
    const parsedResult = await deleteParsedFile(body.fileName);

    return NextResponse.json({
      deletedFileName: body.fileName,
      deletedParsedResult: parsedResult.deleted,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "\u5220\u9664\u6587\u4ef6\u5931\u8d25\u3002";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
