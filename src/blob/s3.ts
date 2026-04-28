import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";
import { getEnv } from "../env.js";

let _client: S3Client | undefined;

export function getS3Client(): S3Client {
  if (!_client) {
    const env = getEnv();
    _client = new S3Client({
      endpoint: env.S3_ENDPOINT,
      region: "us-east-1",
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY,
        secretAccessKey: env.S3_SECRET_KEY,
      },
      forcePathStyle: true,
    });
  }
  return _client;
}

export async function ensureBucket(): Promise<void> {
  const env = getEnv();
  const client = getS3Client();
  try {
    await client.send(new HeadBucketCommand({ Bucket: env.S3_BUCKET }));
  } catch {
    await client.send(new CreateBucketCommand({ Bucket: env.S3_BUCKET }));
    // Set public read policy for the bucket
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${env.S3_BUCKET}/*`],
        },
      ],
    };
    try {
      const { PutBucketPolicyCommand } = await import("@aws-sdk/client-s3");
      await client.send(
        new PutBucketPolicyCommand({
          Bucket: env.S3_BUCKET,
          Policy: JSON.stringify(policy),
        })
      );
    } catch (e) {
      console.warn("Failed to set bucket policy:", e);
    }
  }
}

export async function putImage(key: string, body: Buffer, contentType: string): Promise<void> {
  const env = getEnv();
  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function headBucket(): Promise<boolean> {
  try {
    const env = getEnv();
    const client = getS3Client();
    await client.send(new HeadBucketCommand({ Bucket: env.S3_BUCKET }));
    return true;
  } catch {
    return false;
  }
}
