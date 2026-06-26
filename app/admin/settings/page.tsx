'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function SocialSettingsPage() {
  const [settings, setSettings] = useState({
    GEMINI_API_KEY: '',
    X_API_KEY: '',
    X_API_SECRET: '',
    X_ACCESS_TOKEN: '',
    X_ACCESS_SECRET: '',
    X_BEARER_TOKEN: '',
    YT_CLIENT_ID: '',
    YT_CLIENT_SECRET: '',
    YT_REFRESH_TOKEN: '',
    FB_PAGE_ID: '',
    META_ACCESS_TOKEN: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        if (res.ok && data.success && data.settings) {
          setSettings((prev) => ({
            ...prev,
            ...data.settings,
          }));
        } else {
          toast.error(data.error || 'Failed to load social settings');
        }
      } catch (err) {
        toast.error('Network error loading settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: settings }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Social credentials saved successfully!');
      } else {
        toast.error(data.error || 'Failed to save credentials');
      }
    } catch (err) {
      toast.error('Network error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key: keyof typeof settings, val: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading credentials configuration...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'Orbitron', fontSize: 'clamp(1.4rem, 3vw, 2rem)', marginBottom: '6px' }}>
          ⚙️ Social Promotion Settings
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Configure API credentials and tokens for the AI Promotion Auto-Poster. Credentials saved here will override local environment variables.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Gemini AI Card */}
        <div style={{ background: 'var(--gradient-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--border-radius)', padding: '24px' }}>
          <h3 style={{ fontFamily: 'Orbitron', fontSize: '0.95rem', marginBottom: '20px', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✨</span> Gemini AI Assistant
          </h3>
          <div className="form-group">
            <label className="form-label">Gemini API Key</label>
            <input
              type="password"
              className="form-control"
              value={settings.GEMINI_API_KEY}
              onChange={(e) => handleInputChange('GEMINI_API_KEY', e.target.value)}
              placeholder="AI Caption & Tag Assistant API Key"
              id="setting-gemini-key"
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Used to generate social captions and post text using `gemini-2.5-flash`.
            </p>
          </div>
        </div>

        {/* X / Twitter Card */}
        <div style={{ background: 'var(--gradient-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--border-radius)', padding: '24px' }}>
          <h3 style={{ fontFamily: 'Orbitron', fontSize: '0.95rem', marginBottom: '20px', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>𝕏</span> X (Twitter) Developer API
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">API Key (Consumer Key)</label>
              <input
                type="text"
                className="form-control"
                value={settings.X_API_KEY}
                onChange={(e) => handleInputChange('X_API_KEY', e.target.value)}
                placeholder="X_API_KEY"
                id="setting-x-api-key"
              />
            </div>
            <div className="form-group">
              <label className="form-label">API Key Secret (Consumer Secret)</label>
              <input
                type="password"
                className="form-control"
                value={settings.X_API_SECRET}
                onChange={(e) => handleInputChange('X_API_SECRET', e.target.value)}
                placeholder="X_API_SECRET"
                id="setting-x-api-secret"
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">Access Token</label>
              <input
                type="text"
                className="form-control"
                value={settings.X_ACCESS_TOKEN}
                onChange={(e) => handleInputChange('X_ACCESS_TOKEN', e.target.value)}
                placeholder="X_ACCESS_TOKEN"
                id="setting-x-access-token"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Access Token Secret</label>
              <input
                type="password"
                className="form-control"
                value={settings.X_ACCESS_SECRET}
                onChange={(e) => handleInputChange('X_ACCESS_SECRET', e.target.value)}
                placeholder="X_ACCESS_SECRET"
                id="setting-x-access-secret"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Bearer Token (optional)</label>
            <input
              type="password"
              className="form-control"
              value={settings.X_BEARER_TOKEN}
              onChange={(e) => handleInputChange('X_BEARER_TOKEN', e.target.value)}
              placeholder="X_BEARER_TOKEN"
              id="setting-x-bearer-token"
            />
          </div>
        </div>

        {/* YouTube Shorts Card */}
        <div style={{ background: 'var(--gradient-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--border-radius)', padding: '24px' }}>
          <h3 style={{ fontFamily: 'Orbitron', fontSize: '0.95rem', marginBottom: '20px', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📹</span> YouTube Data API v3 (Shorts)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">Google Client ID</label>
              <input
                type="text"
                className="form-control"
                value={settings.YT_CLIENT_ID}
                onChange={(e) => handleInputChange('YT_CLIENT_ID', e.target.value)}
                placeholder="YT_CLIENT_ID"
                id="setting-yt-client-id"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Google Client Secret</label>
              <input
                type="password"
                className="form-control"
                value={settings.YT_CLIENT_SECRET}
                onChange={(e) => handleInputChange('YT_CLIENT_SECRET', e.target.value)}
                placeholder="YT_CLIENT_SECRET"
                id="setting-yt-client-secret"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">OAuth Refresh Token</label>
            <input
              type="password"
              className="form-control"
              value={settings.YT_REFRESH_TOKEN}
              onChange={(e) => handleInputChange('YT_REFRESH_TOKEN', e.target.value)}
              placeholder="YT_REFRESH_TOKEN"
              id="setting-yt-refresh-token"
            />
          </div>
        </div>

        {/* Facebook Page Card */}
        <div style={{ background: 'var(--gradient-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--border-radius)', padding: '24px' }}>
          <h3 style={{ fontFamily: 'Orbitron', fontSize: '0.95rem', marginBottom: '20px', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📘</span> Facebook Page Video Publishing
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Facebook Page ID</label>
              <input
                type="text"
                className="form-control"
                value={settings.FB_PAGE_ID}
                onChange={(e) => handleInputChange('FB_PAGE_ID', e.target.value)}
                placeholder="FB_PAGE_ID"
                id="setting-fb-page-id"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Page Access Token</label>
              <input
                type="password"
                className="form-control"
                value={settings.META_ACCESS_TOKEN}
                onChange={(e) => handleInputChange('META_ACCESS_TOKEN', e.target.value)}
                placeholder="META_ACCESS_TOKEN"
                id="setting-meta-access-token"
              />
            </div>
          </div>
        </div>

        {/* Submit Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
            style={{ minWidth: '150px' }}
            id="save-settings-btn"
          >
            {saving ? 'Saving...' : '💾 Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
