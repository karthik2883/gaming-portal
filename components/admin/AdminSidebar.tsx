'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import styles from './AdminSidebar.module.css';

const NAV_ITEMS = [
  { href: '/admin', icon: '📊', label: 'Dashboard', exact: true },
  { href: '/admin/categories', icon: '📂', label: 'Categories' },
  { href: '/admin/menus', icon: '☰', label: 'Menus' },
  { href: '/admin/games', icon: '🎮', label: 'Games' },
  { href: '/admin/homepage', icon: '✨', label: 'Homepage' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <span className={styles.logoIcon}>⚡</span>
        <div>
          <div className={styles.logoText}>
            <span className="text-gradient-cyan">Game</span>Zone
          </div>
          <div className={styles.logoSub}>Admin Panel</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navSection}>
          <span className={styles.navSectionLabel}>Management</span>
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive(item.href, item.exact) ? styles.active : ''}`}
              id={`nav-${item.label.toLowerCase()}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
              {isActive(item.href, item.exact) && <span className={styles.activeIndicator} />}
            </Link>
          ))}
        </div>

        <div className={styles.navSection}>
          <span className={styles.navSectionLabel}>Portal</span>
          <a href="/" target="_blank" className={styles.navItem} rel="noopener noreferrer">
            <span className={styles.navIcon}>🌐</span>
            <span>View Portal</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', opacity: 0.5 }}>↗</span>
          </a>
        </div>
      </nav>

      {/* Footer */}
      <div className={styles.sidebarFooter}>
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className={styles.signOutBtn}
          id="signout-btn"
        >
          <span>🚪</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
