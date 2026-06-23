'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface Category {
  _id: string;
  name: string;
  icon: string;
}

interface GameFormProps {
  gameId?: string;
}

const PHASER_GAMES = [
  { key: 'snake', label: '🐍 Snake Game' },
  { key: 'breakout', label: '🧱 Breakout' },
  { key: 'water-sort', label: '🧪 Water Sort' },
  { key: 'unblock-me', label: '🚗 Unblock Me' },
  { key: 'sudoku', label: '⬡ Sudoku Neo' },
  { key: 'pacman', label: '🕹️ Pac-Man' },
  { key: 'tetris', label: '🧱 Tetris Neo' },
  { key: 'chess', label: '👑 Chess Neo' },
  { key: '2048', label: '🔢 2048 Cyber' },
  { key: 'typing', label: '⌨️ Typing Nexus' },
  { key: 'neon-rider', label: '🏎️ Neon Rider' },
  { key: 'cyber-runner', label: '🏃 Cyber Runner' },
  { key: 'flappy-bird', label: '🐦 Flappy Cyber' },
  { key: 'bubble-shooter', label: '🔮 Bubble Shooter Neo' },
  { key: 'fruit-slice', label: '🍉 Fruit Slice' },
  { key: 'candy-match', label: '🍬 Candy Match Neo' },
  { key: 'football', label: '⚽ FIFA Football Neo' },
  { key: 'memory-match', label: '🃏 Memory Match Neo' },
];

const defaultForm = {
  title: '', slug: '', description: '', thumbnail: '',
  categories: [] as string[], tags: '',
  gameType: 'iframe' as 'iframe' | 'phaser',
  iframeUrl: '', phaserGameKey: 'snake',
  width: 800, height: 600,
  featured: false, isActive: true,
  developer: '', instructions: '',
  seoTitle: '', seoDescription: '', seoKeywords: '',
  sortOrder: 0,
};

export default function GameForm({ gameId }: GameFormProps) {
  const router = useRouter();
  const [form, setForm] = useState(defaultForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [generatingSeo, setGeneratingSeo] = useState(false);
  const [loading, setLoading] = useState(!!gameId);

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(d => {
      if (d.success) setCategories(d.data);
    });

    if (gameId) {
      fetch(`/api/games/${gameId}`).then(r => r.json()).then(d => {
        if (d.success) {
          const g = d.data;
          setForm({
            title: g.title, slug: g.slug, description: g.description,
            thumbnail: g.thumbnail, categories: g.categories.map((c: any) => c._id || c),
            tags: g.tags.join(', '), gameType: g.gameType,
            iframeUrl: g.iframeUrl || '', phaserGameKey: g.phaserGameKey || 'snake',
            width: g.width, height: g.height,
            featured: g.featured, isActive: g.isActive,
            developer: g.developer || '', instructions: g.instructions || '',
            seoTitle: g.seoTitle || '', seoDescription: g.seoDescription || '', seoKeywords: g.seoKeywords || '',
            sortOrder: g.sortOrder,
          });
        }
        setLoading(false);
      });
    }
  }, [gameId]);

  const slugify = (str: string) =>
    str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      const url = gameId ? `/api/games/${gameId}` : '/api/games';
      const method = gameId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(gameId ? 'Game updated!' : 'Game created!');
        router.push('/admin/games');
      } else toast.error(data.error || 'Failed to save');
    } catch { toast.error('Network error'); }
    setSaving(false);
  };

  const handleGenerateSeo = async () => {
    if (!form.title) {
      toast.error('Title is required to generate SEO metadata');
      return;
    }
    setGeneratingSeo(true);
    try {
      const res = await fetch('/api/seo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          tags: form.tags.split(',').map(t => t.trim()),
          type: 'game'
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setForm(f => ({
          ...f,
          seoTitle: data.data.seoTitle || f.seoTitle,
          seoDescription: data.data.seoDescription || f.seoDescription,
          seoKeywords: data.data.seoKeywords || f.seoKeywords,
        }));
        toast.success('SEO metadata generated with AI!');
      } else {
        toast.error(data.error || 'Failed to generate SEO');
      }
    } catch (err) {
      toast.error('Failed to call AI SEO generator');
    }
    setGeneratingSeo(false);
  };

  const toggleCategory = (id: string) => {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(id)
        ? f.categories.filter(c => c !== id)
        : [...f.categories, id],
    }));
  };

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading game...</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Basic Info */}
          <div style={{ background: 'var(--gradient-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--border-radius)', padding: '24px' }}>
            <h3 style={{ fontFamily: 'Orbitron', fontSize: '0.95rem', marginBottom: '20px', color: 'var(--accent-cyan)' }}>
              📝 Basic Info
            </h3>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-control" value={form.title} required id="game-title"
                onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: gameId ? f.slug : slugify(e.target.value) }))}
                placeholder="e.g. Space Shooter Pro" />
            </div>
            <div className="form-group">
              <label className="form-label">Slug *</label>
              <input className="form-control" value={form.slug} required id="game-slug"
                onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                placeholder="e.g. space-shooter-pro" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" value={form.description} id="game-desc"
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe the game..." />
            </div>
            <div className="form-group">
              <label className="form-label">Developer</label>
              <input className="form-control" value={form.developer} id="game-developer"
                onChange={e => setForm(f => ({ ...f, developer: e.target.value }))}
                placeholder="Developer name" />
            </div>
            <div className="form-group">
              <label className="form-label">How to Play / Instructions</label>
              <textarea className="form-control" value={form.instructions} id="game-instructions"
                onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                placeholder="Use WASD to move, Space to jump..." style={{ minHeight: '80px' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Tags (comma-separated)</label>
              <input className="form-control" value={form.tags} id="game-tags"
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                placeholder="action, shooter, multiplayer" />
            </div>
          </div>

          {/* Game Source */}
          <div style={{ background: 'var(--gradient-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--border-radius)', padding: '24px' }}>
            <h3 style={{ fontFamily: 'Orbitron', fontSize: '0.95rem', marginBottom: '20px', color: 'var(--accent-cyan)' }}>
              🎮 Game Source
            </h3>
            <div className="form-group">
              <label className="form-label">Game Type</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['iframe', 'phaser'] as const).map(type => (
                  <button key={type} type="button" id={`type-${type}`}
                    className={`btn ${form.gameType === type ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    onClick={() => setForm(f => ({ ...f, gameType: type }))}>
                    {type === 'iframe' ? '🔗 External iframe' : '⚡ Built-in Phaser'}
                  </button>
                ))}
              </div>
            </div>

            {form.gameType === 'iframe' ? (
              <div className="form-group">
                <label className="form-label">iframe URL *</label>
                <input className="form-control" value={form.iframeUrl} id="game-iframe-url"
                  onChange={e => setForm(f => ({ ...f, iframeUrl: e.target.value }))}
                  placeholder="https://games.example.com/embed/game or /game-assets/index.html" type="text" />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  The embeddable URL for the game (must allow iframe embedding)
                </span>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Phaser Game Key *</label>
                <select className="form-control" value={form.phaserGameKey} id="game-phaser-key"
                  onChange={e => setForm(f => ({ ...f, phaserGameKey: e.target.value }))}>
                  {PHASER_GAMES.map(g => (
                    <option key={g.key} value={g.key}>{g.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Width (px)</label>
                <input type="number" className="form-control" value={form.width} id="game-width"
                  onChange={e => setForm(f => ({ ...f, width: +e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Height (px)</label>
                <input type="number" className="form-control" value={form.height} id="game-height"
                  onChange={e => setForm(f => ({ ...f, height: +e.target.value }))} />
              </div>
            </div>
          </div>

          {/* SEO Metadata */}
          <div style={{ background: 'var(--gradient-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--border-radius)', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'Orbitron', fontSize: '0.95rem', margin: 0, color: 'var(--accent-cyan)' }}>
                🔍 SEO Settings
              </h3>
              <button 
                type="button" 
                className="btn btn-sm" 
                style={{ background: 'linear-gradient(45deg, #FF007A, #7928CA)', color: 'white', border: 'none' }}
                onClick={handleGenerateSeo}
                disabled={generatingSeo || !form.title}
              >
                {generatingSeo ? '✨ Generating...' : '✨ AI Magic'}
              </button>
            </div>
            <div className="form-group">
              <label className="form-label">SEO Title</label>
              <input className="form-control" value={form.seoTitle} id="game-seo-title"
                onChange={e => setForm(f => ({ ...f, seoTitle: e.target.value }))}
                placeholder="Optimized Title" maxLength={60} />
            </div>
            <div className="form-group">
              <label className="form-label">SEO Description</label>
              <textarea className="form-control" value={form.seoDescription} id="game-seo-desc"
                onChange={e => setForm(f => ({ ...f, seoDescription: e.target.value }))}
                placeholder="Engaging meta description..." maxLength={160} />
            </div>
            <div className="form-group">
              <label className="form-label">SEO Keywords</label>
              <input className="form-control" value={form.seoKeywords} id="game-seo-keywords"
                onChange={e => setForm(f => ({ ...f, seoKeywords: e.target.value }))}
                placeholder="action, multiplayer, free games" />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '24px' }}>

          {/* Publish Settings */}
          <div style={{ background: 'var(--gradient-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--border-radius)', padding: '24px' }}>
            <h3 style={{ fontFamily: 'Orbitron', fontSize: '0.95rem', marginBottom: '20px', color: 'var(--accent-cyan)' }}>
              ⚙️ Settings
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label className="toggle-switch">
                <div className={`toggle-track ${form.isActive ? 'active' : ''}`}
                  onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))} id="game-active">
                  <div className="toggle-thumb" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Published</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Visible on portal</div>
                </div>
              </label>
              <label className="toggle-switch">
                <div className={`toggle-track ${form.featured ? 'active' : ''}`}
                  onClick={() => setForm(f => ({ ...f, featured: !f.featured }))} id="game-featured">
                  <div className="toggle-thumb" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Featured</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Highlighted on homepage</div>
                </div>
              </label>
            </div>
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">Sort Order</label>
              <input type="number" className="form-control" value={form.sortOrder} id="game-sort"
                onChange={e => setForm(f => ({ ...f, sortOrder: +e.target.value }))} />
            </div>
          </div>

          {/* Thumbnail */}
          <div style={{ background: 'var(--gradient-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--border-radius)', padding: '24px' }}>
            <h3 style={{ fontFamily: 'Orbitron', fontSize: '0.95rem', marginBottom: '16px', color: 'var(--accent-cyan)' }}>
              🖼️ Thumbnail
            </h3>
            {form.thumbnail && (
              <img src={form.thumbnail} alt="Thumbnail preview"
                style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px', border: '1px solid var(--border-subtle)' }} />
            )}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Image URL</label>
              <input className="form-control" value={form.thumbnail} id="game-thumbnail"
                onChange={e => setForm(f => ({ ...f, thumbnail: e.target.value }))}
                placeholder="https://... or /thumbnails/image.png" type="text" />
            </div>
          </div>

          {/* Categories */}
          <div style={{ background: 'var(--gradient-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--border-radius)', padding: '24px' }}>
            <h3 style={{ fontFamily: 'Orbitron', fontSize: '0.95rem', marginBottom: '16px', color: 'var(--accent-cyan)' }}>
              📂 Categories
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categories.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No categories yet. <a href="/admin/categories" style={{ color: 'var(--accent-cyan)' }}>Create one first.</a>
                </p>
              ) : (
                categories.map(cat => (
                  <label key={cat._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '8px', borderRadius: '6px', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <input type="checkbox" checked={form.categories.includes(cat._id)}
                      onChange={() => toggleCategory(cat._id)} id={`cat-check-${cat._id}`}
                      style={{ accentColor: 'var(--accent-cyan)', width: '16px', height: '16px' }} />
                    <span style={{ fontSize: '1.1rem' }}>{cat.icon}</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{cat.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Save button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button type="submit" className="btn btn-primary" disabled={saving} id="save-game-btn"
              style={{ justifyContent: 'center' }}>
              {saving ? 'Saving...' : (gameId ? '✓ Save Changes' : '+ Publish Game')}
            </button>
            <a href="/admin/games" className="btn btn-ghost" style={{ justifyContent: 'center', textAlign: 'center' }}>
              Cancel
            </a>
          </div>
        </div>
      </div>
    </form>
  );
}
