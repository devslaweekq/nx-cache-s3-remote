import { timingSafeEqual } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export function requireBearerToken(req: Request, res: Response, next: NextFunction): void {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  const expected = process.env.CACHE_ACCESS_TOKEN || '';

  if (scheme !== 'Bearer' || !token || !expected || !safeEqual(token, expected)) {
    console.warn(`auth rejected: got token len=${token?.length ?? 0}, expected len=${expected.length}`);
    res.status(401).type('text/plain').send('Missing or invalid authentication token');
    return;
  }

  next();
}
