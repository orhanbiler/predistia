import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';
import { computeForwardReturnsForSignals, aggregateMetrics, confusionByIncident } from '@/lib/returns';
import { EODBar, Signal } from '@/types/core';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const { windows = [20, 60], limit = 1000 } = await req.json().catch(() => ({}));
    const sigSnap = await db.collection('signals').orderBy('date', 'asc').limit(limit).get();
    const signals: Signal[] = sigSnap.docs.map((d) => d.data() as Signal);
    const symbols = Array.from(new Set(signals.map((s) => s.symbol)));

    const eodBySymbol: Record<string, EODBar[]> = {};
    for (const sym of symbols) {
      const barsSnap = await db.collection('eod').doc(sym).collection('bars').orderBy('date', 'asc').get();
      eodBySymbol[sym] = barsSnap.docs.map((b) => b.data() as EODBar);
    }

    const forwards = computeForwardReturnsForSignals({ signals, eodBySymbol, windows });
    const metrics = windows.map((w: number) => aggregateMetrics(forwards, w));
    const confusions = windows.map((w: number) => ({ window: w, rows: confusionByIncident(forwards, w) }));

    return NextResponse.json({ ok: true, metrics, confusions, count: forwards.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}

