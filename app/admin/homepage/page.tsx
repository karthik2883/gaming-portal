'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import styles from './homepage.module.css';

interface Ad {
  _id?: string;
  position: 'leaderboard' | 'skyscraper-left' | 'skyscraper-right' | 'in-grid';
  gridIndex: number;
  title: string;
  description: string;
  icon: string;
  link: string;
  size?: '2x2' | '2x1';
  colorTheme: string;
  isActive: boolean;
}

interface HomepageConfig {
  title: string;
  subtitle: string;
  ads: Ad[];
}

const defaultAdForm: Ad = {
  position: 'in-grid',
  gridIndex: 0,
  title: '',
  description: '',
  icon: '📢',
  link: '#',
  size: '2x1',
  colorTheme: 'default',
  isActive: true
};

export default function HomepageSettingsPage() {
  const [config, setConfig] = useState<HomepageConfig>({ title: '', subtitle: '', ads: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Ad sub-form state
  const [showAdForm, setShowAdForm] = useState(false);
  const [editingAdIndex, setEditingAdIndex] = useState<number | null>(null);
  const [adForm, setAdForm] = useState<Ad>(defaultAdForm);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/homepage');
      const data = await res.json();
      if (data.success) {
        setConfig(data.data);
      } else {
        toast.error('Failed to load settings');
      }
    } catch {
      toast.error('Failed to load settings');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: config.title,
          subtitle: config.subtitle,
          ads: config.ads
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Homepage settings saved successfully!');
        setConfig(data.data);
      } else {
        toast.error(data.error || 'Failed to save settings');
      }
    } catch {
      toast.error('Network error');
    }
    setSaving(false);
  };

  const handleAdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adForm.title) {
      toast.error('Title is required for advertisement');
      return;
    }

    const updatedAds = [...config.ads];
    if (editingAdIndex !== null) {
      updatedAds[editingAdIndex] = adForm;
      toast.success('Advertisement updated in list');
    } else {
      updatedAds.push(adForm);
      toast.success('Advertisement added to list');
    }

    setConfig(prev => ({ ...prev, ads: updatedAds }));
    setShowAdForm(false);
    setEditingAdIndex(null);
    setAdForm(defaultAdForm);
  };

  const handleEditAd = (index: number) => {
    setAdForm(config.ads[index]);
    setEditingAdIndex(index);
    setShowAdForm(true);
  };

  const handleDeleteAd = (index: number) => {
    if (!confirm('Are you sure you want to remove this advertisement?')) return;
    const updatedAds = config.ads.filter((_, i) => i !== index);
    setConfig(prev => ({ ...prev, ads: updatedAds }));
    toast.success('Advertisement removed from list');
  };

  const getPositionLabel = (pos: string) => {
    switch (pos) {
      case 'leaderboard': return 'Top Leaderboard';
      case 'skyscraper-left': return 'Left Skyscraper';
      case 'skyscraper-right': return 'Right Skyscraper';
      case 'in-grid': return 'In-Grid Block';
      default: return pos;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'Orbitron', fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', marginBottom: '4px' }}>
          ✨ Homepage Settings
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Manage your portal front page, headers, and advertisement placements.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading settings...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', alignItems: 'start' }}>
          {/* Left panel: general settings & ads list */}
          <div>
            <div className={styles.card}>
              <h2 style={{ fontFamily: 'Orbitron', fontSize: '1.1rem', marginBottom: '20px' }}>
                📝 General Content
              </h2>
              <form onSubmit={handleSaveGeneral}>
                <div className="form-group">
                  <label className="form-label">Hero Title *</label>
                  <input
                    className="form-control"
                    value={config.title}
                    onChange={e => setConfig(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. FLIPTRIP GAMES"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Hero Subtitle</label>
                  <textarea
                    className="form-control"
                    value={config.subtitle}
                    onChange={e => setConfig(prev => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="e.g. Play free online games instantly."
                    rows={2}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
                    * Saves general info and current ads list to database.
                  </p>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            </div>

            <div className={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontFamily: 'Orbitron', fontSize: '1.1rem', margin: 0 }}>
                  📢 Advertisements
                </h2>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => { setAdForm(defaultAdForm); setEditingAdIndex(null); setShowAdForm(true); }}
                >
                  + Add Ad
                </button>
              </div>

              <div className={styles.adList}>
                {config.ads.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>
                    No advertisements configured.
                  </p>
                ) : (
                  config.ads.map((ad, idx) => (
                    <div key={idx} className={styles.adItem} style={!ad.isActive ? { opacity: 0.5 } : {}}>
                      <div className={styles.adDetails}>
                        <div className={styles.adIcon}>{ad.icon}</div>
                        <div className={styles.adMeta}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span className={styles.adTitle}>{ad.title}</span>
                            <span
                              className={styles.adPositionBadge}
                              style={{
                                background: ad.position === 'leaderboard' ? 'rgba(0, 212, 255, 0.15)' : (ad.position === 'in-grid' ? 'rgba(189, 0, 255, 0.15)' : 'rgba(57, 255, 20, 0.15)'),
                                color: ad.position === 'leaderboard' ? 'var(--accent-cyan)' : (ad.position === 'in-grid' ? 'var(--accent-purple)' : 'var(--accent-green)'),
                                border: `1px solid ${ad.position === 'leaderboard' ? 'var(--accent-cyan)' : (ad.position === 'in-grid' ? 'var(--accent-purple)' : 'var(--accent-green)')}`
                              }}
                            >
                              {getPositionLabel(ad.position)}
                              {ad.position === 'in-grid' ? ` (Slot ${ad.gridIndex})` : ''}
                            </span>
                          </div>
                          <span className={styles.adDesc}>{ad.description.slice(0, 70)}{ad.description.length > 70 ? '...' : ''}</span>
                        </div>
                      </div>
                      <div className={styles.adActions}>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleEditAd(idx)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteAd(idx)}>🗑️</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right panel: Ad details edit form */}
          <div>
            {showAdForm && (
              <div className={styles.card} style={{ border: '1px solid var(--border-glow)' }}>
                <h2 style={{ fontFamily: 'Orbitron', fontSize: '1.1rem', marginBottom: '20px' }}>
                  {editingAdIndex !== null ? '✏️ Edit Advertisement' : '➕ New Advertisement'}
                </h2>
                <form onSubmit={handleAdSubmit}>
                  <div className="form-group">
                    <label className="form-label">Position *</label>
                    <select
                      className="form-control"
                      value={adForm.position}
                      onChange={e => setAdForm(prev => ({ ...prev, position: e.target.value as any }))}
                    >
                      <option value="leaderboard">Top Leaderboard Banner (728x90)</option>
                      <option value="skyscraper-left">Left Sidebar Skyscraper (160x600)</option>
                      <option value="skyscraper-right">Right Sidebar Skyscraper (160x600)</option>
                      <option value="in-grid">Homepage Grid Card</option>
                    </select>
                  </div>

                  {adForm.position === 'in-grid' && (
                    <div className={styles.formGrid}>
                      <div className="form-group">
                        <label className="form-label">Grid Index *</label>
                        <input
                          type="number"
                          className="form-control"
                          value={adForm.gridIndex}
                          onChange={e => setAdForm(prev => ({ ...prev, gridIndex: parseInt(e.target.value) || 0 }))}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Card Size *</label>
                        <select
                          className="form-control"
                          value={adForm.size}
                          onChange={e => setAdForm(prev => ({ ...prev, size: e.target.value as any }))}
                        >
                          <option value="2x1">2x1 Wide Card</option>
                          <option value="2x2">2x2 Featured Box</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className={styles.formGrid}>
                    <div className="form-group">
                      <label className="form-label">Ad Title *</label>
                      <input
                        className="form-control"
                        value={adForm.title}
                        onChange={e => setAdForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g. NEON RIDER OUT NOW"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Ad Icon Emoji *</label>
                      <input
                        className="form-control"
                        value={adForm.icon}
                        onChange={e => setAdForm(prev => ({ ...prev, icon: e.target.value }))}
                        placeholder="e.g. 🏎️"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description / Subtext</label>
                    <textarea
                      className="form-control"
                      value={adForm.description}
                      onChange={e => setAdForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="e.g. Rev your lightcycle in a stunning cyber-grid synthwave racer!"
                      rows={3}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Destination Link *</label>
                    <input
                      className="form-control"
                      value={adForm.link}
                      onChange={e => setAdForm(prev => ({ ...prev, link: e.target.value }))}
                      placeholder="e.g. /game/neon-rider"
                      required
                    />
                  </div>

                  <div className={styles.formGrid}>
                    <div className="form-group">
                      <label className="form-label">Color Theme</label>
                      <select
                        className="form-control"
                        value={adForm.colorTheme}
                        onChange={e => setAdForm(prev => ({ ...prev, colorTheme: e.target.value }))}
                      >
                        <option value="default">Default Pink</option>
                        <option value="cyan">Neon Cyan</option>
                        <option value="green">Acid Green</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <label className="toggle-switch">
                        <div
                          className={`toggle-track ${adForm.isActive ? 'active' : ''}`}
                          onClick={() => setAdForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                        >
                          <div className="toggle-thumb" />
                        </div>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          {adForm.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                    <button type="submit" className="btn btn-primary">
                      {editingAdIndex !== null ? '✓ Update Ad in List' : '+ Add Ad to List'}
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => setShowAdForm(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
