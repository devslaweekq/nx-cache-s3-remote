import { S3Client, HeadObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import type { Readable } from 'stream';

const client = new S3Client({
  region: process.env.NXCACHE_S3_REGION,
  endpoint: process.env.NXCACHE_S3_ENDPOINT || undefined,
  forcePathStyle: process.env.NXCACHE_S3_FORCE_PATH_STYLE !== 'false',
  credentials: {
    accessKeyId: process.env.NXCACHE_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NXCACHE_S3_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.NXCACHE_S3_BUCKET!;

export async function headObject(hash: string): Promise<boolean> {
  try {
    await client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: hash }));
    return true;
  } catch (err: any) {
    if (err.$metadata?.httpStatusCode === 404) return false;
    throw err;
  }
}

export async function getObjectStream(hash: string): Promise<{ stream: Readable; contentLength?: number }> {
  const result = await client.send(new GetObjectCommand({ Bucket: BUCKET, Key: hash }));
  return { stream: result.Body as Readable, contentLength: result.ContentLength };
}

// HEAD-then-PUT is not atomic — a race between two concurrent uploads of the
// same hash can both pass the existence check. Acceptable at CI scale, where
// the same task hash essentially never races itself.
export async function putObjectStream(hash: string, bodyStream: Readable, contentLength: number): Promise<void> {
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: hash,
      Body: bodyStream,
      ContentLength: contentLength,
      ContentType: 'application/octet-stream',
    }),
  );
}
