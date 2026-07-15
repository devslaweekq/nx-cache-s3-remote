# Ports

| Service     | Port                  | URL                   | Health check  |
| ----------- | --------------------- | --------------------- | ------------- |
| nx-cache-s3 | `PORT` (default 3000) | http://localhost:3000 | `GET /health` |

`docker-compose.yml` publishes the container's `PORT` to the same port on the
host (`${PORT:-3000}:${PORT:-3000}`) — set `PORT` in `.env` to change it.

## Endpoints

| Method | Path              | Purpose                                                     |
| ------ | ----------------- | ----------------------------------------------------------- |
| GET    | `/health`         | Liveness check (used by Docker healthcheck)                 |
| GET    | `/v1/cache/:hash` | Download a cached task artifact                             |
| PUT    | `/v1/cache/:hash` | Upload a task artifact (rejects existing hashes with `409`) |

Both `/v1/cache/*` endpoints require `Authorization: Bearer <CACHE_ACCESS_TOKEN>`.
