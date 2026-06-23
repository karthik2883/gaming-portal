'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './Navbar.module.css';

interface MenuItem {
  _id: string;
  label: string;
  slug: string;
  url?: string;
  type: string;
  categoryRef?: { name: string; slug: string };
}

function getMenuHref(item: MenuItem): string {
  if (item.type === 'category' && item.categoryRef) {
    return `/${item.categoryRef.slug}`;
  }
  return item.url || `/${item.slug}`;
}

export default function Navbar() {
  const router = useRouter();
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    fetch('/api/menus?position=header&active=true')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setMenus(d.data);
        }
      })
      .catch(() => {});

    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.navContent}`}>
        {/* Logo */}
        <Link href="/" className={styles.logo} prefetch={true}>
          <Image
            src="/fliptrip_logo.png"
            alt="FlipTrip Games"
            width={40}
            height={40}
            style={{ borderRadius: '8px', objectFit: 'contain' }}
            priority
          />
          <span className={styles.logoText}>
            <span className="text-gradient-cyan">FlipTrip</span>
            <span style={{ color: '#a78bfa', fontWeight: 400 }}> Games</span>
          </span>
        </Link>

        {/* Desktop Menu */}
        <ul className={styles.desktopMenu}>
          <li><Link href="/" className={styles.navLink} prefetch={true}>Home</Link></li>
          {menus.map(item => (
            <li key={item._id}>
              <Link href={getMenuHref(item)} className={styles.navLink} prefetch={true}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Search + Mobile Toggle */}
        <div className={styles.navActions}>
          <div className={`${styles.searchWrap} ${searchOpen ? styles.searchOpen : ''}`}>
            <form onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search games..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={styles.searchInput}
                autoFocus={searchOpen}
              />
              <span className={styles.searchIcon}>🔍</span>
            </form>
          </div>
          <button className={styles.searchToggle} onClick={() => setSearchOpen(o => !o)} aria-label="Search">
            🔍
          </button>
          <button
            className={styles.mobileToggle}
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className={styles.mobileMenu}>
          <Link href="/" className={styles.mobileLink} onClick={() => setMobileOpen(false)} prefetch={true}>
            🏠 Home
          </Link>
          {menus.map(item => (
            <Link
              key={item._id}
              href={getMenuHref(item)}
              className={styles.mobileLink}
              onClick={() => setMobileOpen(false)}
              prefetch={true}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
