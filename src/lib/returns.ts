import { EODBar, ForwardReturn, IncidentType, Signal } from '@/types/core';

export function computeForwardReturnsForSignals(args: {
  signals: Signal[];
  eodBySymbol: Record<string, EODBar[]>;
  windows: number[]; // e.g., [20, 60]
}): ForwardReturn[] {
  const out: ForwardReturn[] = [];
  for (const s of args.signals) {
    const series = args.eodBySymbol[s.symbol];
    if (!series || !series.length) continue;
    const idx = series.findIndex((b) => b.date >= s.date);
    if (idx < 0) continue;
    for (const w of args.windows) {
      const j = idx + w;
      if (j >= series.length) continue;
      const start = series[idx].adjClose ?? series[idx].close;
      const end = series[j].adjClose ?? series[j].close;
      if (!start || !end) continue;
      const raw = (end - start) / start;
      const ret = s.direction === 'short' ? -raw : raw;
      out.push({
        symbol: s.symbol,
        signalDate: s.date,
        fwdDays: w,
        return: ret,
        incidentType: s.incidentType as IncidentType,
      });
    }
  }
  return out;
}

export function aggregateMetrics(forwards: ForwardReturn[], window: number) {
  const win = forwards.filter((f) => f.fwdDays === window).map((f) => f.return);
  const n = win.length;
  if (!n) return { windowDays: window, count: 0, hitRate: 0, avgReturn: 0, stdReturn: 0, sharpeProxy: 0 };
  const mean = win.reduce((a, b) => a + b, 0) / n;
  const variance = win.reduce((a, b) => a + (b - mean) * (b - mean), 0) / n;
  const std = Math.sqrt(variance);
  const hits = win.filter((v) => v > 0).length / n;
  const sharpe = std ? mean / std : 0;
  return { windowDays: window, count: n, hitRate: hits, avgReturn: mean, stdReturn: std, sharpeProxy: sharpe };
}

export function confusionByIncident(forwards: ForwardReturn[], window: number) {
  const byType = new Map<IncidentType, { positive: number; negative: number }>();
  for (const f of forwards) {
    if (f.fwdDays !== window) continue;
    const row = byType.get(f.incidentType) || { positive: 0, negative: 0 };
    if (f.return > 0) row.positive += 1; else row.negative += 1;
    byType.set(f.incidentType, row);
  }
  return Array.from(byType.entries()).map(([incidentType, { positive, negative }]) => ({ incidentType, positive, negative }));
}

