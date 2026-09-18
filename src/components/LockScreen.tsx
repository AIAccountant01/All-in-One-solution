"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  isVaultConfigured,
  setupVault,
  unlockVault,
} from "@/lib/vault";

export function LockScreen({ onUnlocked }: { onUnlocked: () => void }) {
  const [configured, setConfigured] = useState(false);
  const [ready, setReady] = useState(false);
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setConfigured(isVaultConfigured());
    setReady(true);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (!configured) {
        if (pin.length < 4) throw new Error("Use at least 4 digits");
        if (pin !== confirm) throw new Error("PINs do not match");
        await setupVault(pin, 15);
        setConfigured(true);
      } else {
        await unlockVault(pin);
      }
      onUnlocked();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not unlock");
    } finally {
      setBusy(false);
      setPin("");
      setConfirm("");
    }
  }

  if (!ready) {
    return (
      <div className="mobile-stage">
        <div className="phone-shell grid place-items-center">
          <div className="text-center animate-pulse-ring px-8">
            <p className="display text-4xl brand-shimmer">Helia</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Securing vault…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-stage">
      <div className="phone-shell grid place-items-center px-6">
        <form
          onSubmit={onSubmit}
          className="panel w-full max-w-sm space-y-4 p-6 animate-rise"
        >
          <div>
            <p className="display text-3xl brand-shimmer">Helia</p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              {configured
                ? "Enter your PIN to unlock encrypted health data."
                : "Create a PIN to encrypt meals, labs, and vitals on this device."}
            </p>
          </div>

          <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            PIN
            <input
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              value={pin}
              onChange={(e) =>
                setPin(e.target.value.replace(/\D/g, "").slice(0, 8))
              }
              className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white/90 px-4 py-3 text-lg tracking-[0.35em]"
              placeholder="••••"
              required
            />
          </label>

          {!configured && (
            <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Confirm PIN
              <input
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                value={confirm}
                onChange={(e) =>
                  setConfirm(e.target.value.replace(/\D/g, "").slice(0, 8))
                }
                className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white/90 px-4 py-3 text-lg tracking-[0.35em]"
                placeholder="••••"
                required
              />
            </label>
          )}

          {error && (
            <p className="rounded-xl bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-2xl bg-[var(--brand)] py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Working…" : configured ? "Unlock" : "Create secure vault"}
          </button>

          <p className="text-[10px] leading-relaxed text-[var(--muted)]">
            PIN never leaves this device. Data is encrypted with AES-GCM.
            Auto-locks after 15 minutes of inactivity. Helia is a wellness app,
            not a medical device.
          </p>
        </form>
      </div>
    </div>
  );
}
