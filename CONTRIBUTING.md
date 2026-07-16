# Priorities

- Stay small: one Docker image, two required endpoints, no extra moving parts.
- Security first: the whole point of this project is closing the gap that got
  Nx's official plugins deprecated. Anything that weakens auth, upload
  validation, or immutability needs a very good reason.
- Zero extra config on the Nx client side. If a change requires client-side
  setup beyond the two standard `NX_SELF_HOSTED_REMOTE_CACHE_*` env vars,
  it's probably out of scope.
- Fail fast and loud over failing silently — this holds for the server's
  own behavior and for its test/CI coverage alike.

# Agenda

This is a narrowly scoped, self-hosted Nx remote cache server, not a general
S3 gateway. New features are judged against whether they serve that one job.
If something is better solved by S3 bucket policies, IAM, or Nx itself,
it probably shouldn't live here.

# Contributing guidelines

Make sure to follow these guidelines before opening an
[issue](https://github.com/devslaweekq/nx-cache-s3-remote/issues/new) or a
[pull request](https://github.com/devslaweekq/nx-cache-s3-remote/pulls):

- Before opening an issue or a pull request, check if it already exists.
- Pull requests for dependency bumps aren't needed —
  [Dependabot](.github/dependabot.yml) handles those automatically.
- Run `npm run format`, `npm run typecheck`, and `npm test` before opening a
  pull request; CI runs the same checks (plus `npm audit`) on every PR.
- If you're proposing a new feature, check it against the priorities above
  first — simplicity and security win over convenience.
