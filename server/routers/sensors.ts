import { randomUUID } from "crypto";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { PutObjectCommand, HeadBucketCommand, CreateBucketCommand, PutBucketCorsCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@/server/s3";
import { sensors, sensorChannels, organizations } from "@/server/db/schema";
import {
  getOrCreateDbUser,
  getPrimaryOrganizationIdForUser,
  userInfoFromSession,
} from "@/server/routers/ownership";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

const createSensorInput = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).nullish(),
  serialNumber: z.string().trim().max(255).nullish(),
  channelCount: z.number().int().min(1),
  calibrationMatrix: z.array(z.array(z.number())).nullish(),
  bias: z.array(z.number()).nullish(),
  calibratedAt: z.date().nullish(),
  sensorSheetUrl: z.string().trim().max(1024).nullish(),
  channels: z.array(
    z.object({
      channelIndex: z.number().int(),
      name: z.string().trim().min(1),
      unit: z.string().trim().min(1),
      minValue: z.number().nullish(),
      maxValue: z.number().nullish(),
      failureThresholdLo: z.number().nullish(),
      failureThresholdHi: z.number().nullish(),
    })
  ).min(1),
});

export const sensorsRouter = createTRPCRouter({
  createSensor: protectedProcedure
    .input(createSensorInput)
    .mutation(async ({ ctx, input }) => {
      const userId = await getOrCreateDbUser({
        db: ctx.db,
        ...userInfoFromSession(ctx.session),
      });

      const organizationId = await getPrimaryOrganizationIdForUser({
        db: ctx.db,
        userId,
      });

      if (input.channels.length !== input.channelCount) {
         throw new TRPCError({ code: "BAD_REQUEST", message: "Channels array length must match channelCount" });
      }

      // Execute in a transaction
      return ctx.db.transaction(async (tx) => {
        const sensorId = randomUUID();
        const [createdSensor] = await tx
          .insert(sensors)
          .values({
            id: sensorId,
            organisationId: organizationId,
            name: input.name,
            description: input.description ?? null,
            serialNumber: input.serialNumber ?? null,
            channelCount: input.channelCount,
            calibrationMatrix: input.calibrationMatrix ?? null,
            bias: input.bias ?? null,
            calibratedAt: input.calibratedAt ?? null,
            sensorSheetUrl: input.sensorSheetUrl ?? null,
            createdBy: userId,
          })
          .returning();

        const insertedChannels = [];
        for (const channel of input.channels) {
          const [insertedChannel] = await tx
            .insert(sensorChannels)
            .values({
              id: randomUUID(),
              sensorId: sensorId,
              channelIndex: channel.channelIndex,
              name: channel.name,
              unit: channel.unit,
              minValue: channel.minValue ?? null,
              maxValue: channel.maxValue ?? null,
              failureThresholdLo: channel.failureThresholdLo ?? null,
              failureThresholdHi: channel.failureThresholdHi ?? null,
            })
            .returning();
          insertedChannels.push(insertedChannel);
        }

        return { sensor: createdSensor, channels: insertedChannels };
      });
    }),

  getSensors: protectedProcedure.query(async ({ ctx }) => {
    const userId = await getOrCreateDbUser({
      db: ctx.db,
      ...userInfoFromSession(ctx.session),
    });

    const organizationId = await getPrimaryOrganizationIdForUser({
      db: ctx.db,
      userId,
    });

    return ctx.db
      .select()
      .from(sensors)
      .where(eq(sensors.organisationId, organizationId))
      .orderBy(desc(sensors.createdAt));
  }),

  getSensorById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = await getOrCreateDbUser({
        db: ctx.db,
        ...userInfoFromSession(ctx.session),
      });

      const organizationId = await getPrimaryOrganizationIdForUser({
        db: ctx.db,
        userId,
      });

      const sensor = await ctx.db.query.sensors.findFirst({
        where: (row, { and, eq }) => and(eq(row.id, input.id), eq(row.organisationId, organizationId)),
        with: {
          channels: {
            orderBy: (channelsRow, { asc }) => [asc(channelsRow.channelIndex)],
          },
        },
      });

      if (!sensor) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Sensor not found" });
      }

      return sensor;
    }),

  generateUploadUrl: protectedProcedure
    .input(z.object({ filename: z.string(), contentType: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = await getOrCreateDbUser({
        db: ctx.db,
        ...userInfoFromSession(ctx.session),
      });

      const organizationId = await getPrimaryOrganizationIdForUser({
        db: ctx.db,
        userId,
      });

      const org = await ctx.db.query.organizations.findFirst({
        where: eq(organizations.id, organizationId),
        columns: { slug: true }
      });

      if (!org?.slug) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
      }

      const extension = input.filename.split('.').pop() || 'pdf';
      const fileKey = `sensor-data-sheet/${randomUUID()}.${extension}`;
      
      const param = {
        Bucket: org.slug,
        Key: fileKey,
        ContentType: input.contentType,
      };
      
      // Ensure bucket exists and has correct CORS (handles legacy buckets without CORS)
      try {
        await s3Client.send(new HeadBucketCommand({ Bucket: org.slug }));
      } catch (e: any) {
        if (e.name === 'NotFound' || e.$metadata?.httpStatusCode === 404) {
          await s3Client.send(new CreateBucketCommand({ Bucket: org.slug }));
        }
      }
      try {
        await s3Client.send(new PutBucketCorsCommand({
          Bucket: org.slug,
          CORSConfiguration: {
            CORSRules: [
              {
                AllowedHeaders: ["*"],
                AllowedMethods: ["PUT", "POST", "GET", "HEAD", "DELETE"],
                AllowedOrigins: ["*"],
                ExposeHeaders: ["ETag"],
                MaxAgeSeconds: 3600,
              }
            ]
          }
        }));
      } catch (e) {}

      const presignedUrl = await getSignedUrl(s3Client, new PutObjectCommand(param), {
        expiresIn: 3600,
      });

      const endpoint = process.env.XPECTRA_S3_MEDIA_UPLOAD_ENDPOINT as string;
      const publicUrl = `${endpoint}/${org.slug}/${fileKey}`; // MinIO style public access

      return {
        presignedUrl,
        publicUrl,
        fileKey,
      };
    }),
});
