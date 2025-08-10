"use client";
import { useEffect } from 'react';
import { getFirebaseApp, getFirebaseAnalytics } from '@/lib/firebaseClient';

export default function FirebaseAnalytics() {
  useEffect(() => {
    getFirebaseApp();
    getFirebaseAnalytics().catch(() => {});
  }, []);
  return null;
}

