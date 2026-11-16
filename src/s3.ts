import { S3Client, HeadObjectCommand, GetObjectCommand, PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import type { Readable } from 'stream';
import { describeError, log } from './logger.ts';

const client = new S3Client({
  region: process.env.NXCACHE_S3_REGION,
  endpoint: process.env.NXCACHE_S3_ENDPOINT || undefined,
  forcePathStyle: process.env.NXCACHE_S3_FORCE_PATH_STYLE !== 'false',
  // Without this the SDK prints its own warnings (e.g. "non-retryable streaming request")
  // straight to the console, in a different format and without a timestamp.
  logger: {
    debug: () => {},
    info: () => {},
    warn: (...args: unknown[]) => log('WARN', `S3 SDK: ${args.map(String).join(' ')}`),
    error: (...args: unknown[]) => log('ERROR', `S3 SDK: ${args.map(String).join(' ')}`),
  },
  credentials: {
    accessKeyId: process.env.NXCACHE_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NXCACHE_S3_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.NXCACHE_S3_BUCKET!;

export async function checkBucketAccess(): Promise<boolean> {
  try {
    await client.send(new HeadBucketCommand({ Bucket: BUCKET }));
    return true;
  } catch (err: unknown) {
    log('ERROR', `S3 bucket ${BUCKET} is unreachable: ${describeError(err)}`);
    return false;
  }
}

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
