import { NextRequest } from 'next/server';

export function verifyCron(req: NextRequest) {
  // Check if this is a Vercel cron job request
  const authHeader = req.headers.get('authorization');
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return; // Valid Vercel cron request
  }
  
  // Otherwise check x-cron-secret header (for manual testing)
  const expected = process.env.CRON_SECRET;
  if (!expected) throw new Error('Missing CRON_SECRET');
  const got = req.headers.get('x-cron-secret');
  if (got !== expected) {
    const err = new Error('Unauthorized');
    // @ts-ignore
    err.status = 401;
    throw err;
  }
}

