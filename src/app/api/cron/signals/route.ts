import { NextRequest, NextResponse } from 'next/server';
import { verifyCron } from '@/lib/cron';
import { getDb } from '@/lib/firebaseAdmin';
import { Incident, Signal } from '@/types/core';

export const runtime = 'nodejs';

function directionForType(t: string): 'long' | 'short' {
  // Simple mapping; can be refined
  if (['earnings_beat', 'upgrade', 'guidance_raise', 'mna'].includes(t)) return 'long';
  if (['earnings_miss', 'downgrade', 'guidance_cut', 'lawsuit', 'regulatory', 'product_recall', 'layoffs', 'security_breach'].includes(t)) return 'short';
  return 'long';
}

export async function POST(req: NextRequest) {
  try {
    verifyCron(req);
    const db = getDb();
    const { limit = 200 } = await req.json().catch(() => ({}));
    const incSnap = await db.collection('incidents').orderBy('date', 'desc').limit(limit).get();
    let created = 0;
    for (const d of incSnap.docs) {
      const inc = d.data() as Incident;
      const date = inc.date;
      const type = inc.type;
      const dir = directionForType(type);
      for (const symbol of inc.symbols || []) {
        const id = `${symbol}_${date}`;
        const ref = db.collection('signals').doc(id);
        const exists = await ref.get();
        if (exists.exists) continue; // idempotent
        const sig: Signal = { id, symbol, date, incidentType: type, direction: dir, strength: inc.score };
        await ref.set(sig, { merge: true });
        created += 1;
      }
    }
    return NextResponse.json({ ok: true, created });
  } catch (e: any) {
    const status = e?.status || 500;
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status });
  }
}

