import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { db, pool } from "@/server/db";
import { datasets } from "@/server/db/schema";
import { eq } from "drizzle-orm";

/** 
 * GET /api/telemetry/query
 * 
 * Query params:
 *   datasetId    - required
 *   channelCol   - required  (e.g. "ch_1", "ch_5")
 *   limit        - optional, default 2000, max 10000
 *   from         - optional ISO timestamp
 *   to           - optional ISO timestamp
 * 
 * Returns: { data: [{t: number, v: number}[]] }
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const datasetId = searchParams.get("datasetId");
  const channelCol = searchParams.get("channelCol");
  const limitRaw = parseInt(searchParams.get("limit") ?? "2000", 10);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!datasetId || !channelCol) {
    return NextResponse.json({ error: "Missing datasetId or channelCol" }, { status: 400 });
  }

  // Validate channelCol format (must be ch_N)
  if (!/^ch_\d+$/.test(channelCol)) {
    return NextResponse.json({ error: "Invalid channelCol format" }, { status: 400 });
  }

  const limit = Math.min(Math.max(limitRaw, 1), 10000);

  // Look up dataset to get hypertable name
  const dataset = await db.query.datasets.findFirst({
    where: eq(datasets.id, datasetId),
    with: { experiment: true },
  });

  if (!dataset) {
    return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
  }

  const hypertableName = dataset.experiment.hypertableName;

  const colCheck = await pool.query(`
    SELECT column_name, data_type FROM information_schema.columns 
    WHERE table_name = $1
  `, [hypertableName]);
  
  const colTypes = new Map(colCheck.rows.map(r => [r.column_name, r.data_type]));
  const isBigInt = colTypes.get('time') === 'bigint';
  const isBoolean = colTypes.get(channelCol) === 'boolean';

  // For BOOLEAN types, we must cast to integer to allow numeric operations if needed,
  // though for raw fetch we mostly just want the value. 
  // However, consistent return types (0/1) help the charts.
  const colExpr = isBoolean ? `"${channelCol}"::INT` : `"${channelCol}"`;

  // Build the query dynamically
  const conditions: string[] = [`"dataset_id" = $1`];
  const params: unknown[] = [datasetId];
  let paramIdx = 2;

  if (from) {
    if (isBigInt) {
      conditions.push(`"time" >= $${paramIdx++}::bigint`);
      params.push(BigInt(new Date(from).getTime() * 1000000).toString());
    } else {
      conditions.push(`"time" >= $${paramIdx++}`);
      params.push(new Date(from));
    }
  }
  if (to) {
    if (isBigInt) {
      conditions.push(`"time" <= $${paramIdx++}::bigint`);
      params.push(BigInt(new Date(to).getTime() * 1000000).toString());
    } else {
      conditions.push(`"time" <= $${paramIdx++}`);
      params.push(new Date(to));
    }
  }

  const whereClause = conditions.join(" AND ");
  const sql = `
    SELECT "time", ${colExpr} AS v
    FROM "${hypertableName}"
    WHERE ${whereClause} AND "${channelCol}" IS NOT NULL
    ORDER BY "time" ASC
    LIMIT $${paramIdx}
  `;
  params.push(limit);

  try {
    const result = await pool.query(sql, params as any[]);
    const data = result.rows.map((row: any) => ({
      t: isBigInt ? parseInt(row.time, 10) / 1_000_000 : new Date(row.time).getTime(),
      v: parseFloat(row.v),
    }));

    return NextResponse.json({
      datasetId,
      channelCol,
      count: data.length,
      data,
    });
  } catch (err: any) {
    console.error("Telemetry query error:", err.message);
    return NextResponse.json({ error: "Query failed", detail: err.message }, { status: 500 });
  }
}
