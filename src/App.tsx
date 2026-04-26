import { useState } from 'react';
import { TemplatePicker } from './features/template-picker/TemplatePicker';
import { CardEditor } from './features/card-editor/CardEditor';

type Phase = { kind: 'pick' } | { kind: 'edit'; slug: string };

export default function App() {
  const [phase, setPhase] = useState<Phase>({ kind: 'pick' });

  return (
    <div style={{
      minHeight: '100vh', padding: '32px 16px',
      maxWidth: 1180, margin: '0 auto',
      display: 'flex', flexDirection: 'column', gap: 28,
    }}>
      <header style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>

        <h1 className="gradient-text" style={{
          fontSize: 'clamp(36px, 6vw, 56px)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          marginBottom: 8,
        }}>HappyGIFt ✦</h1>
        <p style={{
          fontSize: 14, color: 'var(--text-dim)',
          maxWidth: 520, margin: '0 auto',
          lineHeight: 1.5,
        }}>
          Plantillas con estilo + IA inteligente. Crea tarjetas de cumpleaños únicas, bien diseñadas y listas en segundos.
        </p>
      </header>

      <main style={{ animation: 'zoomPop 0.4s ease' }}>
        {phase.kind === 'pick' && (
          <TemplatePicker onPick={slug => setPhase({ kind: 'edit', slug })} />
        )}
        {phase.kind === 'edit' && (
          <CardEditor
            templateSlug={phase.slug}
            onBack={() => setPhase({ kind: 'pick' })}
          />
        )}
      </main>

      <footer style={{
        display: 'flex', flexWrap: 'wrap',
        justifyContent: 'space-between', alignItems: 'center',
        gap: 12,
        fontFamily: 'var(--mono)',
        fontSize: 11, color: 'var(--text-muted)',
        paddingTop: 24,
        borderTop: '1px solid var(--border)',
      }}>
        <div>
          HappyGIFt · plantillas controladas + IA · by{' '}
          <a
            href="https://github.com/GabrielCano22"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'var(--gradient-aurora)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
              textDecoration: 'none',
              animation: 'gradientPan 6s linear infinite',
            }}
          >Gabriel Cano</a>{' '}· 2025
        </div>

        <a
          href="https://github.com/GabrielCano22/HappyGIFt"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Repositorio en GitHub"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 12px',
            border: '1px solid var(--border)',
            borderRadius: 999,
            color: 'var(--text)',
            textDecoration: 'none',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--gold)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="14" height="14"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.16c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.05 11.05 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.62 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.4-5.27 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.79.56 4.57-1.52 7.86-5.83 7.86-10.91C23.5 5.65 18.35.5 12 .5z" />
          </svg>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600 }}>GitHub</span>
        </a>
      </footer>
    </div>
  );
}
