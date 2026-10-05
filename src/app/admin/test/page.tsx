'use client';

export default function TestPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <iframe
        src="/cronograma.html"
        style={{ flex: 1, width: '100%', border: 'none', display: 'block' }}
        title="Cronograma de Obra"
      />
    </div>
  );
}
