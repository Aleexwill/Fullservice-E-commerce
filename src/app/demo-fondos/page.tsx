'use client';

import { useState } from 'react';
import Link from 'next/link';

const intensityMap = {
  suave: { glow: 0.28, grid: 0.1, speed: 18 },
  medio: { glow: 0.42, grid: 0.16, speed: 12 },
  intenso: { glow: 0.58, grid: 0.24, speed: 8 },
};

type Intensity = keyof typeof intensityMap;

function DemoContent() {
  return (
    <div className="demo-copy">
      <span className="demo-kicker">FULLSERVICE</span>
      <h2>Soluciones que construyen confianza.</h2>
      <p>
        Un ejemplo de cómo se vería el contenido real de la página pública sobre un fondo animado.
      </p>
      <div className="demo-actions">
        <button>Solicitar presupuesto</button>
        <span>Ver servicios →</span>
      </div>
    </div>
  );
}

export default function DemoFondosPage() {
  const [intensity, setIntensity] = useState<Intensity>('suave');
  const [showGrid, setShowGrid] = useState(true);
  const config = intensityMap[intensity];

  return (
    <main
      className="demo-page"
      style={
        {
          '--glow-opacity': config.glow,
          '--grid-opacity': showGrid ? config.grid : 0,
          '--anim-speed': `${config.speed}s`,
        } as React.CSSProperties
      }
    >
      <div className="demo-toolbar-wrap">
        <div className="demo-toolbar">
          <div>
            <span className="demo-label">Laboratorio visual</span>
            <h1>Fondos animados para la web pública</h1>
          </div>
          <div className="demo-controls">
            <div className="demo-control-group" aria-label="Intensidad de la animación">
              {(['suave', 'medio', 'intenso'] as Intensity[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setIntensity(level)}
                  className={intensity === level ? 'is-active' : ''}
                >
                  {level}
                </button>
              ))}
            </div>
            <button className="demo-grid-toggle" onClick={() => setShowGrid((value) => !value)}>
              Malla {showGrid ? 'activa' : 'oculta'}
            </button>
            <Link href="/">Volver al inicio</Link>
          </div>
        </div>
      </div>

      <section className="demo-list">
        <article className="demo-card demo-aurora">
          <div className="demo-bg demo-bg-aurora" />
          <span className="demo-number">01</span>
          <DemoContent />
          <div className="demo-caption">
            <strong>Aurora / luces difusas</strong>
            <span>Premium, moderna y muy liviana visualmente.</span>
          </div>
        </article>

        <article className="demo-card demo-blueprint">
          <div className="demo-bg demo-bg-blueprint" />
          <span className="demo-number">02</span>
          <DemoContent />
          <div className="demo-caption">
            <strong>Malla técnica</strong>
            <span>Inspirada en planos, ingeniería y construcción.</span>
          </div>
        </article>

        <article className="demo-card demo-combo">
          <div className="demo-bg demo-bg-combo" />
          <span className="demo-number">03</span>
          <DemoContent />
          <div className="demo-caption">
            <strong>Malla + aurora</strong>
            <span>La opción que mejor combina con la identidad de Fullservice.</span>
          </div>
        </article>

        <article className="demo-card demo-parallax">
          <div className="demo-bg demo-bg-parallax">
            <span className="shape shape-a" />
            <span className="shape shape-b" />
            <span className="shape shape-c" />
          </div>
          <span className="demo-number">04</span>
          <DemoContent />
          <div className="demo-caption">
            <strong>Profundidad industrial</strong>
            <span>Capas geométricas lentas con sensación de parallax.</span>
          </div>
        </article>
      </section>

      <style jsx>{`
        .demo-page {
          min-height: 100vh;
          background: #070c16;
          color: #fff;
          padding-bottom: 6rem;
        }

        .demo-toolbar-wrap {
          position: sticky;
          top: 0;
          z-index: 50;
          border-bottom: 1px solid rgba(255,255,255,.08);
          background: rgba(7,12,22,.84);
          backdrop-filter: blur(16px);
        }

        .demo-toolbar {
          max-width: 1240px;
          margin: 0 auto;
          padding: 1.1rem 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .demo-label,
        .demo-kicker {
          display: block;
          font-size: .69rem;
          font-weight: 700;
          letter-spacing: .14em;
          text-transform: uppercase;
          color: #4fb9ec;
        }

        .demo-toolbar h1 {
          margin: .25rem 0 0;
          font-size: clamp(1.1rem, 2vw, 1.5rem);
          line-height: 1.2;
        }

        .demo-controls {
          display: flex;
          gap: .6rem;
          flex-wrap: wrap;
          justify-content: flex-end;
          align-items: center;
        }

        .demo-control-group {
          display: flex;
          padding: .22rem;
          border: 1px solid rgba(255,255,255,.1);
          background: rgba(255,255,255,.04);
          border-radius: 999px;
        }

        .demo-control-group button,
        .demo-grid-toggle,
        .demo-controls a {
          border: 0;
          color: #c7d2e4;
          background: transparent;
          cursor: pointer;
          border-radius: 999px;
          padding: .55rem .8rem;
          font-size: .78rem;
          text-decoration: none;
        }

        .demo-control-group button.is-active {
          color: #fff;
          background: #257da8;
        }

        .demo-grid-toggle,
        .demo-controls a {
          border: 1px solid rgba(255,255,255,.12);
        }

        .demo-list {
          max-width: 1240px;
          margin: 0 auto;
          padding: 2rem 1.25rem 0;
          display: grid;
          gap: 1.4rem;
        }

        .demo-card {
          position: relative;
          min-height: 520px;
          overflow: hidden;
          border-radius: 28px;
          border: 1px solid rgba(255,255,255,.09);
          background: #08111f;
          isolation: isolate;
          box-shadow: 0 30px 90px rgba(0,0,0,.28);
        }

        .demo-bg,
        .demo-card::after {
          position: absolute;
          inset: 0;
        }

        .demo-card::after {
          content: '';
          z-index: -1;
          background: linear-gradient(90deg, rgba(5,11,20,.88) 0%, rgba(5,11,20,.68) 42%, rgba(5,11,20,.18) 100%);
          pointer-events: none;
        }

        .demo-number {
          position: absolute;
          top: 1.5rem;
          right: 1.7rem;
          font-size: .72rem;
          letter-spacing: .14em;
          color: rgba(255,255,255,.45);
          z-index: 2;
        }

        .demo-copy {
          position: relative;
          z-index: 2;
          max-width: 650px;
          padding: clamp(3rem, 7vw, 6.5rem) clamp(1.4rem, 6vw, 5.5rem);
        }

        .demo-copy h2 {
          margin: .9rem 0 1.2rem;
          max-width: 720px;
          font-size: clamp(2.5rem, 6.4vw, 5.8rem);
          line-height: .96;
          letter-spacing: -.045em;
          text-wrap: balance;
        }

        .demo-copy p {
          max-width: 550px;
          color: #aab8cc;
          font-size: clamp(1rem, 1.5vw, 1.15rem);
          line-height: 1.7;
        }

        .demo-actions {
          margin-top: 2rem;
          display: flex;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .demo-actions button {
          border: 0;
          border-radius: 10px;
          background: #e67b22;
          color: white;
          padding: .92rem 1.25rem;
          font-weight: 700;
        }

        .demo-actions span {
          color: #d5deeb;
          font-size: .9rem;
        }

        .demo-caption {
          position: absolute;
          z-index: 3;
          right: 1.5rem;
          bottom: 1.3rem;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          text-align: right;
        }

        .demo-caption strong {
          font-size: .9rem;
        }

        .demo-caption span {
          margin-top: .2rem;
          max-width: 320px;
          color: rgba(255,255,255,.55);
          font-size: .74rem;
        }

        .demo-bg-aurora {
          z-index: -2;
          background:
            radial-gradient(circle at 72% 32%, rgba(35,145,210,var(--glow-opacity)) 0%, transparent 30%),
            radial-gradient(circle at 88% 70%, rgba(236,125,34,calc(var(--glow-opacity) * .75)) 0%, transparent 25%),
            radial-gradient(circle at 54% 80%, rgba(30,76,136,calc(var(--glow-opacity) * .7)) 0%, transparent 28%),
            #08111f;
          background-size: 120% 120%, 130% 130%, 140% 140%, auto;
          animation: aurora var(--anim-speed) ease-in-out infinite alternate;
        }

        .demo-bg-blueprint {
          z-index: -2;
          opacity: 1;
          background-color: #08111f;
          background-image:
            linear-gradient(rgba(92,184,230,var(--grid-opacity)) 1px, transparent 1px),
            linear-gradient(90deg, rgba(92,184,230,var(--grid-opacity)) 1px, transparent 1px),
            linear-gradient(120deg, transparent 0 44%, rgba(66,158,204,.16) 44.2% 44.5%, transparent 44.7% 100%);
          background-size: 42px 42px, 42px 42px, 260px 260px;
          animation: blueprint calc(var(--anim-speed) * 1.6) linear infinite;
        }

        .demo-bg-combo {
          z-index: -2;
          background:
            linear-gradient(rgba(92,184,230,var(--grid-opacity)) 1px, transparent 1px),
            linear-gradient(90deg, rgba(92,184,230,var(--grid-opacity)) 1px, transparent 1px),
            radial-gradient(circle at 75% 30%, rgba(37,125,168,var(--glow-opacity)) 0%, transparent 30%),
            radial-gradient(circle at 90% 74%, rgba(230,123,34,calc(var(--glow-opacity) * .8)) 0%, transparent 23%),
            #07101e;
          background-size: 48px 48px, 48px 48px, 130% 130%, 120% 120%, auto;
          animation: combo var(--anim-speed) ease-in-out infinite alternate;
        }

        .demo-bg-parallax {
          z-index: -2;
          background:
            radial-gradient(circle at 80% 40%, rgba(37,125,168,calc(var(--glow-opacity) * .7)), transparent 35%),
            linear-gradient(145deg, #08111f 0%, #0b1728 55%, #08101c 100%);
        }

        .shape {
          position: absolute;
          border: 1px solid rgba(86,169,210,.17);
          background: rgba(37,125,168,.05);
          transform: rotate(32deg);
          animation: drift var(--anim-speed) ease-in-out infinite alternate;
        }

        .shape-a {
          width: 420px;
          height: 420px;
          top: -150px;
          right: 4%;
        }

        .shape-b {
          width: 280px;
          height: 280px;
          top: 36%;
          right: 18%;
          animation-delay: -3s;
        }

        .shape-c {
          width: 180px;
          height: 180px;
          right: 5%;
          bottom: -50px;
          animation-delay: -6s;
        }

        @keyframes aurora {
          0% { background-position: 0% 0%, 100% 100%, 40% 100%, 0 0; transform: scale(1); }
          100% { background-position: 14% 10%, 82% 84%, 58% 74%, 0 0; transform: scale(1.035); }
        }

        @keyframes blueprint {
          from { background-position: 0 0, 0 0, 0 0; }
          to { background-position: 42px 42px, 42px 42px, 260px 130px; }
        }

        @keyframes combo {
          0% { background-position: 0 0, 0 0, 0% 0%, 100% 100%, 0 0; }
          100% { background-position: 24px 24px, 24px 24px, 18% 12%, 83% 84%, 0 0; }
        }

        @keyframes drift {
          0% { transform: translate3d(0,0,0) rotate(32deg); }
          100% { transform: translate3d(-42px,34px,0) rotate(37deg); }
        }

        @media (max-width: 780px) {
          .demo-toolbar {
            align-items: flex-start;
            flex-direction: column;
          }

          .demo-controls {
            justify-content: flex-start;
          }

          .demo-card {
            min-height: 620px;
          }

          .demo-card::after {
            background: linear-gradient(180deg, rgba(5,11,20,.86) 0%, rgba(5,11,20,.7) 66%, rgba(5,11,20,.42) 100%);
          }

          .demo-caption {
            left: 1.4rem;
            right: 1.4rem;
            bottom: 1.2rem;
            align-items: flex-start;
            text-align: left;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .demo-bg,
          .shape {
            animation: none !important;
          }
        }
      `}</style>
    </main>
  );
}
