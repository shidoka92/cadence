"use client";
import { useState } from "react";

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="font-mono text-[11px] text-acid underline text-left break-all"
    >
      {copied ? "Copié ✓" : url}
    </button>
  );
}
