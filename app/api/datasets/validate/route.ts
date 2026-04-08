import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const runId = searchParams.get("runId");
  const telemetryIngestKey = searchParams.get("telemetryIngestKey");

  if (!runId || !telemetryIngestKey) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    const dataset = await db.query.datasets.findFirst({
      where: (ds, { eq }) => eq(ds.id, runId),
      with: {
        experiment: true,
      },
    });

    if (!dataset || !dataset.telemetryIngestKey) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
    }

    const isValid = await bcrypt.compare(telemetryIngestKey, dataset.telemetryIngestKey);
    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      experimentId: dataset.experimentId,
      hypertableName: dataset.experiment.hypertableName,
      channelIndices: dataset.experiment.sensorConfig?.sensors?.flatMap(s => s.channelIndices || []) || [],
    });
  } catch (error: any) {
    console.error("Dataset validation error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
