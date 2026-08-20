# AGENTS.md

## Project

This repository contains a climbing tracker with:

- a Next.js web application
- an Expo / React Native iOS application
- a shared TypeScript domain layer
- a shared API client
- PostgreSQL persistence through Prisma
- Supabase authentication

The product is intended to make bouldering-session logging very fast on mobile while providing a good web experience for reviewing session history and, later, analytics.

For the initial repository, prioritize foundation and core session logging. Do not build speculative future features.

---

## Core stack

Use:

- TypeScript
- pnpm
- Turborepo
- Next.js with App Router
- React
- Expo
- React Native
- Expo Router
- PostgreSQL
- Prisma
- Supabase Auth
- Zod
- ESLint
- Prettier

Keep TypeScript strict mode enabled.

Do not replace major stack choices without an explicit request.

---

## Expected repository structure

Prefer this general structure:

```text
apps/
  web/
  mobile/

packages/
  domain/
  validation/
  api-client/
  config/

prisma/

docs/
```

The exact structure may evolve when there is a concrete reason.

Do not introduce unnecessary packages or abstractions merely to preserve this layout.

---

## Working rules

Before making non-trivial changes:

1. Inspect the relevant existing files.
2. Understand current patterns before introducing new ones.
3. Read relevant documentation under `docs/`.
4. Make a concise implementation plan.
5. Keep the task scoped to the user's request.

Do not make unrelated refactors.

Do not expand scope just because additional work appears useful.

Prefer modifying existing abstractions over creating parallel implementations.

---

## Engineering principles

Prefer:

- simple solutions
- clear boundaries
- explicit types
- small modules
- composition
- testable business logic
- descriptive naming

Avoid:

- premature abstraction
- excessive indirection
- generic frameworks created for one use case
- unnecessary dependencies
- hidden global state
- duplicated domain logic
- speculative infrastructure

Do not optimize for theoretical future requirements unless the current design would obviously block them.

---

## Domain model

The initial MVP centers on:

- `User`
- `Gym`
- `Session`
- `SessionClimb`

### Session

A session belongs to a user.

A session is active when:

```ts
endedAt === null
```

A user should not normally have more than one active session.

Enforce this in application or service logic.

### SessionClimb

A session climb belongs to a session.

Initial fields conceptually include:

```ts
grade
attempts
sent
```

Rules:

```ts
attempts >= 1
```

A flash should be derived as:

```ts
sent && attempts === 1
```

Do not persist `flash` unless there is a demonstrated need.

Do not create a permanent gym `Problem` or `Route` entity until explicitly requested.

---

## Climbing grades

The initial product supports bouldering using the V-scale:

```text
VB
V0
V1
V2
V3
...
V17
```

Do not design the entire domain around the assumption that the V-scale is the only grading system.

Future grading systems may exist, but do not implement them until requested.

---

## Mobile UX

The mobile app is the primary interface during an active climbing session.

Optimize active-session interactions for:

- large touch targets
- minimal typing
- minimal number of taps
- quick visual feedback
- one-handed use where practical

A climber should be able to log a climb in a few seconds.

Avoid turning active-session logging into a large form.

---

## Web UX

The web app should prioritize:

- session history
- session details
- account/profile management
- future analytics

The web UI does not need to mirror the mobile UI.

Do not force shared visual components between Next.js and React Native unless there is a clear benefit.

---

## Shared code

Good candidates for shared packages include:

- domain types
- Zod schemas
- API contracts
- API client logic
- calculations
- formatting utilities that are platform-independent

Do not aggressively share:

- visual components
- navigation
- native-specific state
- browser-specific state

Prefer shared business logic over shared UI.

---

## Backend/API

The mobile app must never connect directly to PostgreSQL.

Both clients should access protected data through authenticated backend APIs or server-side application services.

For user-owned resources:

1. authenticate the request
2. determine the current user from authentication
3. validate input
4. verify ownership
5. perform the operation

Never trust a client-supplied `userId`.

Never return another user's private session data.

Use appropriate HTTP status codes and useful error messages.

---

## Database

Use PostgreSQL through Prisma.

All schema changes must be represented by Prisma migrations.

Do not rely on manually modified database state.

Avoid persisting values that can cheaply and reliably be derived from other fields.

---

## Validation

Use Zod for runtime validation at system boundaries.

Examples include:

- API request bodies
- URL parameters when appropriate
- external data
- forms where shared validation is useful

Do not rely on TypeScript types as runtime validation.

---

## Authentication and secrets

Use Supabase Auth.

Never expose server-only secrets to:

- browser bundles
- Expo bundles
- committed code

Do not log:

- passwords
- access tokens
- refresh tokens
- service-role secrets
- database credentials

Create and maintain `.env.example`.

Never commit a real `.env` file containing credentials.

---

## Testing

Add tests for meaningful domain and backend behavior.

Important initial cases include:

- creating a session
- preventing invalid simultaneous active sessions
- ending a session
- creating a session climb
- rejecting attempts below 1
- deriving flash behavior
- preventing access to another user's session
- preventing modification of another user's climb

Before declaring work complete, run the relevant available commands for:

```text
lint
typecheck
test
build
```

Do not claim a command passed unless it actually ran successfully.

If a command cannot run because credentials or external services are missing, clearly state that.

Do not suppress errors merely to make checks pass.

---

## Documentation

Maintain:

```text
README.md
docs/architecture.md
docs/domain.md
```

Update documentation when changes affect:

- developer setup
- architecture
- important domain rules
- required environment variables

Do not add documentation that merely restates obvious code.

---

## Out of scope unless explicitly requested

Do not implement:

- AI coaching
- LLM integrations
- computer vision
- hold detection
- route recognition
- Apple Health
- Oura integration
- social features
- friends
- leaderboards
- public route databases
- training-plan generation
- subscriptions
- payments
- advanced offline synchronization
- push notifications
- recommendation engines
- Android-specific optimization

The architecture may remain extensible, but do not build these systems prematurely.

---

## Dependency policy

Before adding a dependency:

1. Check whether the functionality can reasonably be implemented using an existing dependency or platform API.
2. Prefer well-maintained, widely used libraries.
3. Avoid adding large dependencies for trivial functionality.

Do not replace existing libraries without a concrete reason.

---

## Code changes

When implementing a task:

- keep the diff focused
- follow existing formatting and naming
- avoid unrelated file changes
- add tests when behavior changes
- update types and validation together
- update docs when architecture or setup changes

Do not leave dead code or commented-out implementations behind.

---

## Definition of done

A task is complete when:

- requested behavior is implemented
- relevant validation exists
- authorization rules are respected
- relevant tests exist
- relevant tests pass
- type checking passes
- linting passes
- no obvious security regression exists
- documentation is updated when necessary
- no unrelated work was included

At the end of a task, report:

1. what changed
2. important design decisions
3. tests/checks run
4. results of those checks
5. unresolved issues
6. manual setup required