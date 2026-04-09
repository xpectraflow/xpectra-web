import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { datasets } from "@/server/db/schema";
import { eq } from "drizzle-orm";

interface StatusUpdate {
  status: "completed" | "failed" | "running" | "queued";
  rowCount?: number;
  startedAt?: string;
  endedAt?: string;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json()) as StatusUpdate;

  try {
    const updateData: any = {
      status: body.status,
      updatedAt: new Date(),
    };
    if (body.rowCount !== undefined) updateData.rowCount = body.rowCount;
    if (body.startedAt) updateData.startedAt = new Date(body.startedAt);
    if (body.endedAt) updateData.endedAt = new Date(body.endedAt);

    const [updated] = await db
      .update(datasets)
      .set(updateData)
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
