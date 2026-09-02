'use client';

import { useEffect } from 'react';

// Only fires if the ROOT layout itself throws (very rare — normal page
// errors are caught by app/error.tsx instead). This replaces the entire
// <html> document, so it can't rely on globals.css, the I18nProvider, or
// any other app context actually having loaded — everything here is
// inline and self-contained on purpose, as a last-resort safety net.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#faf8f5',
          color: '#1a1a1a',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif',
          padding: '24px',
        }}
      >
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <p
            style={{
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              color: 'rgba(26,26,26,0.4)',
              margin: 0,
            }}
          >
            ALGO HA FALLADO / SOMETHING WENT WRONG
          </p>

          <h1 style={{ fontSize: 26, margin: '8px 0 0' }}>
            No hemos podido cargar la aplicación
          </h1>

          <p style={{ fontSize: 14, color: 'rgba(26,26,26,0.6)', margin: '12px 0 0' }}>
            Ha ocurrido un error inesperado. Prueba a recargar la página.
            <br />
            An unexpected error occurred. Please try reloading the page.
          </p>

          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              background: '#1a1a1a',
              color: '#faf8f5',
              border: 'none',
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Reintentar / Retry
          </button>
        </div>
      </body>
    </html>
  );
}
