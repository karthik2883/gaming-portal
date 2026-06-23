import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#08080f',
      color: '#f0f0ff',
      fontFamily: 'monospace',
      textAlign: 'center',
      padding: '20px'
    }}>
      <h1 style={{
        fontSize: '80px',
        color: '#ff0055',
        textShadow: '0 0 10px #ff0055',
        margin: '0 0 10px 0'
      }}>404</h1>
      <h2 style={{
        fontSize: '20px',
        color: '#00d4ff',
        textShadow: '0 0 5px #00d4ff',
        margin: '0 0 30px 0'
      }}>PAGE NOT FOUND</h2>
      <p style={{
        color: '#9090b0',
        maxWidth: '400px',
        lineHeight: '1.6',
        margin: '0 0 30px 0'
      }}>
        The coordinates you entered do not exist in the cyber grid. Return to the homepage to resume play.
      </p>
      <Link href="/" style={{
        padding: '10px 24px',
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: 'rgba(0, 212, 255, 0.15)',
        border: '1.5px solid #00d4ff',
        borderRadius: '6px',
        textDecoration: 'none',
        fontWeight: 'bold',
        textShadow: '0 0 5px #00d4ff',
        transition: 'all 0.2s ease',
      }}>
        RETURN TO PORTAL
      </Link>
    </div>
  );
}
