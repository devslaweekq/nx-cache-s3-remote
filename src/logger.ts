export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

// One line per record: `<ISO time> <LEVEL> <message>`. Errors go to stderr,
// everything else to stdout, so `kubectl logs` / `docker logs` show both streams in order.
export function log(level: LogLevel, message: string): void {
  const line = `${new Date().toISOString()} ${level} ${message}`;
  if (level === 'ERROR') {
    console.error(line);
  } else {
    console.log(line);
  }
}

interface ErrorLike {
  name?: string;
  code?: string;
  Code?: string;
  message?: string;
  address?: string;
  port?: number;
  errors?: unknown[];
  $metadata?: { httpStatusCode?: number; requestId?: string };
}

// Collapses an error (AWS SDK exceptions, Node network errors, AggregateError) into one
// line with the fields that matter — no stack trace. The stack of an SDK error points into
// node_modules and never says why the request failed; the code, status and requestId do.
export function describeError(err: unknown): string {
  if (typeof err !== 'object' || err === null) {
    return String(err);
  }

  const e = err as ErrorLike;
  const parts: string[] = [];

  const code = e.code ?? e.Code;
  parts.push(code && code !== e.name ? `${e.name ?? 'Error'} [${code}]` : (e.name ?? 'Error'));

  if (e.message) {
    parts.push(e.message);
  }
  if (e.address) {
    parts.push(`at ${e.address}${e.port ? `:${e.port}` : ''}`);
  }
  if (e.$metadata?.httpStatusCode) {
    parts.push(`s3Status=${e.$metadata.httpStatusCode}`);
  }
  if (e.$metadata?.requestId) {
    parts.push(`requestId=${e.$metadata.requestId}`);
  }
  // AggregateError (e.g. failing to connect over both IPv4 and IPv6) has an empty message —
  // the useful part is in the nested errors.
  if (Array.isArray(e.errors) && e.errors.length > 0) {
    parts.push(`causes=(${e.errors.map(describeError).join('; ')})`);
  }

  return parts.join(' ');
}
