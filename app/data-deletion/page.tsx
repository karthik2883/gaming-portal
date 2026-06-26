import Navbar from '@/components/portal/Navbar';

export const metadata = {
  title: 'Data Deletion Instructions — FlipTrip Games',
  description: 'Step-by-step instructions on how to request the deletion of your personal data from FlipTrip Games.',
};

export default function DataDeletionPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 'var(--nav-height)', minHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '60px' }}>
        <div className="container" style={{ maxWidth: '800px', marginTop: '40px', background: 'var(--gradient-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--border-radius)', padding: '40px' }}>
          <h1 style={{ fontFamily: 'Orbitron', fontSize: '1.8rem', marginBottom: '24px', color: 'var(--accent-cyan)' }}>
            🗑️ Data Deletion Instructions
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>Last updated: June 26, 2026</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
            <p>At FlipTrip Games, we respect your privacy and provide a simple, transparent process to request the complete deletion of any data associated with your gameplay and leaderboard entries.</p>
            
            <section>
              <h2 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '10px', fontFamily: 'Orbitron' }}>What data do we store?</h2>
              <p>We do not use accounts or logins for players. The only data we store that can be associated with you is:</p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>Your chosen leaderboard username.</li>
                <li>Your recorded game score and play timestamp.</li>
                <li>Your email address (if you chose to provide one when securing your leaderboard name).</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '10px', fontFamily: 'Orbitron' }}>How to request data deletion</h2>
              <p>If you wish to have your leaderboard entries, email address, or score records permanently deleted from our databases, please follow these steps:</p>
              <ol style={{ paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Send an email to <strong>support@fliptripgames.com</strong> with the subject line <strong>"Data Deletion Request"</strong>.</li>
                <li>In the email, please provide:
                  <ul style={{ paddingLeft: '20px', marginTop: '4px' }}>
                    <li>The leaderboard username you want deleted.</li>
                    <li>The email address you used to secure the name (if applicable).</li>
                  </ul>
                </li>
                <li>Our team will verify the request and permanently delete all matching records from our databases within 48 hours.</li>
              </ol>
            </section>

            <section>
              <h2 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '10px', fontFamily: 'Orbitron' }}>Confirmation</h2>
              <p>Once the deletion process is complete, we will send you a confirmation email. All associated scores and emails will be permanently removed from our active database and backups.</p>
            </section>
          </div>

          <div style={{ marginTop: '40px', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px', display: 'flex', justifyContent: 'center' }}>
            <a href="/" className="btn btn-primary">Back to Home</a>
          </div>
        </div>
      </main>
    </>
  );
}
