"use client";

import { useEffect, useState } from "react";
import { captureGoogleOAuthHash } from "@/lib/connectors/googleFit";

export default function GoogleOAuthReturnPage() {
  const [message, setMessage] = useState("Finishing Google Fit connection…");

  useEffect(() => {
    const ok = captureGoogleOAuthHash();
    if (ok) {
      setMessage("Google Fit connected. Returning to Helia…");
      window.location.replace("/#connections");
      return;
    }
    setMessage("Could not complete Google sign-in. Returning…");
    const t = window.setTimeout(() => {
      window.location.replace("/#connections");
    }, 1600);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <p className="display text-2xl text-[var(--brand-deep)]">{message}</p>
    </main>
  );
}
