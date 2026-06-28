import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <img 
              src="/fliptrip_logo.png" 
              alt="FlipTrip Games" 
              style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'contain' }} 
            />
            <span className={styles.footerLogo}>
              <span className="text-gradient-cyan">FlipTrip</span>
              <span style={{ color: '#a78bfa' }}> Games</span>
            </span>
          </div>

          <ul className={styles.footerLinks}>
            <li>
              <Link href="/privacy" className={styles.footerLink}>
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className={styles.footerLink}>
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/data-deletion" className={styles.footerLink}>
                Data Deletion
              </Link>
            </li>
          </ul>

          <p className={styles.footerText}>
            &copy; {new Date().getFullYear()} FlipTrip Games. Play free online games, no download required.
          </p>
        </div>
      </div>
    </footer>
  );
}
