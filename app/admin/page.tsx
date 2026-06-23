import { connectDB } from '@/lib/db';
import Category from '@/lib/models/Category';
import Game from '@/lib/models/Game';
import Menu from '@/lib/models/Menu';
import Link from 'next/link';
import styles from './dashboard.module.css';

export const dynamic = 'force-dynamic';

async function getStats() {
  try {
    await connectDB();
    const [totalGames, totalCategories, totalMenus, featuredGames, recentGames] = await Promise.all([
      Game.countDocuments({}),
      Category.countDocuments({}),
      Menu.countDocuments({}),
      Game.countDocuments({ featured: true }),
      Game.find({}).sort({ createdAt: -1 }).limit(5).populate('categories', 'name icon'),
    ]);

    const playStats = await Game.aggregate([
      { $group: { _id: null, totalPlays: { $sum: '$playCount' } } },
    ]);

    return {
      totalGames,
      totalCategories,
      totalMenus,
      featuredGames,
      totalPlays: playStats[0]?.totalPlays || 0,
      recentGames: JSON.parse(JSON.stringify(recentGames)),
    };
  } catch (err) {
    console.error('Error fetching stats:', err);
    return {
      totalGames: 0,
      totalCategories: 0,
      totalMenus: 0,
      featuredGames: 0,
      totalPlays: 0,
      recentGames: [],
    };
  }
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSubtitle}>Welcome back, Admin! Here's your portal overview.</p>
        </div>
        <Link href="/admin/games/new" className="btn btn-primary">
          + Add Game
        </Link>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className="stat-card">
          <div className="stat-label">Total Games</div>
          <div className="stat-value">{stats.totalGames}</div>
          <div style={{ fontSize: '1.5rem' }}>🎮</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Categories</div>
          <div className="stat-value">{stats.totalCategories}</div>
          <div style={{ fontSize: '1.5rem' }}>📂</div>
        </div>
        <div className="stat-card" style={{ '--accent': 'var(--accent-green)' } as any}>
          <div className="stat-label">Total Plays</div>
          <div className="stat-value" style={{ color: 'var(--accent-green)' }}>
            {stats.totalPlays >= 1000
              ? `${(stats.totalPlays / 1000).toFixed(1)}k`
              : stats.totalPlays}
          </div>
          <div style={{ fontSize: '1.5rem' }}>🕹️</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Featured Games</div>
          <div className="stat-value" style={{ color: 'var(--accent-orange)' }}>{stats.featuredGames}</div>
          <div style={{ fontSize: '1.5rem' }}>⭐</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Menu Items</div>
          <div className="stat-value" style={{ color: 'var(--accent-purple)' }}>
            {stats.totalMenus}
          </div>
          <div style={{ fontSize: '1.5rem' }}>☰</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.actionGrid}>
          <Link href="/admin/games/new" className={styles.actionCard} id="action-add-game">
            <span className={styles.actionIcon}>🎮</span>
            <span className={styles.actionLabel}>Add Game</span>
          </Link>
          <Link href="/admin/categories" className={styles.actionCard} id="action-categories">
            <span className={styles.actionIcon}>📂</span>
            <span className={styles.actionLabel}>Manage Categories</span>
          </Link>
          <Link href="/admin/menus" className={styles.actionCard} id="action-menus">
            <span className={styles.actionIcon}>☰</span>
            <span className={styles.actionLabel}>Edit Menus</span>
          </Link>
          <a href="/" target="_blank" className={styles.actionCard} id="action-view-portal" rel="noopener noreferrer">
            <span className={styles.actionIcon}>🌐</span>
            <span className={styles.actionLabel}>View Portal</span>
          </a>
        </div>
      </div>

      {/* Recent Games */}
      {stats.recentGames.length > 0 && (
        <div className={styles.recentSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Games</h2>
            <Link href="/admin/games" className="btn btn-ghost btn-sm">View All →</Link>
          </div>
          <div className={styles.tableWrap}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Categories</th>
                  <th>Type</th>
                  <th>Plays</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentGames.map((game: any) => (
                  <tr key={game._id.toString()}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {game.thumbnail && (
                          <img src={game.thumbnail} alt="" width={36} height={36}
                            style={{ borderRadius: '6px', objectFit: 'cover' }} />
                        )}
                        <div>
                          <div style={{ fontWeight: 600 }}>{game.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{game.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {game.categories?.slice(0, 2).map((cat: any) => (
                          <span key={cat._id} className="badge badge-cyan">
                            {cat.icon} {cat.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${game.gameType === 'phaser' ? 'badge-green' : 'badge-purple'}`}>
                        {game.gameType === 'phaser' ? '⚡ Phaser' : '🔗 iframe'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{game.playCount.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${game.isActive ? 'badge-green' : ''}`}
                        style={!game.isActive ? { background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' } : {}}>
                        {game.isActive ? '✓ Active' : '✗ Inactive'}
                      </span>
                    </td>
                    <td>
                      <Link href={`/admin/games/${game._id}`} className="btn btn-ghost btn-sm">Edit</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
