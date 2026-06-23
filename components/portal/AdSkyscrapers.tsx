'use client';
import { useState } from 'react';
import styles from '@/app/page.module.css';

interface AdSkyscrapersProps {
  leftAd?: {
    title: string;
    description: string;
    icon: string;
    link: string;
    colorTheme?: string;
  };
  rightAd?: {
    title: string;
    description: string;
    icon: string;
    link: string;
    colorTheme?: string;
  };
}

export default function AdSkyscrapers({ leftAd, rightAd }: AdSkyscrapersProps) {
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);

  return (
    <>
      {showLeft && leftAd && (
        <div className={styles.skyscraperLeft}>
          <button className={styles.skyscraperClose} onClick={() => setShowLeft(false)}>✕</button>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '16px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Advertisement
          </div>
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: '20px',
            width: '100%'
          }}>
            <span style={{ fontSize: '2.5rem' }}>{leftAd.icon || '🕹️'}</span>
            <div style={{
              fontFamily: 'Orbitron',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              color: leftAd.colorTheme === 'green' ? '#39ff14' : (leftAd.colorTheme === 'cyan' ? '#00d4ff' : '#ff0055'),
              textShadow: `0 0 8px ${leftAd.colorTheme === 'green' ? '#39ff14' : (leftAd.colorTheme === 'cyan' ? '#00d4ff' : '#ff0055')}`
            }}>
              {leftAd.title}
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', padding: '0 10px', lineHeight: '1.4' }}>
              {leftAd.description}
            </p>
            <a href={leftAd.link} className={`${styles.adBtn} ${leftAd.colorTheme === 'cyan' ? styles.adBtnCyan : ''}`} style={{ textDecoration: 'none', textAlign: 'center', width: '80%' }}>
              PLAY NOW
            </a>
          </div>
        </div>
      )}

      {showRight && rightAd && (
        <div className={styles.skyscraperRight}>
          <button className={styles.skyscraperClose} onClick={() => setShowRight(false)}>✕</button>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '16px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Advertisement
          </div>
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: '20px',
            width: '100%'
          }}>
            <span style={{ fontSize: '2.5rem' }}>{rightAd.icon || '🧱'}</span>
            <div style={{
              fontFamily: 'Orbitron',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              color: rightAd.colorTheme === 'green' ? '#39ff14' : (rightAd.colorTheme === 'cyan' ? '#00d4ff' : '#ff0055'),
              textShadow: `0 0 8px ${rightAd.colorTheme === 'green' ? '#39ff14' : (rightAd.colorTheme === 'cyan' ? '#00d4ff' : '#ff0055')}`
            }}>
              {rightAd.title}
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', padding: '0 10px', lineHeight: '1.4' }}>
              {rightAd.description}
            </p>
            <a href={rightAd.link} className={`${styles.adBtn} ${rightAd.colorTheme === 'cyan' ? styles.adBtnCyan : ''}`} style={{ textDecoration: 'none', textAlign: 'center', width: '80%' }}>
              PLAY NOW
            </a>
          </div>
        </div>
      )}
    </>
  );
}
