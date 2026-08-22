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

## Supabase authentication setup

In the Supabase dashboard, enable Authentication → Providers → Email and keep
email/password enabled. Keep **Confirm email** enabled so an account must prove
email ownership before it can access protected app data. Configure the email
templates to use the Supabase confirmation URL; the app accepts the resulting
`code`/`token_hash` callback at `/auth/callback`.

Add these redirect URLs under Authentication → URL Configuration:

- `http://localhost:3000/auth/callback`
- `https://YOUR_DEPLOYED_WEB_ORIGIN/auth/callback`

Set `NEXT_PUBLIC_WEB_ORIGIN` and `EXPO_PUBLIC_WEB_URL` to the matching origin
(without a trailing slash), and set the Supabase URL and publishable/anon key in
`.env`. The web app uses the PKCE code flow and stores the browser session in
Supabase SSR cookies. Mobile uses its public client with native SecureStore
persistence; email confirmation and recovery links intentionally open the web
origin, then the user returns to the app. No native auth deep link is required.

The password recovery callback lands at `/auth/update-password`. Invalid,
expired, or already-used links show a neutral error and a way to request another
link. Keep production redirect URLs exact; do not add wildcard or untrusted
origins.

After installing dependencies, generate and migrate the local database:

```sh
pnpm db:generate
pnpm db:migrate
```

Manual Milestone 1 verification still requires a configured Supabase project and
email inbox: register and confirm on web, sign in/out, request and complete a
password reset, then repeat registration/sign-in on an iOS simulator or device
and restart the app to verify SecureStore session restoration. The automated
checks below validate local code only; they do not claim to replace this
provider/email/device check.

## Development

```sh
pnpm --filter @climbing-tracker/web dev
pnpm --filter @climbing-tracker/mobile dev
```

Press `i` in the Expo terminal to open the iOS Simulator. The web and mobile
shells can render without a database, but Milestone 1 authentication requires
the public Supabase variables above. API provisioning and migrations require a
working PostgreSQL `DATABASE_URL`.

## Checks

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

See [the architecture](docs/architecture.md) for boundaries and security choices and [the domain guide](docs/domain.md) for current business rules.
