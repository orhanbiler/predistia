import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getPrivateKey(): string | undefined {
  const raw = process.env.FIREBASE_PRIVATE_KEY;
  if (!raw) return undefined;
  // Support keys provided with escaped \n
  return raw.includes('\n') ? raw : raw.replace(/\\n/g, '\n');
}

export function getDb() {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = getPrivateKey();

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing Firebase Admin env vars');
    }

    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
  const db = getFirestore();
  try {
    // Allow optional fields without writing explicit nulls
    // @ts-ignore - settings is available on Firestore admin client
    db.settings({ ignoreUndefinedProperties: true });
  } catch {
    // no-op if settings not supported in this runtime
  }
  return db;
}
