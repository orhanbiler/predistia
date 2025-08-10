import { getDb } from '@/lib/firebaseAdmin';
import { EODBar } from '@/types/core';

export const dynamic = 'force-dynamic';

async function getEOD(symbol: string): Promise<EODBar[]> {
  const db = getDb();
  const snap = await db.collection('eod').doc(symbol).collection('bars').orderBy('date', 'desc').limit(120).get();
  const rows = snap.docs.map((d) => d.data() as EODBar).reverse();
  return rows;
}

export default async function AssetPage({ params }: { params: { symbol: string } }) {
  const { symbol } = params;
  const bars = await getEOD(symbol.toUpperCase());
  return (
    <main style={{ padding: 24 }}>
      <h1>{symbol.toUpperCase()}</h1>
      <p>Last {bars.length} trading days</p>
      <table cellPadding={6} cellSpacing={0} border={1}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Open</th>
            <th>High</th>
            <th>Low</th>
            <th>Close</th>
          </tr>
        </thead>
        <tbody>
          {bars.map((b) => (
            <tr key={b.date}>
              <td>{b.date}</td>
              <td>{b.open.toFixed(2)}</td>
              <td>{b.high.toFixed(2)}</td>
              <td>{b.low.toFixed(2)}</td>
              <td>{(b.adjClose ?? b.close).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

