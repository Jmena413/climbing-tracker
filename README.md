# Climbing Tracker

A pnpm monorepo for a mobile-first bouldering session tracker. Milestone 0 provides runnable Next.js and Expo foundations, shared domain/validation/API packages, PostgreSQL via Prisma, and Supabase authentication wiring.

## Prerequisites

- Node.js 20.19 or later
- pnpm 10 (`corepack enable`)
- PostgreSQL 15 or later
- A Supabase project
- Xcode and an iOS Simulator for local native development, or Expo Go on a compatible device

## Setup

```sh
pnpm install
cp .env.example .env
createdb climbing_tracker
pnpm db:generate
pnpm db:migrate
```

Fill in `.env` using the comments in `.env.example`. Never use a Supabase service-role key in a `NEXT_PUBLIC_` or `EXPO_PUBLIC_` variable. For a physical phone, set `EXPO_PUBLIC_API_URL` to the development computer's LAN address.

## Development

```sh
pnpm --filter @climbing-tracker/web dev
pnpm --filter @climbing-tracker/mobile dev
```

Press `i` in the Expo terminal to open the iOS Simulator. The placeholder applications do not require a database or Supabase credentials to render; those values are required for migrations and for authentication work in the next milestone.

## Checks

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

See [the architecture](docs/architecture.md) for boundaries and security choices and [the domain guide](docs/domain.md) for current business rules.
