'use client';

export default function AgendaPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <iframe
        src="/tablero.html"
        style={{ flex: 1, width: '100%', border: 'none', display: 'block' }}
        title="Agenda de Trabajo"
      />
    </div>
  );
}
