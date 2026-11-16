import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeError, log } from './logger.ts';

test('describeError renders an AWS SDK exception on one line without a stack trace', () => {
  const err = Object.assign(new Error('We encountered an internal error, please try again.'), {
    name: 'S3ServiceException',
    Code: 'InternalError',
    $metadata: { httpStatusCode: 500, requestId: 'e91b763a94e8fa00' },
  });

  const line = describeError(err);

  assert.equal(
    line,
    'S3ServiceException [InternalError] We encountered an internal error, please try again. s3Status=500 requestId=e91b763a94e8fa00',
  );
  assert.ok(!line.includes('\n'));
});

test('describeError lists the nested errors of an AggregateError (empty message)', () => {
  const err = Object.assign(new AggregateError([], ''), {
    code: 'ETIMEDOUT',
    errors: [
      Object.assign(new Error('connect ETIMEDOUT 213.180.193.243:443'), {
        code: 'ETIMEDOUT',
        address: '213.180.193.243',
        port: 443,
      }),
      Object.assign(new Error('connect ENETUNREACH 2a02:6b8::1d9:443'), { code: 'ENETUNREACH' }),
    ],
  });

  const line = describeError(err);

  assert.match(line, /^AggregateError \[ETIMEDOUT\]/);
  assert.match(line, /Error \[ETIMEDOUT\] connect ETIMEDOUT 213\.180\.193\.243:443 at 213\.180\.193\.243:443/);
  assert.match(line, /Error \[ENETUNREACH\] connect ENETUNREACH 2a02:6b8::1d9:443/);
  assert.ok(!line.includes('\n'));
});

test('describeError handles non-object throwables', () => {
  assert.equal(describeError('boom'), 'boom');
  assert.equal(describeError(undefined), 'undefined');
});

test('log prefixes the message with an ISO timestamp and the level', t => {
  const out = t.mock.method(console, 'log', () => {});
  const errOut = t.mock.method(console, 'error', () => {});

  log('INFO', 'hello');
  log('ERROR', 'broken');

  assert.match(out.mock.calls[0].arguments[0], /^\d{4}-\d{2}-\d{2}T[\d:.]+Z INFO hello$/);
  assert.match(errOut.mock.calls[0].arguments[0], /^\d{4}-\d{2}-\d{2}T[\d:.]+Z ERROR broken$/);
});
