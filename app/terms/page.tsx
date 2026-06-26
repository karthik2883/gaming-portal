import Navbar from '@/components/portal/Navbar';

export const metadata = {
  title: 'Terms of Service — FlipTrip Games',
  description: 'Read the terms and conditions for playing free online games on FlipTrip Games.',
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 'var(--nav-height)', minHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '60px' }}>
        <div className="container" style={{ maxWidth: '800px', marginTop: '40px', background: 'var(--gradient-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--border-radius)', padding: '40px' }}>
          <h1 style={{ fontFamily: 'Orbitron', fontSize: '2rem', marginBottom: '24px', color: 'var(--accent-cyan)' }}>
            ⚖️ Terms of Service
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>Last updated: June 26, 2026</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
            <section>
              <h2 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '10px', fontFamily: 'Orbitron' }}>1. Agreement to Terms</h2>
              <p>By accessing and playing games on FlipTrip Games, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not use the website.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '10px', fontFamily: 'Orbitron' }}>2. Use of Service</h2>
              <p>Our website provides free-to-play online games. You agree to use the service only for personal, non-commercial entertainment purposes. You must not attempt to hack, disrupt, or compromise the service, including manipulating high scores on leaderboards.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '10px', fontFamily: 'Orbitron' }}>3. User Conduct</h2>
              <p>When submitting a username to our leaderboards, you agree not to submit offensive, vulgar, or copyrighted names. We reserve the right to remove any score entries that violate these guidelines without prior notice.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '10px', fontFamily: 'Orbitron' }}>4. Disclaimer of Warranties</h2>
              <p>FlipTrip Games is provided on an "as is" and "as available" basis. We make no warranties, expressed or implied, regarding the availability, functionality, or correctness of the games or website content.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '10px', fontFamily: 'Orbitron' }}>5. Modifications</h2>
              <p>We reserve the right to modify these Terms of Service at any time. Your continued use of the website following any changes constitutes your acceptance of the updated terms.</p>
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
