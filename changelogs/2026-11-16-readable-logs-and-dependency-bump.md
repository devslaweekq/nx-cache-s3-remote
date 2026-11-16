# Changelog

## [1.3.4] - 2026-11-16

### Added

### One-line timestamped logs (`src/logger.ts`)
Every log record is now a single line: `<ISO time> <LEVEL> <message>` (`INFO`/`WARN` to stdout,
`ERROR` to stderr). Previously the access log had no timestamp (`PUT /v1/cache/<hash> -> 200`)
and errors were dumped as multi-line stack traces. All former `console.*` calls in `app.ts`,
`auth.ts`, `env.ts`, `server.ts` and `s3.ts` go through the new `log()`.

The access line is now `<METHOD> <path> <status> <duration>ms`. Successful `/health*` probes
are no longer logged (they were most of the output); failing ones still are.

### Aborted-request warning (`src/app.ts`)
If the connection closes before the response was fully sent, a separate `WARN` is logged:
`PUT /v1/cache/<hash> 200 38211ms connection closed before the response was sent`. Together
with the duration this makes it possible to tell a slow upload cut off by a proxy/ingress
timeout from a server-side failure. Prompted by CI runs where Nx reported
`Failed to send request ... /v1/cache/<hash>` while the server had logged `PUT -> 200` for
the same hash.

### One-line error descriptions (`describeError` in `src/logger.ts`)
S3/network errors are logged as one line with the fields that matter and no stack trace:
error name, code, message, `s3Status`, `requestId` and, for `AggregateError` (e.g. connect
failure over both IPv4 and IPv6, which has an empty message), the nested causes with
`address:port`.

### Tests
`src/logger.test.ts` covers `describeError` (AWS SDK exception, `AggregateError`, non-object
throwables) and the `log()` format. `src/app.test.ts` gets a test that an abandoned `PUT`
produces the aborted-request warning.

### Changed

### Failure reasons are no longer swallowed (`src/s3.ts`)
`checkBucketAccess()` used to return `false` without saying why, so `/health/ready` answered
`503` with nothing in the logs. It now logs `S3 bucket <name> is unreachable: <reason>`. While
S3 is down this is logged on every readiness probe.

The AWS SDK client gets a `logger` that routes its own warnings (e.g. `An error was
encountered in a non-retryable streaming request`) through the same one-line format instead of
raw `console.warn` output. That warning is a reminder that `PUT` bodies are streamed, so the
SDK cannot retry a failed upload.

### Auth-rejection log line (`src/auth.ts`)
`auth rejected: ...` now includes the method and the request path
(`auth rejected: GET /v1/cache/<hash>, got token len=X, expected len=Y`). Token values are
still never logged.

### Docker base image bumped to `node:24.22.3-slim`
Both build and runtime stages of `Dockerfile` moved from `node:24.20.0-slim`.

### `docker/login-action` bumped to `v4.8.0`
`.github/workflows/docker-publish.yml` moved from `v4.5.2`.

### Dependency bumps (`package.json`, `package-lock.json`)
- `@aws-sdk/client-s3` `^3.1126.0` → `^3.1169.0` (and its transitive `@aws-sdk/*`/`@smithy/*`
  packages)
- `express` `^5.2.1` → `^5.3.0`
- `pm2` `^7.0.4` → `^7.1.2`
- `@types/node` `^26.4.1` → `^26.6.6`
- `prettier` `^3.9.6` → `^3.10.1`
- `prettier-plugin-packagejson` `^3.0.2` → `^3.1.0`

### `ecosystem.config.cjs` reformatted
Single quotes replaced with double quotes. Formatting only, no behavior change.
