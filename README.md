# nx-cache-s3-remote

A self-hosted [Nx remote cache](https://nx.dev/docs/guides/tasks--caching/self-hosted-caching) server backed by S3-compatible storage (built for Cloud Object Storage).

Nx's own S3 cache plugins (`@nx/s3-cache` and friends) were deprecated due to [CVE-2025-36852 (CREEP)](https://nx.dev/docs/reference/deprecated/self-hosted-cache-packages) and no longer support current Nx versions. This service implements Nx's self-hosted remote cache HTTP API directly, with one deliberate hardening the deprecated plugins lacked: **an upload for a hash that already exists is rejected with `409`** — cached artifacts are immutable once written, closing the cache-poisoning vector CREEP exploited.

**Docker image:** [`slaweekq/nx-cache-s3:latest`](https://hub.docker.com/r/slaweekq/nx-cache-s3)

---

## How it works

Nx talks to this server over two endpoints ([spec](https://nx.dev/docs/guides/tasks--caching/self-hosted-caching)):

| Method | Path              | Behavior                                                        |
| ------ | ----------------- | --------------------------------------------------------------- |
| GET    | `/v1/cache/:hash` | Streams the cached artifact from S3. `404` if not found.        |
| PUT    | `/v1/cache/:hash` | Streams the upload to S3. `409` if that hash is already cached. |

Both require `Authorization: Bearer <token>`. See [`PORTS.md`](PORTS.md) for the full endpoint reference.

---

## Setup

### 1. Configure

```bash
cp .env.example .env
chmod 600 .env
```

Fill in `.env`:

```env
PORT=3000
CACHE_ACCESS_TOKEN=<generate a random secret>

NXCACHE_S3_ACCESS_KEY_ID=
NXCACHE_S3_SECRET_ACCESS_KEY=
NXCACHE_S3_BUCKET=
NXCACHE_S3_REGION=
NXCACHE_S3_ENDPOINT=
NXCACHE_S3_FORCE_PATH_STYLE=true
```

The S3 bucket must already exist — this service does not create it.

### 2. Run

```bash
docker compose up -d
```

Pulls `slaweekq/nx-cache-s3:latest` and starts it on `PORT` (default `3000`).

### 3. Point Nx at it

On every machine/CI runner that should use the cache (client side, not this repo):

```bash
NX_SELF_HOSTED_REMOTE_CACHE_SERVER=https://your-cache-host:3000
NX_SELF_HOSTED_REMOTE_CACHE_ACCESS_TOKEN=<same value as CACHE_ACCESS_TOKEN>
```

No `nx.json` changes or extra npm packages needed on the client — this is Nx core behavior since 20.8.

---

## Configuration reference

| Variable                       | Required | Description                                                   |
| ------------------------------ | -------- | ------------------------------------------------------------- |
| `PORT`                         | No       | Listen port (default `3000`)                                  |
| `CACHE_ACCESS_TOKEN`           | Yes      | Bearer token clients must present                             |
| `NXCACHE_S3_ACCESS_KEY_ID`     | Yes      | S3 access key                                                 |
| `NXCACHE_S3_SECRET_ACCESS_KEY` | Yes      | S3 secret key                                                 |
| `NXCACHE_S3_BUCKET`            | Yes      | Bucket name (must already exist)                              |
| `NXCACHE_S3_REGION`            | Yes      | S3 region                                                     |
| `NXCACHE_S3_ENDPOINT`          | No       | Custom endpoint for S3-compatible providers                   |
| `NXCACHE_S3_FORCE_PATH_STYLE`  | No       | Path-style bucket URLs; `true` by default (needed for Yandex) |

See [`.env.example`](.env.example) for the full template.

---

<details>
<summary>For maintainers</summary>

```bash
npm run dev   # local dev server (node --watch)
npm run build # build slaweekq/nx-cache-s3:latest locally
npm run push  # build and push to Docker Hub
```

See [`scripts/docker/build.sh`](scripts/docker/build.sh) and [`scripts/docker/push.sh`](scripts/docker/push.sh).

</details>
