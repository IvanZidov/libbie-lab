# Architecture

Next.js App Router + React + TypeScript + Zod, using Node 24's built-in SQLite driver. SQLite is behind `src/repository.ts`; the native driver keeps the local runtime small. This is a local Node application, not a Cloudflare/Sites deployment.

`src/domain.ts` contains deterministic, visible-prefix extraction, compatibility export, search interpretation, canonical filtering, style comparison and next-action rules. The rules cover the bundled English fixtures and selected continuations; they are deliberately not presented as a general-language model.

`src/service.ts` validates commands, resolves every record against workspace `demo`, enforces revisions and contact policy, and persists mutations. `src/repository.ts` applies `migrations/001_initial.sql`, imports the bundle idempotently, and provides synchronous transactions. Typed records are stored as JSON with kind/workspace indexes, conversation-revision and job-status indexes, plus foreign-key relationship records. Message history lives inside each conversation aggregate, with immutable message IDs, timestamps and idempotency keys. Snapshot, correction, feedback, annotation, property-version, search, dataset, evaluation, model-call and promotion histories are separate append-only records. Current leads, jobs and the active version pointer are mutable aggregates.

`src/jobs.ts` claims persisted work with a 90-second lease. A queued scripted batch performs at most one broker/client pair per worker tick. Next.js `after()` performs work after a request, and the UI polls queued/running jobs. Restart recovery occurs on the next page request. Pause is checked between turns and before live append. `src/models.ts` implements the Responses gateway with server-only credentials and role-specific input builders. Generated text never has direct database/tool access.

`src/evaluation.ts` replays frozen opening messages against both deterministic versions and saves references, results, failed assertions, field counts, source/inventory hashes, exposure and gate status. Human annotations never overwrite fixture expected values. `src/legacy.ts` recomputes legacy agreement from the original CSV with normalized unordered area sets and empty-vs-zero numeric parsing.

## API

The local prototype exposes one validated command endpoint:

- `GET /api/action?view=Workspace|Improve|Settings` returns public state. Frozen labels, opening proposals and stored reports are only included for the `Improve` view. Private simulator persona and scripted future text are excluded.
- `POST /api/action` accepts `{action, key, leadId?, expectedRevision?, data}` and returns `{ok:true,data}` or `{ok:false,error}`. Revision conflicts return HTTP 409. Same-origin browser mutation checks reject cross-origin posts.
- Supported actions: message, saveDraft, draft, brief, search, correct, feedback, start, pause, reset, clock, step, batch, retry, generate, review, evaluate, promote, rollback, enrich, propertyUpdate.

Mutation keys are stored transactionally with results. A repeated completed request returns the original response. Revision-sensitive operations require the current conversation revision. New messages reprocess the whole visible prefix and active corrections synchronously. Live output commits only against its starting revision. Corrections invalidate approved briefs; listing changes invalidate displayed shortlists and supersede old enrichment. Search traces preserve the original inventory snapshot and approved assumptions.

## Scope of isolation

One configured workspace, one trusted local operator, loopback binding. There is no authentication or claim of multi-tenant security. The exclusion fixture tests scoped record lookup, not enterprise authorization. Do not expose the server publicly without authentication and a deployment-appropriate persistence design.
