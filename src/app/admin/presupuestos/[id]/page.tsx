'use client';

import { useParams } from 'next/navigation';

export default function PresupuestoDetalle() {
  const { id } = useParams<{ id: string }>();
  return (
    <iframe
      key={id}
      src={`/costos.html?id=${id}&_t=${id}`}
      style={{ width: '100%', height: '100vh', border: 'none', display: 'block' }}
      title="Costos y Propuesta"
    />
  );
}
