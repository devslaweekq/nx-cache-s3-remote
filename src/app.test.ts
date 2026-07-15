import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { Readable } from 'node:stream';
import { createApp, type CacheStore } from './app.ts';

process.env.CACHE_ACCESS_TOKEN = 'test-token';

function fakeStore(overrides: Partial<CacheStore> = {}): CacheStore {
  return {
    headObject: async () => false,
    getObjectStream: async () => {
      throw Object.assign(new Error('not found'), { $metadata: { httpStatusCode: 404 } });
    },
    putObjectStream: async () => {},
    ...overrides,
  };
}

async function withServer(store: CacheStore, fn: (baseUrl: string) => Promise<void>): Promise<void> {
  const server = createApp(store).listen(0);
  await new Promise<void>(resolve => server.once('listening', () => resolve()));
  const { port } = server.address() as AddressInfo;
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
}

test('GET /health returns 200 text/plain, no auth required', async () => {
  await withServer(fakeStore(), async base => {
    const res = await fetch(`${base}/health`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') ?? '', /text\/plain/);
    assert.equal(await res.text(), 'OK');
  });
});

test('cache routes reject missing/wrong auth with 401 text/plain', async () => {
  await withServer(fakeStore(), async base => {
    const noAuth = await fetch(`${base}/v1/cache/abc123`);
    assert.equal(noAuth.status, 401);
    assert.match(noAuth.headers.get('content-type') ?? '', /text\/plain/);

    const wrongAuth = await fetch(`${base}/v1/cache/abc123`, {
      headers: { Authorization: 'Bearer wrong-token' },
    });
    assert.equal(wrongAuth.status, 401);
  });
});

test('GET rejects malformed hash with 400', async () => {
  await withServer(fakeStore(), async base => {
    const res = await fetch(`${base}/v1/cache/not.a.valid.hash`, {
      headers: { Authorization: 'Bearer test-token' },
    });
    assert.equal(res.status, 400);
  });
});

test('GET returns 404 when the store has no object for the hash', async () => {
  await withServer(fakeStore(), async base => {
    const res = await fetch(`${base}/v1/cache/abc123`, {
      headers: { Authorization: 'Bearer test-token' },
    });
    assert.equal(res.status, 404);
  });
});

test('GET streams the object back with the right content type', async () => {
  const store = fakeStore({
    getObjectStream: async () => ({ stream: Readable.from(['hello world']), contentLength: 11 }),
  });
  await withServer(store, async base => {
    const res = await fetch(`${base}/v1/cache/abc123`, {
      headers: { Authorization: 'Bearer test-token' },
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'application/octet-stream');
    assert.equal(await res.text(), 'hello world');
  });
});

test('PUT stores a new hash, then rejects a re-upload of the same hash with 409', async () => {
  let stored = false;
  const store = fakeStore({
    headObject: async () => stored,
    putObjectStream: async () => {
      stored = true;
    },
  });

  await withServer(store, async base => {
    const first = await fetch(`${base}/v1/cache/abc123`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer test-token' },
      body: 'artifact-bytes',
    });
    assert.equal(first.status, 200);

    const second = await fetch(`${base}/v1/cache/abc123`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer test-token' },
      body: 'artifact-bytes',
    });
    assert.equal(second.status, 409);
  });
});

test('PUT rejects uploads over the configured size limit with 413', async () => {
  process.env.MAX_UPLOAD_BYTES = '10';
  try {
    await withServer(fakeStore(), async base => {
      const res = await fetch(`${base}/v1/cache/abc123`, {
        method: 'PUT',
        headers: { Authorization: 'Bearer test-token' },
        body: 'this body is longer than ten bytes',
      });
      assert.equal(res.status, 413);
    });
  } finally {
    delete process.env.MAX_UPLOAD_BYTES;
  }
});
