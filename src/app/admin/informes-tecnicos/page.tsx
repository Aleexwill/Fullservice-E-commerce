'use client';

export default function InformesTecnicosPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <iframe
        src="/informe-tecnico.html"
        style={{ flex: 1, width: '100%', border: 'none', display: 'block' }}
        title="Informes Técnicos"
      />
    </div>
  );
}
