import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Full Service & Clean — Mantenimiento · Construcción · Metalúrgica';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'flex-end', padding: '60px 72px',
          background: 'linear-gradient(135deg, #0B1120 0%, #0f2040 60%, #102331 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Accent line top */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(90deg, #2D8FCC, #E8862B, #2D8FCC)', display: 'flex' }} />

        {/* Glow blobs */}
        <div style={{ position: 'absolute', top: -80, left: -80, width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, #2D8FCC22, transparent 70%)', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, #E8862B18, transparent 70%)', display: 'flex' }} />

        {/* Logo area */}
        <div style={{ position: 'absolute', top: 52, left: 72, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: '#2D8FCC22', border: '1px solid #2D8FCC44', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 28, height: 28, background: '#2D8FCC', borderRadius: 4, display: 'flex' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#ffffff', fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>Full Service & Clean</span>
            <span style={{ color: '#6FC3F5', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase' }}>Paraguay</span>
          </div>
        </div>

        {/* Main text */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span style={{ color: '#7CC4EF', fontSize: 18, fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase' }}>Soluciones integrales</span>
          <h1 style={{ color: '#ffffff', fontSize: 72, fontWeight: 800, lineHeight: 1, margin: 0, letterSpacing: -2 }}>
            Mantenimiento<br />Construcción &amp;<br />
            <span style={{ color: '#E8862B' }}>Metalúrgica</span>
          </h1>
          <p style={{ color: '#8094B4', fontSize: 22, margin: 0, marginTop: 8 }}>
            Ysapy casi Yasy · Lambaré, Paraguay
          </p>
        </div>

        {/* Pills */}
        <div style={{ display: 'flex', gap: 12, marginTop: 36 }}>
          {['Presupuesto sin cargo', 'Respuesta en 24 h', '8+ años de experiencia'].map((t) => (
            <div key={t} style={{ padding: '8px 18px', borderRadius: 99, border: '1px solid #2D8FCC44', background: '#2D8FCC15', color: '#7CC4EF', fontSize: 16, display: 'flex' }}>{t}</div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
