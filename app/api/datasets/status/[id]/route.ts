import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { datasets } from "@/server/db/schema";
import { eq } from "drizzle-orm";

interface StatusUpdate {
  status: "completed" | "failed";
  rowCount: number;
  startedAt: string;
  endedAt: string;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json()) as StatusUpdate;

  try {
    const [updated] = await db
      .update(datasets)
      .set({
        status: body.status,
        rowCount: body.rowCount,
        startedAt: new Date(body.startedAt),
        endedAt: new Date(body.endedAt),
        updatedAt: new Date(),
      })
      .where(eq(datasets.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, id: updated.id });
  } catch (err: any) {
    console.error("Status Update Error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
