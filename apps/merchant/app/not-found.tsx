import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', textAlign: 'center' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Page Not Found</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem', maxWidth: '400px' }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        style={{ padding: '0.75rem 1.5rem', backgroundColor: '#25D366', color: 'white', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: '500' }}
      >
        Go Home
      </Link>
    </div>
  )
}
