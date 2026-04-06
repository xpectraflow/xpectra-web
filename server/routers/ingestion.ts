import path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { datasets } from "@/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

// Dynamically load protobuf
const PROTO_PATH = path.join(
  process.cwd(),
  "proto/xpectra/telemetry/v1/telemetry.proto",
);

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
const telemetryPackage = protoDescriptor.sift.telemetry.v1;

// Instantiate client singleton
const grpcClient = new telemetryPackage.TelemetryService(
  process.env.GRPC_LISTEN_ADDR as string,
  grpc.credentials.createInsecure(),
);

export const ingestionRouter = createTRPCRouter({
  ingestCsvData: protectedProcedure
    .input(
      z.object({
        runId: z.string().uuid(),
        telemetryIngestKey: z.string(),
        points: z.array(
          z.object({
            timestamp: z.string(),
            channelId: z.string(),
            value: z.union([z.number(), z.boolean(), z.string()]),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Validate dataset and key
      const dataset = await ctx.db.query.datasets.findFirst({
        where: (ds, { eq }) => eq(ds.id, input.runId),
      });

      if (!dataset || !dataset.telemetryIngestKey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Dataset not found",
        });
      }

      const isValidKey = await bcrypt.compare(
        input.telemetryIngestKey,
        dataset.telemetryIngestKey,
      );
      if (!isValidKey) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid telemetry ingest key",
        });
      }

      // Convert points to proto format
      const protoPoints = input.points.map((p) => {
        const point: any = {
          timestamp: {
            seconds: Math.floor(new Date(p.timestamp).getTime() / 1000),
            nanos: (new Date(p.timestamp).getTime() % 1000) * 1e6,
          },
          channel_id: p.channelId,
          dataset_id: input.runId,
        };

        if (typeof p.value === "number") {
          point.double_value = p.value;
        } else if (typeof p.value === "boolean") {
          point.bool_value = p.value;
        } else if (typeof p.value === "string") {
          point.string_value = p.value;
        }

        return point;
      });

      // Call gRPC microservice
      return new Promise((resolve, reject) => {
        grpcClient.IngestBatch(
          {
            points: protoPoints,
            telemetry_ingest_key: input.telemetryIngestKey,
          },
          (err: any, response: any) => {
            if (err) {
              return reject(
                new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: err.message,
                }),
              );
            }
            resolve(response);
          },
        );
      });
    }),
});
