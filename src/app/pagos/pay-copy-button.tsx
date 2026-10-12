'use client';

import { useState } from 'react';
import { Copy, CheckCircle2 } from 'lucide-react';

export function PayCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => null);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copiar número de cuenta"
      className="rounded p-0.5 text-[#8094B4] transition hover:text-[#2D8FCC]"
    >
      {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}
