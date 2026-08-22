# Climbing Tracker — Roadmap & Design

> Living design document for Codex and the project team. Update this file as decisions become clearer. Keep committed decisions separate from near-term plans and speculative ideas.

**Status:** Repository-grounded working draft  
**Last updated:** 2026-08-21  
**Primary reference:** `Jmena413/climbing-tracker` on GitHub, especially `AGENTS.md`, `README.md`, `docs/`, the Prisma schema, and current `main` implementation

## How to use this document

- Treat **Current decisions** as the source of truth for implementation.
- Treat **Near-term planned work** as the intended sequence, subject to revision.
- Treat **Future ideas** as explicitly non-committed; do not implement them unless promoted into the roadmap.
- When the repository is available, reconcile this document with its actual architecture before starting a milestone.
- Each milestone should be delivered as a small vertical slice with working behavior, tests where appropriate, and documentation updates.

## Product vision

Climbing Tracker helps a climber record, understand, and improve their climbing practice over time. The product should make logging useful without making it burdensome, preserve a trustworthy history of activity, and eventually turn that history into practical insight.

The first product goal is a dependable cross-platform foundation: a user can authenticate through the shared Supabase identity system and reach the existing app experience on web or mobile. The primary usage experience is fast, one-handed bouldering-session logging on iOS. The web experience primarily supports reviewing history, session details, account/profile management, and later—not currently committed—analytics.

The product is bouldering-first. Other climbing disciplines should not drive MVP fields, workflows, or grading support. Future expansion is possible only when it solves a demonstrated need without compromising the bouldering experience.

## Scope boundaries

### Current decisions

- The product targets both a Next.js web app and an Expo mobile app.
- The MVP and foreseeable core roadmap focus on bouldering.
- Web and mobile use the same Supabase project and user identity system.
- Supabase is the source of truth for authentication.
- Authentication uses email/password for the MVP.
- Anyone may create their own account through self-service registration.
- New accounts must confirm ownership of their email address before accessing authenticated product features.
- Users must have a basic email-based password recovery path.
- Milestone 1 email-verification and password-recovery links open web-hosted routes; native mobile deep links are deferred.
- An authenticated user can reach the existing home screen.
- An unauthenticated user is directed to sign in.
- Server/API code determines the current user from verified authentication context, never from a client-supplied `userId`.
- Service-role keys and other server-only secrets must never be included in browser or Expo bundles.
- Authentication UI should remain minimal and functional during the foundation milestone.

### Near-term planned work

- Establish the shared authentication foundation on web and mobile.
- Persist mobile authentication state appropriately.
- Add the smallest necessary synchronization between Supabase identities and the existing Prisma `User`/profile setup, if the repository requires it.
- Begin session logging only after authentication is working end to end.

### Future ideas — not committed

- Rich analytics and progress dashboards.
- Social or community features.
- Training plans, recommendations, or coaching.
- Gym integrations, route imports, wearables, or external data sources.
- Offline-first synchronization beyond what is required for a good mobile auth experience.

## Architecture

### Current decisions

- The system has two clients: Next.js web and Expo mobile.
- Both clients use Supabase’s public client configuration appropriate to their platform.
- Server-side/API authentication must validate the current session/token using trusted server-side mechanisms.
- Client-provided identity fields are treated as untrusted input.
- Environment variables must follow platform conventions: public variables only for values safe to ship to clients; private variables only on the server.

### Confirmed repository baseline

- The repository is a pnpm 10/Turborepo monorepo using strict TypeScript.
- `apps/web` is a Next.js 15 App Router app and owns the HTTP API and server-only Prisma access.
- `apps/mobile` is an Expo SDK 54/Expo Router iOS app and calls the web API; it never connects directly to PostgreSQL.
- `packages/domain`, `packages/validation`, `packages/api-client`, and `packages/config` own shared non-UI concerns.
- Supabase Auth is the identity source of truth; Prisma/PostgreSQL owns application data.
- `User.authProviderId` uniquely maps the application user to the Supabase user subject.
- The current API validates bearer tokens with Supabase and looks up the application user by `authProviderId`.
- The current API returns `403 ACCOUNT_NOT_PROVISIONED` if no matching Prisma user exists; Milestone 1 will replace this dead end with trusted first-request provisioning.
- The mobile Supabase client currently has `persistSession: false`; persistent mobile authentication is not implemented.
- Neither client currently has sign-in/sign-out UI or authenticated routing.
- Session start, active-session lookup, and session end API/service code already exists on `main`, despite the UI milestones not being implemented.

### Architectural direction

Keep authentication concerns behind small platform-specific client modules and a server-side authentication boundary. Avoid duplicating user-resolution logic across routes. Keep profile synchronization minimal: create or reconcile a local record only when required by existing application behavior, while leaving credentials and authentication lifecycle in Supabase.

## Domain model

### Current foundation

- **Supabase Auth User:** canonical authenticated identity, including provider-managed identifier and credentials/session state.
- **Local User/Profile:** application-owned record, if required by Prisma and existing features; it must reference the Supabase identity rather than replace it.

### Confirmed session model

- `Session` belongs to one application `User` and optionally one `Gym`.
- Gym association is optional. The initial active-session UI does not require a gym or depend on a populated gym directory.
- A session contains `startedAt`, nullable `endedAt`, optional notes, and child `SessionClimb` records.
- A session is active when `endedAt === null`.
- A user may have at most one active session; service logic and a partial unique PostgreSQL index enforce this.
- `SessionClimb` belongs to one session and stores grade system/value, attempts, and sent status.
- The first supported grade system is bouldering V-scale from `VB` through `V17`.
- Attempts must be an integer of at least one.
- Flash is derived as `sent && attempts === 1` and is not persisted.
- A permanent gym problem/route entity is explicitly deferred.

## UX principles

- Make the common action obvious and fast, especially on mobile.
- Prefer progressive disclosure over a large first-run form.
- Keep authentication states explicit: loading, signed out, signed in, and error.
- Preserve user trust with clear errors and no silent identity switching.
- Treat web and mobile as platform-appropriate experiences rather than forcing identical layouts.
- Make empty states useful and guide the next action.
- Avoid adding settings, profile management, or social surfaces before the core logging loop is understood.

## Milestones and roadmap

### Milestone 0 — Existing foundation

**Status:** Complete on `main`  
**Purpose:** Understand and preserve the current implementation before adding product behavior.

**Work items:**

- Confirm the monorepo/app layout and how web, mobile, and server code are started.
- Read and follow `AGENTS.md`, `README.md`, and relevant files under `docs/`.
- Identify the existing home screen, navigation, styling conventions, data layer, and test setup.
- Record any existing Prisma `User` or profile model without redesigning it.
- Verify that the app can run locally before beginning authentication work.

**Exit evidence:** PR #1 established the monorepo, web/mobile shells, shared packages, Prisma schema/migration, documentation, and CI. Full dependency-backed checks were not run in the original scaffold environment because package-registry access returned HTTP 403; this remains a baseline verification item for a registry-enabled local environment.

### Milestone 1 — Authentication foundation

**Status:** Partially implemented; next product milestone  
**Goal:** Establish one working identity system across web and mobile.

**Work items:**

- Configure platform-appropriate Supabase clients.
- Add email/password registration, sign-in, and sign-out.
- Add a post-registration “check your email” state and handle confirmed versus unconfirmed accounts clearly.
- Add forgot-password and set-new-password flows using Supabase recovery links.
- Add web callback/landing routes for email confirmation and password recovery, including local and deployed redirect configuration.
- Ensure mobile registration and recovery screens clearly explain that the emailed link opens in a browser and that the user can return to the app afterward.
- Handle initial auth loading, signed-out, signed-in, and error states.
- Persist and restore mobile sessions using the project’s established storage conventions.
- Route authenticated users to the existing home screen and unauthenticated users to sign-in.
- Establish a trusted server/API current-user boundary.
- Automatically provision the Prisma `User` record on the first authenticated request from a verified Supabase user.
- Make provisioning idempotent and derive `authProviderId` and email only from the verified Supabase identity, never from request body data.
- Update environment examples, Supabase setup instructions, and architecture documentation.

**Already present:** public Supabase environment conventions, web server-client helper, mobile client stub, bearer-token API authentication, Prisma user lookup by Supabase subject, and auth unit tests.

**Still missing:** browser client/auth UI, registration and password-recovery flows, mobile auth UI, mobile secure persistence, authenticated routing, sign-out flows, and first-request user provisioning.

**Out of scope:** Session logging, analytics, profile-management screens, social features, and unrelated refactors.

**Dependencies:** Supabase project credentials and a confirmed understanding of the existing web/mobile navigation and server boundaries.

**Exit criteria:** All Milestone 1 acceptance criteria pass on web and mobile, including restart persistence on mobile and proof that authorization does not rely on a client-supplied `userId`.

### Milestone 2 — Active-session vertical slice

**Status:** Backend partially implemented; product flow not started  
**Goal:** Let an authenticated user start, resume, and end one active climbing session.

**Work items:**

- Start a session without requiring gym selection; send `gymId: null` or omit it in the initial UI.
- Connect mobile and web clients to the existing start/get-active/end API methods.
- Design the mobile active-session screen around large targets, minimal typing, and one-handed use.
- Resume an existing active session when the app is reopened.
- Add clear states for no active session, active session, save/end progress, conflict, and recoverable failure.
- Offer optional session notes when ending a session, with a clear skip action.
- Extend the existing end-session input/service behavior to save notes; do not put a notes form in front of session startup.
- Record start and end times on the server when each action occurs.
- Display timestamps in the user’s local timezone without changing the stored instant.
- Defer manual timestamp correction to the session history/editing milestone.

**Out of scope:** Analytics, recommendations, gym integrations, route importing, and a comprehensive training taxonomy.

**Already present:** Prisma `Session` model, one-active-session database constraint, validation schemas, authorized service methods, API routes, shared client methods, and unit tests.

**Dependencies:** Completed Milestone 1 authentication/provisioning.

**Exit criteria:** A signed-in user can start a session with one primary action, close/reopen the app and resume it, and end it with optional notes or skip; a second active session is rejected; another user cannot read or end it.

### Milestone 3 — Climb logging inside an active session

**Status:** Planned, not started  
**Goal:** Let a climber record attempts and sends in a few seconds while at the wall.

**Work items:**

- Add authorized create-climb API/service behavior for an owned active session.
- Use the existing V-scale values and `attempts >= 1` validation.
- Implement one-shot climb logging after the climber finishes with a problem: select grade, set total attempts, mark sent/not sent, and save.
- Design that interaction for large touch targets, minimal typing, and completion in a few seconds.
- Show immediate save confirmation.
- Show running totals for climbs, sends, and attempts during the active session.
- Show a chronological list of the current session’s climbs with grade, attempts, and sent status.
- Let the user tap a listed climb to enter the lightweight correction flow.
- Prevent adding climbs to ended sessions and to another user’s session.
- Allow lightweight correction of climbs while the session is active, including fixing grade, total attempts, and sent status.
- Allow deletion of an accidentally logged or duplicate climb from the active-session correction screen, with explicit confirmation.
- Keep broader post-session correction and history management in Milestone 4.

**Out of scope:** Bulk import, offline conflict resolution, social sharing, and advanced editing workflows.

**Dependencies:** Working active-session flow and decisions about the core logging interaction.

**Exit criteria:** On mobile, a user can add a valid climb to their active session in a few seconds, receive clear feedback, see the result, correct an active-session entry, and confirm deletion of a mistaken entry; invalid attempts, ended sessions, and cross-user access are rejected.

## Platform delivery timeline

### iOS / Expo

- **Milestone 0 — complete:** Runnable Expo Router shell and Supabase client stub.
- **Milestone 1 — foundation:** Registration, sign-in, sign-out, secure session persistence, auth loading/error states, protected navigation, and browser-based verification/recovery instructions.
- **Milestone 2 — first session workflow:** One-tap session start, active-session resume after app restart, end-session flow, optional post-session notes, and local-time display.
- **Milestone 3 — first useful mobile alpha:** Fast one-shot climb logging during an active session, immediate feedback, and a compact view of logged climbs.
- **Milestone 4 — refinement:** Session history/detail access and correction behavior where mobile usage shows it is needed.

The iOS app becomes meaningfully testable in Milestone 1, supports a complete empty session lifecycle in Milestone 2, and reaches the core product promise in Milestone 3.

### Web / Next.js

- **Milestone 1:** Owns authentication landing/callback/recovery routes and provides the authenticated web shell.
- **Milestones 2–3:** Supports the API boundary and enough UI to exercise the same protected behavior, without copying the mobile interaction design.
- **Milestone 4 onward:** Becomes the primary session-history, detail, correction, and later insight experience.

### Milestone 4 — Session history and correction

**Status:** Planned, details to be refined  
**Goal:** Make the recorded history useful and trustworthy.

**Work items:**

- List a user’s sessions newest first.
- Show date, duration, total climbs, sends, total attempts, hardest grade sent, and a notes indicator on each history card.
- Add a compact session detail view.
- Support correction of session start time, end time, and notes.
- Support correction of individual climb grade, attempts, and sent status, plus confirmed climb deletion.
- Keep ended sessions ended; correction edits historical data and does not reopen a session as active.
- Support permanent deletion of an entire owned session, including its climbs, only after a clear confirmation explains what will be lost.
- Use the existing cascade relationship for session-climb removal; do not add trash, archive, or soft-delete infrastructure in this milestone.
- Fetch the 20 most recent sessions initially and provide an explicit “Load more” action for older history.
- Add empty, loading, end-of-history, and recoverable error states.
- Defer history filters and search until usage shows which controls are useful.

**Out of scope:** Trend analysis and coaching recommendations until the underlying history is reliable.

**Dependencies:** Real usage feedback from Milestone 3 and a decision on edit/delete semantics.

**Exit criteria:** Users can scan newest-first history cards with the agreed summary, open session details, correct timestamps/notes/climb records without reopening an ended session, and permanently delete an owned session after explicit confirmation, without seeing or modifying another user’s data.

### Milestone 5 — Basic review and lightweight insight

**Status:** Planned roadmap endpoint  
**Goal:** Help users learn from their history without turning the product into a full analytics platform.

**Scope:**

- Add a web-first, read-only “Last 30 days” summary.
- Show completed sessions, total logged climbs, sends, send rate, total attempts, hardest grade sent, and flash count.
- Compare each applicable metric with the immediately preceding 30-day period.
- Use local calendar presentation while calculating periods from consistently stored timestamps.
- Provide useful empty and insufficient-data states rather than misleading zero trends.
- Link summary values back to session history where that helps users verify the result.

**Metric definitions:**

- **Completed sessions:** owned sessions whose `endedAt` falls within the period.
- **Total climbs:** `SessionClimb` records belonging to sessions included in the period.
- **Sends:** included climbs where `sent === true`.
- **Send rate:** sends divided by total included climbs; display not available when no climbs were logged.
- **Total attempts:** sum of attempts across included climbs.
- **Hardest grade sent:** highest V-scale grade among included sent climbs; display not available when there were no sends.
- **Flash count:** included climbs where `sent && attempts === 1`; continue deriving rather than persisting flash.

**Dependencies:** Reliable corrected history from Milestone 4 and tests covering period boundaries, ownership, no-data behavior, V-scale ordering, and derived metrics.

**Out of scope:** Custom date ranges, advanced filters, predictions, coaching, goals, style/anti-style classification, medical or injury advice, leaderboards, and gamification.

**Exit criteria:** An authenticated user can open the web dashboard and understand their last 30 days versus the prior 30 days; every displayed metric follows the documented definition, handles no-data states correctly, and includes only that user’s authorized data.

### Post-roadmap exploration — Personal progress, style, and training reflection

**Status:** Documented future direction; not part of Milestones 0–5  
**Goal:** Help a climber understand their own development and make better training decisions from a trustworthy body of session history.

**Candidate user outcomes:**

- Understand whether climbing frequency and consistency are changing over time.
- See grade distribution, send rate, flash rate, and attempts-to-send trends.
- Develop an evidence-based picture of the climber’s preferred and strongest styles.
- Surface possible anti-styles where outcomes are consistently harder relative to the climber’s own baseline.
- Distinguish sessions focused on projecting, volume, technique, or general climbing if lightweight session labels prove useful.
- Set simple personal goals and review progress against the climber’s own history.
- Identify noteworthy changes without presenting correlation as coaching, medical advice, or proof of causation.
- Export personal data in a portable format.

**Possible smallest vertical slice:**

1. Add one documented progress view over a selectable time range.
2. Show session frequency, total climbs, sends, and grade distribution.
3. Explain every metric in plain language and make its calculation testable.
4. Let the user compare the selected range with the immediately preceding equivalent range.
5. Add one simple user-defined goal only if the underlying metric has proven useful.

#### Style and anti-style hypothesis

Style analysis would compare the climber only with their own history. It should not require a public leaderboard or claim to define the climber permanently.

The first style-analysis discovery should prioritize:

- movement character, initially centered on static versus dynamic climbing;
- wall angle, initially centered on slab versus overhang, with neutral/vertical or roof distinctions added only if useful;
- hold type, with the initial vocabulary still to be refined.

For hold character, the initial exploration will allow:

- one optional primary hold type;
- one optional secondary hold type for mixed problems;
- a small starting vocabulary of crimps, slopers, pinches, pockets, and jugs.

Hold tags must remain optional. The user should never have to classify every hold on a problem, and a missing tag means unknown rather than “no holds.”

These dimensions are exploratory and must not be added wholesale. The product should first test whether climbers can record them without making bouldering logging feel like a form. Physical-demand labels and broader movement taxonomies remain secondary ideas.

If style tagging is promoted, the app should save the core climb first and then offer an optional “add style details” action. Movement, angle, and hold tags must not block or slow the grade/attempts/sent save path. A user may enrich the entry immediately or leave it unclassified.

A future style view might distinguish:

- **preference:** styles the user chooses frequently;
- **strength:** styles with better outcomes relative to the user’s grade-adjusted baseline;
- **possible anti-style:** styles with repeated, meaningfully lower outcomes despite sufficient exposure;
- **insufficient data:** styles that should not be classified yet.

Important interpretation rules:

- Do not infer style or anti-style from grade, attempts, and sent status alone.
- Separate frequency of exposure from performance; rarely climbing slab does not prove slab is an anti-style.
- Require a minimum sample before presenting a conclusion.
- Explain what evidence produced each observation.
- Use tentative language and let the user disagree with or dismiss an observation.
- Treat tags as subjective unless they come from a trustworthy future gym/problem data source.

**Entry criteria:**

- Milestones 1–4 are stable and users can reliably create and correct session history.
- Real usage has produced enough history to evaluate which summaries are meaningful.
- Milestone 5 validates that users return to review basic insights.
- Metric definitions, missing-data behavior, time-zone handling, and grade aggregation rules are documented.
- The feature can provide value using the existing data or a narrowly justified schema addition.

**Non-goals unless separately promoted:**

- AI-generated coaching or training plans.
- Injury diagnosis, recovery guidance, or medical claims.
- Performance predictions presented as authoritative.
- Social comparison, public rankings, or leaderboards.
- Computer vision, hold detection, or route recognition.
- Wearable or health-platform integrations.

**Open questions for future discovery:**

- Which outcome matters most: consistency, grade progression, projecting efficiency, volume, or another measure?
- Which style dimensions are both meaningful and quick enough to record?
- Should frequently used style tags be suggested from recent choices without silently applying them?
- Does the initial hold vocabulary cover real usage, and should an “other/unsure” choice be available without creating uncontrolled free text?
- What minimum sample and grade adjustment are needed before describing a possible anti-style?
- How much history is needed before a trend is useful rather than noisy?
- Should goals be outcome-based, habit-based, or both?
- Are session labels worth the extra logging effort?
- Which insights belong on mobile versus the web review experience?

**Promotion rule:** Do not assign this work a milestone number until Milestone 5 is complete and actual usage identifies a specific progress question users repeatedly want answered.

### Future roadmap

The active roadmap ends when Milestone 5 is complete. Style/anti-style exploration and any integrations, advanced analytics, training support, offline-first behavior, or social features remain post-roadmap ideas. Each must be promoted into a newly numbered milestone with a user problem, smallest useful slice, acceptance criteria, and recorded decision before implementation.

## Acceptance criteria

### Milestone 1 acceptance criteria

- Web can initialize a Supabase client with only browser-safe public configuration.
- Expo can initialize a Supabase client with only mobile-safe public configuration.
- A new user can create an account with email/password on both platforms.
- Registration tells the user when email confirmation is required and how to continue.
- An unverified account cannot access protected product data or be treated as a fully provisioned application user.
- A user who follows a valid confirmation link can complete verification and then sign in.
- A user can sign in with email/password on both platforms.
- A user can request a password-reset email without the UI revealing whether an address is registered.
- A valid recovery link lets the user choose a new password.
- Expired, invalid, and already-used recovery links show a safe, useful error and a way to request another link.
- Confirmation and recovery links use approved web redirect URLs; Milestone 1 does not depend on an Expo/iOS deep link.
- A user can sign out on both platforms.
- Mobile restores an existing authenticated session after app restart, using the project’s established persistence conventions.
- Signed-in users reach the existing home screen.
- Signed-out users are directed to a minimal sign-in experience.
- Auth loading and auth errors have usable UI states.
- Server/API code can securely identify the authenticated user from verified auth context.
- The first authenticated request from a verified Supabase user creates the corresponding Prisma user automatically.
- Repeated or concurrent authenticated requests resolve to the same Prisma user without duplicate records.
- Provisioning derives identity and email from Supabase and rejects unverified users.
- No route or mutation trusts a client-supplied `userId` for authorization.
- No service-role key or server-only secret is exposed to browser or Expo bundles.
- `.env.example` documents every required variable and distinguishes public from private values.
- `README.md` contains exact Supabase project setup and local configuration instructions.
- `docs/architecture.md` is updated if the repository’s authentication architecture changes.
- Existing Milestone 0 behavior remains working.

## Risks and open decisions

| Item | Why it matters | Current position / next action |
|---|---|---|
| Supabase email changes after provisioning | Prisma currently requires a unique local email, which may drift from Supabase | Define whether authenticated requests synchronize verified email changes or a later account-setting flow owns synchronization |
| Web authentication shape | App Router can use cookie-based browser/server auth while mobile uses bearer tokens | Decide whether web needs API bearer calls, server actions/cookies, or a small combination |
| Expo storage and refresh behavior | Current client explicitly disables persistence | Select secure/native storage compatible with Supabase and Expo, then test restart and token refresh |
| Production web origin | Supabase needs an exact deployed origin for confirmation and recovery redirects | Choose the hosting environment/domain before production authentication setup; retain localhost for development |
| Future gym data source | The schema supports gyms, but there is no initial directory or maintenance workflow | Start Milestone 2 sessions without a gym and revisit selection/creation only after the core logging flow works |
| Session timestamp correction | Users may forget to start or end a session on time | Use server-authoritative timestamps in Milestone 2 and evaluate manual correction in Milestone 4 |
| Active-session correction interaction | Users need to fix recent logging mistakes without disrupting climbing | Tap a climb in the chronological active-session list to edit or confirm deletion |
| Existing session backend landed ahead of roadmap | Documentation and implementation status can drift | Treat it as partial Milestone 2 groundwork, not a completed user-facing milestone |
| Accidental session deletion | A session may contain meaningful history and many climb records | Require explicit confirmation that describes the cascade; defer archive/trash unless usage shows it is needed |
| Historical timestamp validation | Editing start/end times can create impossible durations or overlap expectations | Require `endedAt >= startedAt`, present local time, and store the corrected instants consistently |

## Running decision log

| Date | Decision | Status | Rationale / consequence |
|---|---|---|---|
| 2026-08-20 | Maintain a single living roadmap/design document for Codex reference | Current | Makes project context durable across implementation sessions |
| 2026-08-20 | Build authentication before session logging | Current | Establishes identity, ownership, and secure API boundaries first |
| 2026-08-20 | Use Supabase as the authentication source of truth | Current | Provides one identity system across web and mobile |
| 2026-08-20 | Keep Milestone 1 UI minimal and functional | Current | Prevents visual/product scope from delaying the foundation |
| 2026-08-20 | Do not commit speculative analytics, social, or integrations | Current | Preserves flexibility until core usage is validated |
| 2026-08-20 | Mobile is the primary active-session interface; web prioritizes review | Current | Matches `AGENTS.md` and avoids forcing identical cross-platform UX |
| 2026-08-20 | V-scale `VB`–`V17` is the initial grade system | Current | Already implemented in shared domain and validation packages |
| 2026-08-20 | Do not create permanent gym problem/route entities yet | Current | Keeps the MVP centered on session logging |
| 2026-08-20 | Allow self-service email/password account creation | Current | The product should be usable without an administrator manually creating each Supabase account |
| 2026-08-20 | Require email ownership verification before protected access | Current | Reduces fake or mistyped accounts and makes account recovery more dependable |
| 2026-08-20 | Provision the Prisma user on the first verified authenticated request | Current | Removes manual administration and webhook infrastructure while keeping Supabase as the trusted identity source |
| 2026-08-20 | Include email-based password recovery in Milestone 1 | Current | Public self-service accounts need a dependable recovery path |
| 2026-08-21 | Use web-hosted confirmation and recovery routes in Milestone 1 | Current | Provides one dependable email-link flow while deferring native deep-link configuration |
| 2026-08-21 | Do not require or surface gym selection in the initial active-session flow | Current | No gym network exists yet, and location should not block fast session startup |
| 2026-08-21 | Collect optional session notes when ending a session | Current | Most reflection happens after climbing, and startup should remain one tap |
| 2026-08-21 | Use server-authoritative start/end times and local-time display | Current | Keeps timestamps consistent across clients while avoiding premature editing complexity |
| 2026-08-21 | Use one-shot climb logging rather than tracking each attempt live | Current | Matches expected gym behavior and captures the required data with less interaction overhead |
| 2026-08-21 | Allow lightweight correction while a session is active | Current | Logging mistakes should be fixable immediately without requiring the later history workflow |
| 2026-08-21 | Keep personal progress and training reflection as a gated long-term milestone | Future candidate | It is a natural extension of trustworthy history but requires real usage and validated metric definitions first |
| 2026-08-21 | Explore climbing style and anti-style as a primary long-term insight | Future candidate | This directly answers a motivating user question but requires low-friction characteristic data and careful interpretation |
| 2026-08-21 | Prioritize static/dynamic movement, slab/overhang angle, and hold type for future style analysis | Future candidate | These dimensions best match the intended bouldering use case and the user’s idea of style |
| 2026-08-21 | Explore one primary and one optional secondary hold tag per climb | Future candidate | Supports mixed boulders while avoiding the burden of classifying every hold |
| 2026-08-21 | Collect future style details only after the core climb is saved | Future candidate | Preserves the fast logging path while allowing richer voluntary data |
| 2026-08-21 | Show active-session totals and a compact chronological climb list | Current | Provides enough feedback and correction access without turning active logging into an analytics screen |
| 2026-08-21 | Allow confirmed climb deletion during an active session | Current | Accidental and duplicate entries should be removable before they pollute session history |
| 2026-08-21 | Permanently delete confirmed sessions and cascade their climbs | Current | Keeps data management understandable while avoiding premature archive/soft-delete infrastructure |
| 2026-08-21 | Correct historical sessions without reopening them as active | Current | Users can repair timestamps, notes, and climb data while preserving a simple active/ended state model |
| 2026-08-21 | Use a compact newest-first session-history card | Current | Date, duration, climbs, sends, attempts, hardest send, and notes presence support fast review before opening details |
| 2026-08-21 | Load session history in pages of 20 with “Load more” | Current | Handles growing history simply while deferring filters and more complex pagination UI |
| 2026-08-21 | End the active roadmap at Milestone 5 | Current | Delivers authentication, core mobile logging, trustworthy history, and one useful insight layer before committing to longer-term expansion |
| 2026-08-21 | Make the first insight view a last-30-days web dashboard | Current | Provides understandable, testable value using existing session data and a prior-period comparison |

## Milestone refinement queue

Work through these decision gates in order. Add each resolved answer to the decision log and then revise the affected milestone.

1. Authentication — resolved for Milestone 1: self-service accounts, email verification, first-request Prisma provisioning, password recovery, and web-hosted email-link routes.
2. Active session — resolved for Milestone 2: no required gym, post-session optional notes, server-authoritative timestamps, and local-time display.
3. Climb logging — resolved for Milestone 3: one-shot logging, running totals, chronological climb list, tap-to-edit, and confirmed deletion during the active session.
4. History: edit/delete semantics, session summaries, and pagination needs.
   Resolved for Milestone 4: newest-first 20-session pages, compact summary cards, full correction scope, confirmed permanent deletion, and no reopening of ended sessions.
5. Insight — resolved for Milestone 5: web-first last-30-days summary versus the prior 30 days, using documented basic metrics. Stop the active roadmap after this milestone is complete.

### Decision-log template

| Date | Decision | Status | Rationale / consequence |
|---|---|---|---|
| YYYY-MM-DD |  | Proposed / Current / Superseded |  |

## Milestone working checklist

Before starting a milestone:

- Read `AGENTS.md` in full.
- Read `README.md` and relevant files under `docs/`.
- Inspect the current implementation and existing milestone output.
- Confirm this document’s scope and open decisions.
- Identify acceptance criteria and the smallest vertical slice.

Before marking a milestone complete:

- Verify the acceptance criteria.
- Update setup and architecture documentation.
- Record material decisions above.
- Record deferred work rather than silently expanding scope.
- Note tests run and any known limitations in the milestone’s implementation notes.
