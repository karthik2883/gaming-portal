'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Game {
  _id: string;
  title: string;
  slug: string;
  thumbnail: string;
  categories: Array<{ _id: string; name: string; icon: string }>;
  gameType: 'iframe' | 'phaser';
  featured: boolean;
  isActive: boolean;
  playCount: number;
  createdAt: string;
}

export default function GamesListPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15', active: 'false' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/games?${params}`);
      const data = await res.json();
      if (data.success) {
        setGames(data.data);
        setTotal(data.pagination.total);
      }
    } catch { toast.error('Failed to load games'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      const res = await fetch(`/api/games/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { toast.success('Game deleted'); load(); }
      else toast.error(data.error);
    } catch { toast.error('Failed'); }
  };

  const toggleActive = async (game: Game) => {
    try {
      const res = await fetch(`/api/games/${game._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !game.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.data.isActive ? 'Game activated' : 'Game deactivated');
        load();
      }
    } catch { toast.error('Failed'); }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'Orbitron', fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', marginBottom: '4px' }}>
            🎮 Games
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {total} total games
          </p>
        </div>
        <Link href="/admin/games/new" className="btn btn-primary" id="add-game-btn">
          + Add Game
        </Link>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <input
          className="form-control"
          placeholder="Search games..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          id="search-games"
          style={{ maxWidth: '340px' }}
        />
        <button type="submit" className="btn btn-secondary">Search</button>
        {search && (
          <button type="button" className="btn btn-ghost" onClick={() => { setSearch(''); setTimeout(load, 0); }}>
            Clear
          </button>
        )}
      </form>

      {/* Table */}
      <div style={{ background: 'var(--gradient-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--border-radius)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading games...</div>
        ) : games.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🎮</div>
            <h2 style={{ fontFamily: 'Orbitron', marginBottom: '12px', fontSize: '1.2rem' }}>No Games Found</h2>
            <Link href="/admin/games/new" className="btn btn-primary" style={{ display: 'inline-flex' }}>
              Add Your First Game
            </Link>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Game</th>
                    <th>Categories</th>
                    <th>Type</th>
                    <th>Plays</th>
                    <th>Featured</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map(game => (
                    <tr key={game._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {game.thumbnail ? (
                            <img src={game.thumbnail} alt="" width={48} height={36}
                              style={{ borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 48, height: 36, background: 'var(--bg-card)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>🎮</div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{game.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{game.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {game.categories?.slice(0, 2).map(cat => (
                            <span key={cat._id} className="badge badge-cyan">{cat.icon} {cat.name}</span>
                          ))}
                          {game.categories?.length > 2 && (
                            <span className="badge" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)' }}>
                              +{game.categories.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${game.gameType === 'phaser' ? 'badge-green' : 'badge-purple'}`}>
                          {game.gameType === 'phaser' ? '⚡ Phaser' : '🔗 iframe'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{game.playCount.toLocaleString()}</td>
                      <td>
                        {game.featured && <span className="badge badge-featured">⭐ Yes</span>}
                      </td>
                      <td>
                        <button onClick={() => toggleActive(game)}
                          className={`badge ${game.isActive ? 'badge-green' : ''}`}
                          id={`toggle-${game._id}`}
                          style={{
                            cursor: 'pointer', border: 'none',
                            ...(game.isActive ? {} : { background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' })
                          }}>
                          {game.isActive ? '✓ Active' : '✗ Inactive'}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <Link href={`/admin/games/${game._id}`} className="btn btn-ghost btn-sm" id={`edit-game-${game._id}`}>
                            ✏️
                          </Link>
                          <a href={`/game/${game.slug}`} target="_blank" className="btn btn-ghost btn-sm" rel="noopener noreferrer">
                            👁️
                          </a>
                          <button className="btn btn-danger btn-sm" id={`delete-game-${game._id}`}
                            onClick={() => handleDelete(game._id, game.title)}>
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Page {page} of {Math.ceil(total / 15)}
              </span>
              <button className="btn btn-ghost btn-sm" disabled={page >= Math.ceil(total / 15)} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
