CLAUDE NOTES
============

Summary of Changes
------------------
- Scaffolded a minimal Next.js 14 app with TypeScript and App Router.
- Added Firebase Admin for server-side operations and Firestore access.
- Implemented Firebase Web SDK + Analytics on the client with provided configuration.
- Created ingestion, enrichment, signal generation, and email cron routes.
- Implemented backtest endpoint computing forward returns (20d/60d), hit-rate, average return, Sharpe proxy, and confusion matrix by incident type.
- Added utilities for Alpha Vantage, email (Postmark), and LLM-like rule-based classification.
- Introduced dashboard pages for signals and asset EOD views.
- Added scripts for seeding and local backtesting.
- Configured pnpm scripts including `typecheck` (alias `type-script`).

Important Files
---------------
- `src/lib/firebaseClient.ts` and `src/app/FirebaseAnalytics.tsx`: client init + analytics.
- `src/lib/firebaseAdmin.ts`: Firestore server access.
- `src/app/api/cron/*`: cron endpoints.
- `src/app/api/backtest/run/route.ts`: backtest metrics.
- `src/lib/returns.ts`: metrics engine.

How To Verify
-------------
1. Set `.env.local` with Firebase Admin creds, Alpha Vantage key, Postmark token, and `CRON_SECRET`.
2. `pnpm i && pnpm dev`.
3. Seed: `pnpm seed`.
4. Hit cron endpoints with `x-cron-secret` header.
5. Run `pnpm backtest` or `POST /api/backtest/run`.
6. Visit `/dashboard` and `/assets/AAPL`.

Notes
-----
- Analytics only initializes in the browser (guarded via `isSupported`).
- Forward return calculations prefer adjusted close when available.
- Idempotent upserts avoid duplicates for news/incidents/signals.

