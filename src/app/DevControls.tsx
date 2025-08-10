"use client";
import { useEffect } from 'react';
import { runIngest, runEnrich, runSignals, runEmail, runBacktest, runBackfill } from './actions';
import { toast } from '@/components/Toaster';
import { useFormState, useFormStatus } from 'react-dom';

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Working…' : children}
    </button>
  );
}

type ActionState = {
  ok: boolean;
  message?: string;
  error?: string;
} | null;

export default function DevControls() {
  const [ingestState, ingestAction] = useFormState(runIngest as any, null as ActionState);
  const [enrichState, enrichAction] = useFormState(runEnrich as any, null as ActionState);
  const [signalsState, signalsAction] = useFormState(runSignals as any, null as ActionState);
  const [emailState, emailAction] = useFormState(runEmail as any, null as ActionState);
  const [backtestState, backtestAction] = useFormState(runBacktest as any, null as ActionState);
  const [backfillState, backfillAction] = useFormState(runBackfill as any, null as ActionState);

  useEffect(() => {
    if (ingestState) toast(ingestState.ok ? ingestState.message || 'Ingest done' : ingestState.error || 'Ingest failed', ingestState.ok ? 'success' : 'error');
  }, [ingestState]);
  useEffect(() => {
    if (enrichState) toast(enrichState.ok ? enrichState.message || 'Enrich done' : enrichState.error || 'Enrich failed', enrichState.ok ? 'success' : 'error');
  }, [enrichState]);
  useEffect(() => {
    if (signalsState) toast(signalsState.ok ? signalsState.message || 'Signals done' : signalsState.error || 'Signals failed', signalsState.ok ? 'success' : 'error');
  }, [signalsState]);
  useEffect(() => {
    if (emailState) toast(emailState.ok ? emailState.message || 'Email sent' : emailState.error || 'Email failed', emailState.ok ? 'success' : 'error');
  }, [emailState]);
  useEffect(() => {
    if (backtestState) toast(backtestState.ok ? backtestState.message || 'Backtest done' : backtestState.error || 'Backtest failed', backtestState.ok ? 'success' : 'error');
  }, [backtestState]);
  useEffect(() => {
    if (backfillState) toast(backfillState.ok ? backfillState.message || 'Backfill done' : backfillState.error || 'Backfill failed', backfillState.ok ? 'success' : 'error');
  }, [backfillState]);

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <form action={ingestAction}><SubmitButton>Run Ingest</SubmitButton></form>
      <form action={enrichAction}><SubmitButton>Run Enrich</SubmitButton></form>
      <form action={signalsAction}><SubmitButton>Run Signals</SubmitButton></form>
      <form action={emailAction}><SubmitButton>Send Email</SubmitButton></form>
      <form action={backtestAction}><SubmitButton>Run Backtest</SubmitButton></form>
      <form action={backfillAction} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input type="number" name="daysBack" placeholder="daysBack" min={1} defaultValue={90} style={{ width: 100 }} />
        <input type="text" name="tickers" placeholder="e.g., AAPL,MSFT" style={{ width: 180 }} />
        <SubmitButton>Backfill</SubmitButton>
      </form>
    </div>
  );
}
