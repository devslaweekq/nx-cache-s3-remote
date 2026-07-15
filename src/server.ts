import express from 'express';
import { getObjectStream, headObject, putObjectStream } from './s3.ts';
import { requireBearerToken } from './auth.ts';

const PORT = process.env.PORT || 3000;
const HASH_PATTERN = /^[a-zA-Z0-9_-]+$/;

const app = express();
app.disable('x-powered-by');

app.use((req, res, next) => {
  res.on('finish', () => console.log(`${req.method} ${req.path} -> ${res.statusCode}`));
  next();
});

// Nx's remote cache client validates that error/status bodies are text/plain
// — express's res.send(string) defaults to text/html, which Nx rejects as a
// "misconfigured remote cache endpoint".
function text(res: express.Response, status: number, body: string): void {
  res.status(status).type('text/plain').send(body);
}

app.get('/health', (req, res) => text(res, 200, 'OK'));

app.use('/v1/cache/:hash', requireBearerToken);

app.get('/v1/cache/:hash', async (req, res) => {
  const { hash } = req.params;
  if (!HASH_PATTERN.test(hash)) {
    return text(res, 400, 'Invalid hash');
  }

  try {
    const { stream, contentLength } = await getObjectStream(hash);
    res.status(200);
    res.set('Content-Type', 'application/octet-stream');
    if (contentLength) {
      res.set('Content-Length', String(contentLength));
    }
    stream.on('error', () => res.destroy());
    stream.pipe(res);
  } catch (err: any) {
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
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

  try {
    if (await headObject(hash)) {
      return text(res, 409, 'Cannot override an existing record');
    }
    await putObjectStream(hash, req, contentLength);
    text(res, 200, 'OK');
  } catch (err) {
    console.error(`PUT /v1/cache/${hash} failed:`, err);
    text(res, 500, 'Internal error');
  }
});

app.listen(PORT, () => {
  console.log(`nx-cache-s3-remote listening on :${PORT}`);
});
