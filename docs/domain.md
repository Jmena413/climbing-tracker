# Domain model

The foundation defines `User`, `Gym`, `Session`, and `SessionClimb`. A user is linked to the Supabase identity by `authProviderId`; clients never choose the owning user ID.

A session is active when `endedAt` is null. Service logic in the session milestone must reject a second active session, while the initial PostgreSQL migration also supplies a partial unique index as protection against races.

A climb stores a grading system and value separately. The first supported system is the V-scale (`VB` through `V17`), but the persistence model does not assume it is the only possible system. Attempts must be an integer of at least one; validation and the database check enforce this. Flash is not persisted and is derived as `sent && attempts === 1`.
