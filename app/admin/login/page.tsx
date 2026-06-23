'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.ok) {
      router.push('/admin');
    } else {
      const next = attempts + 1;
      setAttempts(next);
      if (result?.error === 'TooManyAttempts' || next >= 5) {
        setError('Too many failed attempts. Please wait 15 minutes before trying again.');
      } else {
        setError(`Invalid username or password. ${5 - next} attempt${5 - next !== 1 ? 's' : ''} remaining.`);
      }
      // Shake animation
      const card = document.getElementById('login-card');
      card?.classList.add(styles.shake);
      setTimeout(() => card?.classList.remove(styles.shake), 500);
    }
  }

  const isLocked = attempts >= 5;

  return (
    <div className={styles.page}>
      {/* Animated background */}
      <div className={styles.bgGlow1} />
      <div className={styles.bgGlow2} />
      <div className={styles.grid} />

      <div className={styles.card} id="login-card">
        {/* Top accent bar */}
        <div className={styles.accentBar} />

        {/* Logo */}
        <div className={styles.logoWrap}>
          <span className={styles.logoIcon}>⚡</span>
          <h1 className={styles.logoText}>
            <span className={styles.logoAccent}>Game</span>Zone
          </h1>
        </div>
        <p className={styles.subtitle}>Admin Panel Access</p>

        {/* Lock icon when locked */}
        {isLocked && (
          <div className={styles.lockedBanner}>
            🔒 Account temporarily locked due to too many failed attempts.
            Please try again in 15 minutes.
          </div>
        )}

        {/* Error */}
        {error && !isLocked && (
          <div className={styles.errorBox}>
            <span className={styles.errorIcon}>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form} autoComplete="off">
          {/* Username */}
          <div className={styles.field}>
            <label htmlFor="username" className={styles.label}>Username</label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon}>👤</span>
              <input
                id="username"
                type="text"
                className={styles.input}
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                disabled={isLocked || loading}
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          {/* Password */}
          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <div className={styles.inputWrap}>
              <span className={styles.inputIcon}>🔑</span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={styles.input}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                disabled={isLocked || loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword(v => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            id="login-btn"
            className={styles.submitBtn}
            disabled={loading || isLocked}
          >
            {loading ? (
              <>
                <span className={styles.spinner} />
                Verifying...
              </>
            ) : (
              <>🔐 Sign In</>
            )}
          </button>
        </form>

        <p className={styles.secureNote}>
          🛡️ Protected by rate-limiting &amp; secure session tokens
        </p>
      </div>
    </div>
  );
}
