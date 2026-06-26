import Navbar from '@/components/portal/Navbar';

export const metadata = {
  title: 'Privacy Policy — FlipTrip Games',
  description: 'Learn about how FlipTrip Games protects and manages user data and privacy.',
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 'var(--nav-height)', minHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '60px' }}>
        <div className="container" style={{ maxWidth: '800px', marginTop: '40px', background: 'var(--gradient-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--border-radius)', padding: '40px' }}>
          <h1 style={{ fontFamily: 'Orbitron', fontSize: '2rem', marginBottom: '24px', color: 'var(--accent-cyan)' }}>
            🔒 Privacy Policy
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>Last updated: June 26, 2026</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
            <section>
              <h2 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '10px', fontFamily: 'Orbitron' }}>1. Introduction</h2>
              <p>Welcome to FlipTrip Games. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '10px', fontFamily: 'Orbitron' }}>2. Information We Collect</h2>
              <p>We do not require users to create accounts to play games. However, we collect minimal data to enable portal features:</p>
              <ul style={{ paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li><strong>Leaderboard Entries</strong>: If you choose to submit a high score, we collect the username and optional email address you provide to verify and display your ranking.</li>
                <li><strong>Analytics</strong>: We collect anonymous gameplay metrics (such as page views, play counts, and ratings) to improve our portal.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '10px', fontFamily: 'Orbitron' }}>3. Third-Party Integrations & Social Media APIs</h2>
              <p>Our portal integrates with social media networks (such as X/Twitter, Google/YouTube, and Meta/Facebook) to publish promotional gameplay videos and links. These API integrations are used exclusively by portal administrators. We do not extract, store, or share any personal user data from these social media networks.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '10px', fontFamily: 'Orbitron' }}>4. Data Security</h2>
              <p>We implement appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please remember that no transmission over the internet is 100% secure.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '10px', fontFamily: 'Orbitron' }}>5. Contact Us</h2>
              <p>If you have questions or comments about this policy, or if you wish to request the deletion of your leaderboard entries, you can contact us at support@fliptripgames.com.</p>
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
