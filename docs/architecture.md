# Architecture

## Boundaries

- `apps/web` is a Next.js App Router application and the future authenticated HTTP API. Prisma is instantiated only in its server boundary.
- `apps/mobile` is an Expo Router iOS application. It will call the web API and never PostgreSQL directly.
- `packages/domain` contains platform-independent types and calculations; `validation` owns Zod boundary schemas; `api-client` centralizes authenticated HTTP calls; `config` contains harmless shared constants. UI is deliberately not shared.
- `prisma` is the source of truth for the PostgreSQL model and migrations.

Supabase remains the authentication source of truth. Public project URL/publishable keys may enter client bundles; database credentials and any future service-role key must remain server-only. API routes added in Milestone 1 must validate bearer sessions and resolve the database user from the authenticated subject rather than client input.

## Version choices

The scaffold targets Node 20.19+ and pnpm 10. It uses Next.js 15 with React 19 and Expo SDK 54 with its compatible React Native 0.81/React 19 versions. Prisma stays on the mature 6.x configuration format, avoiding a premature Prisma 7 configuration migration. Zod 4 and ESLint 9 use their current APIs. Exact versions are pinned for reproducible client-framework compatibility; Renovate or Dependabot can be added when dependency update policy is established.

Package registry access was unavailable while scaffolding, so versions were selected as a mutually compatible stable set rather than dynamically resolved. Expo's native package alignment should be rechecked with `pnpm --filter @climbing-tracker/mobile exec expo install --check` after installation.

## Deliberate Milestone 0 limits

The homes are authentication-ready placeholders. There are no session route handlers, persistence services, sign-in UI, or session workflows. The database already models the four agreed entities so the next vertical slice can focus on authenticated behavior without speculative analytics or route/problem entities.
