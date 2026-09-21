'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function PresupuestoDetalle() {
  const { id } = useParams<{ id: string }>();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#0f1117', borderBottom: '1px solid #1e2230' }}>
        <Link href="/admin/presupuestos" style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none' }}>← Presupuestos</Link>
        <span style={{ color: '#1e2230' }}>|</span>
        <a href={`/informe-tecnico.html?presupuesto=${id}`} target="_blank" rel="noreferrer"
          style={{ fontSize: 12, color: '#60a5fa', textDecoration: 'none' }}>
          Informe técnico ↗
        </a>
      </div>
      <iframe
        key={id}
        src={`/costos.html?id=${id}&_t=${id}`}
        style={{ flex: 1, width: '100%', border: 'none', display: 'block' }}
        title="Costos y Propuesta"
      />
    </div>
  );
}
