import express, { type Express } from 'express';
import { checkBucketAccess, getObjectStream, headObject, putObjectStream } from './s3.ts';
import { requireBearerToken } from './auth.ts';

export interface CacheStore {
  headObject: typeof headObject;
  getObjectStream: typeof getObjectStream;
  putObjectStream: typeof putObjectStream;
  checkBucketAccess: typeof checkBucketAccess;
}

const defaultStore: CacheStore = { headObject, getObjectStream, putObjectStream, checkBucketAccess };

const HASH_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

function text(res: express.Response, status: number, body: string): void {
  res.status(status).type('text/plain').send(body);
}

// store defaults to the real S3-backed implementation; tests inject a fake
// to exercise routing/validation without touching S3.
export function createApp(store: CacheStore = defaultStore): Express {
  // Read per-call (not at module scope) so tests can flip it without reimporting.
  const maxUploadBytes = Number(process.env.MAX_UPLOAD_BYTES) || 500 * 1024 * 1024;

  const app = express();
  app.disable('x-powered-by');

  app.use((req, res, next) => {
    res.on('finish', () => console.log(`${req.method} ${req.path} -> ${res.statusCode}`));
    next();
  });

  app.get('/health', (req, res) => text(res, 200, 'OK'));

  // Separate from /health (liveness) so a transient S3 outage doesn't get the
  // container killed by a liveness probe — wire this into a readiness probe instead.
  app.get('/health/ready', async (req, res) => {
    const bucketReachable = await store.checkBucketAccess();
    if (!bucketReachable) {
      return text(res, 503, 'S3 bucket unreachable');
    }
    text(res, 200, 'OK');
  });

  app.use('/v1/cache/:hash', requireBearerToken);

  app.get('/v1/cache/:hash', async (req, res) => {
    const { hash } = req.params;
    if (!HASH_PATTERN.test(hash)) {
      return text(res, 400, 'Invalid hash');
    }

    try {
      const { stream, contentLength } = await store.getObjectStream(hash);
      res.status(200);
      res.set('Content-Type', 'application/octet-stream');
      if (contentLength) {
        res.set('Content-Length', String(contentLength));
      }
      stream.on('error', () => res.destroy());
      stream.pipe(res);
    } catch (err: unknown) {
      const httpStatusCode = (err as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;
      const name = (err as { name?: string })?.name;
      if (name === 'NoSuchKey' || httpStatusCode === 404) {
        return text(res, 404, 'The record was not found');
      }
      console.error(`GET /v1/cache/${hash} failed:`, err);
      text(res, 500, 'Internal error');
    }
  });

  app.put('/v1/cache/:hash', async (req, res) => {
    const { hash } = req.params;
    if (!HASH_PATTERN.test(hash)) {
      return text(res, 400, 'Invalid hash');
    }

    const contentLength = Number(req.headers['content-length']);
    if (!contentLength) {
      return text(res, 400, 'Content-Length header is required');
    }
    if (contentLength > maxUploadBytes) {
      return text(res, 413, `Upload exceeds the ${maxUploadBytes}-byte limit`);
    }

    try {
      if (await store.headObject(hash)) {
        return text(res, 409, 'Cannot override an existing record');
      }
      await store.putObjectStream(hash, req, contentLength);
      text(res, 200, 'OK');
    } catch (err: unknown) {
      console.error(`PUT /v1/cache/${hash} failed:`, err);
      text(res, 500, 'Internal error');
    }
  });

  // Safety net for anything a route handler didn't catch itself (e.g. a
  // rejected promise Express 5 forwards here automatically).
  app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (res.headersSent) {
      return next(err);
    }
    console.error(`Unhandled error on ${req.method} ${req.path}:`, err);
    text(res, 500, 'Internal error');
  });

  return app;
}
