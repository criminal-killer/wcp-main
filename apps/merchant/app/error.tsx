'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', textAlign: 'center' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Something went wrong</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem', maxWidth: '400px' }}>
        An unexpected error occurred. Please try again or contact support if the problem persists.
      </p>
      <button
        onClick={reset}
        style={{ padding: '0.75rem 1.5rem', backgroundColor: '#25D366', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '500' }}
      >
        Try again
      </button>
    </div>
  )
}
