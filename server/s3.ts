import { S3Client } from "@aws-sdk/client-s3";

const globalForS3 = global as unknown as { s3Client: S3Client };

export const s3Client =
  globalForS3.s3Client ||
  new S3Client({
    endpoint: process.env.XPECTRA_S3_MEDIA_UPLOAD_ENDPOINT as string,
    region: process.env.XPECTRA_S3_MEDIA_UPLOAD_REGION as string,
    credentials: {
      accessKeyId: process.env.XPECTRA_S3_MEDIA_UPLOAD_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.XPECTRA_S3_MEDIA_UPLOAD_SECRET_ACCESS_KEY as string,
    },
    // Required for MinIO
    forcePathStyle: process.env.XPECTRA_S3_MEDIA_UPLOAD_FORCE_PATH_STYLE === 'true',
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });

if (process.env.NODE_ENV !== "production") globalForS3.s3Client = s3Client;
