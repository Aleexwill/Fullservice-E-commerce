'use client';

import { useParams } from 'next/navigation';

export default function PresupuestoDetalle() {
  const { id } = useParams<{ id: string }>();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <iframe
        key={id}
        src={`/costos.html?id=${id}&_t=${id}`}
        style={{ flex: 1, width: '100%', border: 'none', display: 'block' }}
        title="Costos y Propuesta"
      />
    </div>
  );
}
