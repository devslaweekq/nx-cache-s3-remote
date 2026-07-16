import { createApp } from './app.ts';
import { validateEnv } from './env.ts';

validateEnv();

const PORT = process.env.PORT || 55100;

const server = createApp().listen(PORT, () => {
  console.log(`nx-cache-s3-remote listening on :${PORT}`);
});

function shutdown(signal: string): void {
  console.log(`${signal} received, closing server`);
  server.close(() => process.exit(0));
  // Force-exit if in-flight requests (e.g. large S3 uploads/downloads) don't
  // drain in time — PM2/Docker send SIGKILL shortly after SIGTERM anyway.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
