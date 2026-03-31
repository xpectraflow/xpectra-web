import path from "path";
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";

const PROTO_PATH =
  process.env.XPECTRA_CONSUMER_PROTO_PATH ??
  path.resolve(
    process.cwd(),
    "..",
    "xpectra-consumer",
    "proto",
    "xpectra",
    "telemetry",
    "v1",
    "telemetry.proto",
  );

const GRPC_ENDPOINT =
  process.env.XPECTRA_CONSUMER_GRPC_ADDR ??
  process.env.GRPC_CONSUMER_ADDR ??
  "127.0.0.1:50051";

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

type QueryPoint = {
  channelId: string;
  timestamp: string;
  value: number;
};

type QueryTelemetryInput = {
  experimentId: string;
  runId: string;
  channelIds: string[];
  from: string;
  to: string;
  maxPointsPerChannel: number;
};

type ProtoTimestamp = {
  seconds?: string | number;
  nanos?: number;
};

const grpcObject = grpc.loadPackageDefinition(packageDefinition) as unknown as {
  xpectra: {
    telemetry: {
      v1: {
        TelemetryService: new (
          address: string,
          credentials: grpc.ChannelCredentials,
        ) => {
          Query: (
            request: Record<string, unknown>,
            callback: (
              error: grpc.ServiceError | null,
              response: {
                points?: Array<{
                  channel_id: string;
                  timestamp: ProtoTimestamp;
                  value: number;
                }>;
              },
            ) => void,
          ) => void;
        };
      };
    };
  };
};

const telemetryClient = new grpcObject.xpectra.telemetry.v1.TelemetryService(
  GRPC_ENDPOINT,
  grpc.credentials.createInsecure(),
);

function toProtoTimestamp(isoDate: string): { seconds: number; nanos: number } {
  const date = new Date(isoDate);
  const millis = date.getTime();
  const seconds = Math.floor(millis / 1000);
  const nanos = Math.max(0, (millis - seconds * 1000) * 1_000_000);
  return { seconds, nanos };
}

function fromProtoTimestamp(timestamp: ProtoTimestamp | undefined): string {
  const seconds = Number(timestamp?.seconds ?? 0);
  const nanos = Number(timestamp?.nanos ?? 0);
  return new Date(seconds * 1000 + nanos / 1_000_000).toISOString();
}

export async function queryTelemetryFromConsumer(
  input: QueryTelemetryInput,
): Promise<QueryPoint[]> {
  return new Promise((resolve, reject) => {
    telemetryClient.Query(
      {
        experiment_id: input.experimentId,
        run_id: input.runId,
        channel_ids: input.channelIds,
        from: toProtoTimestamp(input.from),
        to: toProtoTimestamp(input.to),
        max_points_per_channel: input.maxPointsPerChannel,
      },
      (error, response) => {
        if (error) {
          reject(error);
          return;
        }

        const points =
          response.points?.map((point) => ({
            channelId: point.channel_id,
            timestamp: fromProtoTimestamp(point.timestamp),
            value: point.value,
          })) ?? [];

        resolve(points);
      },
    );
  });
}
