'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './PWAInstaller.module.css';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registered with scope: ', registration.scope);
          })
          .catch((err) => {
            console.error('Service Worker registration failed: ', err);
          });
      });
    }

    // 2. Check if already installed or running in standalone mode
    const checkStandalone = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as any).standalone === true;
      setIsInstalled(isStandalone);
    };

    checkStandalone();
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkStandalone);

    // 3. Listen for browser's PWA install prompt trigger
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default browser mini-infobar or prompt
      e.preventDefault();
      
      // Store the event so it can be triggered later
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Only show the banner if the user hasn't dismissed it in the current session
      const isDismissed = sessionStorage.getItem('fliptrip_pwa_dismissed') === 'true';
      if (!isDismissed) {
        setShowInstallBtn(true);
      }
    };

    // 4. Listen for successful installation event
    const handleAppInstalled = () => {
      console.log('FlipTrip Games PWA installed successfully!');
      setShowInstallBtn(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkStandalone);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the browser's install prompt
    await deferredPrompt.prompt();

    // Wait for the user's response to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install prompt response: ${outcome}`);

    // We've used the prompt, so clear it
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  const handleDismiss = () => {
    // Hide banner and remember dismissal for current session to avoid annoying the user
    sessionStorage.setItem('fliptrip_pwa_dismissed', 'true');
    setShowInstallBtn(false);
  };

  // Do not render anything if already installed, or if the install prompt isn't supported/fired yet
  if (isInstalled || !showInstallBtn || !deferredPrompt) {
    return null;
  }

  return (
    <div className={`${styles.installerContainer} ${styles.animateSlideUp}`}>
      <div className={styles.installerHeader}>
        <div className={styles.brandInfo}>
          <div className={styles.logoWrapper}>
            <Image
              src="/fliptrip_logo.png"
              alt="FlipTrip Games Logo"
              width={36}
              height={36}
              className={styles.logoImage}
            />
          </div>
          <div className={styles.titleArea}>
            <span className={styles.title}>FLIPTRIP GAMES</span>
            <span className={styles.subtitle}>Install desktop app</span>
          </div>
        </div>
        <button 
          className={styles.closeButton} 
          onClick={handleDismiss}
          aria-label="Dismiss installation prompt"
        >
          ✕
        </button>
      </div>

      <p className={styles.description}>
        Get fast access, full-screen gaming, and offline support directly from your taskbar or home screen!
      </p>

      <div className={styles.actions}>
        <button className={styles.dismissBtn} onClick={handleDismiss}>
          Later
        </button>
        <button className={styles.installBtn} onClick={handleInstallClick}>
          <span>Install Now</span>
        </button>
      </div>
    </div>
  );
}
