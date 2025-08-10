/*
  Minimal seed: writes default assets and a hello signal for testing UI.
  Run: `npm run seed`
*/
import { getDb } from '../src/lib/firebaseAdmin';

async function main() {
  const db = getDb();
  const tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'];
  const batch = db.batch();
  for (const sym of tickers) {
    batch.set(db.collection('assets').doc(sym), { symbol: sym, createdAt: new Date().toISOString() }, { merge: true });
  }
  await batch.commit();
  console.log(`Seeded ${tickers.length} assets`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

