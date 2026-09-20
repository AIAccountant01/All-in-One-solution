"use client";

import { useEffect, useState } from "react";
import { completeGoogleOAuthReturn } from "@/lib/connectors/googleFit";

export default function GoogleOAuthReturnPage() {
  const [message, setMessage] = useState("Finishing Google Fit connection…");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const ok = await completeGoogleOAuthReturn();
        if (cancelled) return;
        if (ok) {
          setMessage("Google Fit connected. Returning to Helia…");
          window.location.replace("/#connections");
          return;
        }
        setMessage("Could not complete Google sign-in. Returning…");
      } catch {
        if (!cancelled) setMessage("Google sign-in failed. Returning…");
      }
      window.setTimeout(() => {
        window.location.replace("/#connections");
      }, 1800);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <p className="display text-2xl text-[var(--brand-deep)]">{message}</p>
    </main>
  );
}
