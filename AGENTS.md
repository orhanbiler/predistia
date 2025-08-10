AGENTS
======

Scope
-----
This document summarizes the agent-driven scaffold for Predistia, including architecture, conventions, and operational workflows.

What Was Added
--------------
- Next.js App Router scaffold under `src/app`.
- Firebase Admin for server-side Firestore in `src/lib/firebaseAdmin.ts`.
- Firebase Web SDK + Analytics for client in `src/lib/firebaseClient.ts` and `src/app/FirebaseAnalytics.tsx`.
- Postmark email utility in `src/lib/email.ts`.
- Alpha Vantage helpers for News + EOD in `src/lib/alphaVantage.ts`.
- Rule-based LLM fallback in `src/lib/llm.ts`.
- Cron API routes: `ingest`, `enrich`, `signals`, `email`.
- Backtest API route: `POST /api/backtest/run`.
- Metrics utilities for forward returns, hit-rate, Sharpe proxy, and confusion matrix.
- Dashboard and asset pages.
- Seed and backtest scripts.
- pnpm-friendly scripts including `typecheck`.

Data Model (Firestore)
----------------------
- `assets/{symbol}`
- `news/{newsId}`
- `incidents/{newsId}`
- `signals/{symbol}_{date}`
- `eod/{symbol}/bars/{date}`
- `metrics/{runId}` (optional future use)

Cron Flow
---------
1. ingest → pulls Alpha Vantage news + EOD, upserts Firestore.
2. enrich → classifies news into incidents (rules first; LLM optional).
3. signals → maps incidents to directional signals per symbol/date.
4. email → computes metrics (20d/60d) and emails daily summary.

Backtest
--------
- Endpoint recomputes forward returns from stored signals and EOD and returns aggregate metrics + confusion matrices per window.

Conventions
-----------
- Server-only code (Firebase Admin) in `src/lib/firebaseAdmin.ts` and server routes.
- Client-only code (Firebase web + analytics) in `src/lib/firebaseClient.ts` and a `use client` component.
- Idempotent writes: news, incidents, and signals checked before insert.
- TypeScript strict mode; `pnpm run typecheck` to surface type errors.

Next Steps
----------
- Add charts for asset/EOD visualization.
- Expand incident taxonomy and mappings.
- Optional: swap rule-based classifier with Gemini when cost guardrails are set.

