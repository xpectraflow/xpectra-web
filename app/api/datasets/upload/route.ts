import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { db } from "@/server/db";
import { datasets, experiments } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes, randomUUID } from "crypto";
import bcrypt from "bcryptjs";


export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const experimentId = formData.get("experimentId") as string;
  const name = formData.get("name") as string;
  const mapping = formData.get("mapping") as string;

  if (!file || !experimentId || !name || !mapping) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // 1. Get Experiment Metadata
  const experiment = await db.query.experiments.findFirst({
    where: (exp, { eq }) => eq(exp.id, experimentId),
  });

  if (!experiment) {
    return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
  }

  // 2. Create Dataset Record
  const datasetId = randomUUID();
  const unhashedKey = randomBytes(32).toString("hex");
  const hashedKey = await bcrypt.hash(unhashedKey, 10);

  await db.insert(datasets).values({
    id: datasetId,
    experimentId,
    name,
    status: "running",
    telemetryIngestKey: hashedKey,
  });

  // 3. Proxy Stream to Go
  const ingestUrl = process.env.INGEST_SERVICE_HTTP_URL || "http://telemetry-ingest:50052/ingest";
  
  const goReq = new Request(ingestUrl, {
    method: "POST",
    headers: {
      "X-Dataset-ID": datasetId,
      "X-Experiment-ID": experimentId,
      "X-Ingest-Key": unhashedKey,
      "X-Column-Mapping": mapping,
      "Content-Type": "text/csv",
    },
    body: (file.stream() as unknown) as ReadableStream,
    // @ts-ignore
    duplex: "half", 
  });

  try {
    const response = await fetch(goReq);
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Go Ingest Failed: ${errorText}` }, { status: 502 });
    }

    const result = await response.json();
    return NextResponse.json({
      success: true,
      datasetId,
      ...result
    });
  } catch (err: any) {
    console.error("Ingest Proxy Error", err);
    return NextResponse.json({ error: "Failed to connect to ingestion service" }, { status: 503 });
  }
}
