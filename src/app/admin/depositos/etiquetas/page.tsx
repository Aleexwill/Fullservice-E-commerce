'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { ArrowLeft, Printer } from 'lucide-react';
import type { Dep, Item } from '@/components/admin/depositos/comun';

/** Etiquetas con QR para pegar en estantes y cajas. El QR abre el artículo en el sistema (con sesión iniciada). */
export default function Etiquetas() {
  const [deps, setDeps] = useState<Dep[]>([]);
  const [dep, setDep] = useState('');
  const [items, setItems] = useState<(Item & { qr: string })[] | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => { fetch('/api/depositos').then(r => r.json()).then(j => Array.isArray(j) && setDeps(j)).catch(() => {}); }, []);
  useEffect(() => {
    setItems(null);
    fetch(`/api/depositos/items${dep ? `?depositoId=${dep}` : ''}`).then(r => r.json()).then(async (j: Item[]) => {
      if (!Array.isArray(j)) return setErr('Error al cargar');
      const base = window.location.origin;
      setItems(await Promise.all(j.map(async i => ({ ...i, qr: await QRCode.toDataURL(`${base}/admin/depositos?item=${i.id}`, { margin: 1, width: 240, errorCorrectionLevel: 'M' }) }))));
    }).catch(() => setErr('Error al cargar'));
  }, [dep]);

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <Link href="/admin/depositos" className="mb-2 inline-flex items-center gap-1 text-caption text-steel-400 hover:text-arctic"><ArrowLeft className="h-3 w-3" />Depósitos</Link>
          <h1 className="font-display text-h1 text-arctic">Etiquetas QR</h1>
          <p className="font-body text-body-sm text-steel-400">Imprimí las etiquetas y pegalas en el estante o la caja. Con "Escanear QR" se abre el artículo para registrar una entrada, salida o traslado.</p>
        </div>
        <div className="flex gap-2"><label htmlFor="e-d" className="sr-only">Depósito</label><select id="e-d" value={dep} onChange={e => setDep(e.target.value)} className="input text-base sm:text-sm"><option value="">Todos los depósitos</option>{deps.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}</select><button onClick={() => window.print()} className="btn-primary inline-flex min-h-[44px] items-center gap-2"><Printer className="h-4 w-4" />Imprimir</button></div>
      </div>
      {err && <p role="alert" className="text-danger-bright">{err}</p>}
      {items === null && !err && <p className="text-steel-400">Generando…</p>}
      {items?.length === 0 && <p className="text-steel-400">No hay artículos.</p>}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-3 print:gap-2">
        {items?.map(i => (
          <li key={i.id} className="break-inside-avoid rounded-lg border border-steel-700 bg-white p-2 text-center text-black print:border-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={i.qr} alt={`QR de ${i.nombre}`} className="mx-auto h-32 w-32" />
            <p className="mt-1 truncate text-sm font-semibold">{i.nombre}</p>
            <p className="truncate text-xs">{[i.codigo, i.deposito, i.ubicacion].filter(Boolean).join(' · ')}</p>
          </li>))}
      </ul>
    </div>
  );
}
