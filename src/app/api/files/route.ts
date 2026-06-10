import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";
import { deleteKnowledgeAsset } from "@/lib/delete-asset";
import { listAdminFiles } from "@/lib/admin-files";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdminApi();

  if (auth.response) {
    return auth.response;
  }

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page"));
  const pageSize = Number(url.searchParams.get("pageSize"));
  const result = await listAdminFiles({ page, pageSize });

  return NextResponse.json(result);
}

type DeleteFileRequestBody = {
  fileName?: string;
};

export async function DELETE(request: Request) {
  try {
    const auth = await requireAdminApi();

    if (auth.response) {
      return auth.response;
    }

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

    const result = await deleteKnowledgeAsset(body.fileName);

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "\u5220\u9664\u6587\u4ef6\u5931\u8d25\u3002";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
