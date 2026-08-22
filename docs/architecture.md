# Architecture

## Boundaries

- `apps/web` is a Next.js App Router application and the future authenticated HTTP API. Prisma is instantiated only in its server boundary.
- `apps/mobile` is an Expo Router iOS application. It will call the web API and never PostgreSQL directly.
- `packages/domain` contains platform-independent types and calculations; `validation` owns Zod boundary schemas; `api-client` centralizes authenticated HTTP calls; `config` contains harmless shared constants. UI is deliberately not shared.
- `prisma` is the source of truth for the PostgreSQL model and migrations.

Supabase remains the authentication source of truth. Public project URL/publishable keys may enter client bundles; database credentials and any future service-role key must remain server-only. API routes validate bearer sessions and resolve the database user from the authenticated subject rather than client input.

Web authentication uses `@supabase/ssr`: browser components use a public
browser client, while App Router server components and the callback route use a
cookie-backed server client. Middleware refreshes SSR cookies. Email links are
web-hosted at `/auth/callback`, which accepts the PKCE `code` flow and supported
`token_hash` confirmation/recovery links. Every callback `next` path is reduced
to a same-origin internal path before redirecting. Recovery updates the
password at `/auth/update-password` and does not expose whether an email is
registered.

Mobile uses only `EXPO_PUBLIC_*` values and a Supabase client configured with
`detectSessionInUrl: false`, automatic refresh, and `expo-secure-store` backed
persistence. Session values are chunked below native SecureStore value limits.
Confirmation and recovery remain browser flows; native deep links are
intentionally deferred.

On the first protected API request, `getUser(accessToken)` verifies the bearer
token. The API rejects users without a confirmed email, then idempotently
creates the Prisma `User` from the verified Supabase subject and email. A
verified email change is synchronized on later requests; a local unique-email
collision returns a safe conflict and never links identities. Concurrent
first requests handle the unique `authProviderId` race by reading back the
winner.

## Version choices

The scaffold targets Node 20.19+ and pnpm 10. It uses Next.js 15 with React 19 and Expo SDK 54 with its compatible React Native 0.81/React 19 versions. Prisma stays on the mature 6.x configuration format, avoiding a premature Prisma 7 configuration migration. Zod 4 and ESLint 9 use their current APIs. Exact versions are pinned for reproducible client-framework compatibility; Renovate or Dependabot can be added when dependency update policy is established.

Package registry access was unavailable while scaffolding, so versions were selected as a mutually compatible stable set rather than dynamically resolved. Expo's native package alignment should be rechecked with `pnpm --filter @climbing-tracker/mobile exec expo install --check` after installation.

## Deliberate Milestone 1 limits

Authentication is intentionally a minimal foundation: email/password
registration, confirmation and recovery landing routes, protected home shells,
and trusted API identity provisioning. Session logging, analytics, profile
management, and route/problem entities remain outside this milestone. Existing
session API groundwork can be exercised only after a verified account has been
provisioned.
