/*
  Minimal backtest: recompute metrics for stored signals using stored EOD.
  Run: `npm run backtest`
*/
import { getDb } from '../src/lib/firebaseAdmin';
import { computeForwardReturnsForSignals, aggregateMetrics, confusionByIncident } from '../src/lib/returns';
import { EODBar, Signal } from '../src/types/core';

async function main() {
  const windows = [20, 60];
  const db = getDb();
  const sigSnap = await db.collection('signals').orderBy('date', 'asc').limit(1000).get();
  const signals: Signal[] = sigSnap.docs.map((d) => d.data() as Signal);
  const symbols = Array.from(new Set(signals.map((s) => s.symbol)));
  const eodBySymbol: Record<string, EODBar[]> = {};
  for (const sym of symbols) {
    const barsSnap = await db.collection('eod').doc(sym).collection('bars').orderBy('date', 'asc').get();
    eodBySymbol[sym] = barsSnap.docs.map((b) => b.data() as EODBar);
  }
  const forwards = computeForwardReturnsForSignals({ signals, eodBySymbol, windows });
  for (const w of windows) {
    const m = aggregateMetrics(forwards, w);
    console.log(`Window ${w}d:`, m);
    const conf = confusionByIncident(forwards, w);
    console.table(conf);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

