'use client';
import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/portal/Navbar';
import GameCard from '@/components/portal/GameCard';
import toast from 'react-hot-toast';
import styles from './page.module.css';

const PhaserGameEngine = dynamic(
  () => import('@/components/phaser/PhaserGameEngineV2'),
  { ssr: false, loading: () => <div className={styles.loadingGame}>Loading game engine...</div> }
);

interface Game {
  _id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  categories: Array<{ _id: string; name: string; slug: string; icon: string }>;
  gameType: 'iframe' | 'phaser';
  iframeUrl: string;
  phaserGameKey: string;
  width: number;
  height: number;
  featured: boolean;
  playCount: number;
  rating: number;
  developer: string;
  instructions: string;
}

export default function GamePlayPageClient({ game: initialGame, params }: { game: Game | null; params: { slug: string } }) {
  const [game, setGame] = useState<Game | null>(initialGame);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(!initialGame);
  const [fullscreen, setFullscreen] = useState(false);
  const [played, setPlayed] = useState(false);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!gameAreaRef.current) return;
    if (!document.fullscreenElement) {
      gameAreaRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Sidebar states
  const [activeTab, setActiveTab] = useState<'more' | 'leaderboard'>('more');
  const [scores, setScores] = useState<any[]>([]);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [submitScore, setSubmitScore] = useState<number | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [playerEmail, setPlayerEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load saved credentials on mount
  useEffect(() => {
    const savedName = localStorage.getItem('leaderboard_name');
    const savedEmail = localStorage.getItem('leaderboard_email');
    if (savedName) setPlayerName(savedName);
    if (savedEmail) setPlayerEmail(savedEmail);
  }, []);

  const fetchLeaderboard = async () => {
    if (!params.slug) return;
    setScoresLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?gameSlug=${params.slug}`);
      const data = await res.json();
      if (data.success) {
        setScores(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    }
    setScoresLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    setRelatedLoading(true);
    setRelated([]);

    async function load() {
      try {
        let currentGame = game;
        // If initialGame wasn't loaded on the server or slug changed, fetch game details dynamically
        if (!currentGame || currentGame.slug !== params.slug) {
          const gameRes = await fetch(`/api/games/${params.slug}`, { next: { revalidate: 60 } });
          const gameData = await gameRes.json();
          if (gameData.success && !cancelled) {
            currentGame = gameData.data;
            setGame(currentGame);
          }
        }

        // Fetch leaderboard ranking
        const lbRes = await fetch(`/api/leaderboard?gameSlug=${params.slug}`);
        const lbData = await lbRes.json();
        if (lbData.success && !cancelled) {
          setScores(lbData.data);
        }

        // Fetch related games if we have category info
        if (currentGame?.categories?.length) {
          const catId = typeof currentGame.categories[0] === 'object'
            ? (currentGame.categories[0] as any)._id
            : currentGame.categories[0];

          fetch(`/api/games?category=${catId}&limit=8&active=true`)
            .then(r => r.json())
            .then(relData => {
              if (cancelled) return;
              if (relData.success) {
                const filtered = relData.data.filter((g: any) => g.slug !== params.slug);
                if (filtered.length > 0) {
                  setRelated(filtered);
                  setRelatedLoading(false);
                } else {
                  // Fallback: fetch general active games if there are no other games in this category
                  fetch('/api/games?limit=9&active=true')
                    .then(r => r.json())
                    .then(fallbackData => {
                      if (cancelled) return;
                      if (fallbackData.success) {
                        const fbFiltered = fallbackData.data.filter((g: any) => g.slug !== params.slug);
                        setRelated(fbFiltered.slice(0, 8));
                      }
                      setRelatedLoading(false);
                    })
                    .catch(() => { setRelatedLoading(false); });
                }
              } else {
                setRelatedLoading(false);
              }
            })
            .catch(() => { setRelatedLoading(false); });
        } else {
          setRelatedLoading(false);
        }
      } catch {
        setRelatedLoading(false);
      }

      if (!cancelled) setLoading(false);
    }

    load();
    setActiveTab('more');

    return () => { cancelled = true; };
  }, [params.slug, initialGame]);

  // Increment play count once
  useEffect(() => {
    if (game && !played) {
      setPlayed(true);
      fetch(`/api/games/${game._id}/play`, { method: 'POST' }).catch(() => {});
    }
  }, [game, played]);

  // Listen for score events from Phaser
  useEffect(() => {
    const handleGameOver = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.score !== undefined) {
        setSubmitScore(customEvent.detail.score);
        setShowSubmitModal(true);
      }
    };
    window.addEventListener('phaser-game-over', handleGameOver);
    return () => {
      window.removeEventListener('phaser-game-over', handleGameOver);
    };
  }, []);

  const handleTabChange = (tab: 'more' | 'leaderboard') => {
    setActiveTab(tab);
    if (tab === 'leaderboard') {
      fetchLeaderboard();
    }
  };

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!game || submitScore === null) return;

    const name = playerName.trim();
    if (!name) {
      toast.error('Please enter your name');
      return;
    }

    if (name.length > 15) {
      toast.error('Name must be 15 characters or less');
      return;
    }

    const nameRegex = /^[a-zA-Z0-9 ]+$/;
    if (!nameRegex.test(name)) {
      toast.error('Name can only contain letters, numbers, and spaces');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameSlug: game.slug,
          name,
          email: playerEmail.trim() || undefined,
          score: submitScore
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.msg || 'Score submitted successfully!');
        localStorage.setItem('leaderboard_name', name);
        if (playerEmail.trim()) {
          localStorage.setItem('leaderboard_email', playerEmail.trim());
        } else {
          localStorage.removeItem('leaderboard_email');
        }
        setShowSubmitModal(false);
        setSubmitScore(null);
        fetchLeaderboard();
        setActiveTab('leaderboard');
      } else {
        toast.error(data.error || 'Failed to submit score');
      }
    } catch (err) {
      toast.error('Network error. Failed to submit score.');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className={styles.main}>
          <div className={styles.loadingWrap}>
            <div className={styles.spinner} />
            <p>Loading game...</p>
          </div>
        </main>
      </>
    );
  }

  if (!game) {
    return (
      <>
        <Navbar />
        <main className={styles.main} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎮</div>
            <h1 style={{ fontFamily: 'var(--font-orbitron), sans-serif', marginBottom: '12px' }}>Game Not Found</h1>
            <a href="/" className="btn btn-primary" style={{ display: 'inline-flex' }}>Back to Home</a>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className="container">
          {/* Breadcrumb */}
          <nav className={styles.breadcrumb}>
            <a href="/">Home</a>
            <span>›</span>
            {game.categories?.[0] && (
              <>
                <a href={`/${game.categories[0].slug}`}>{game.categories[0].name}</a>
                <span>›</span>
              </>
            )}
            <span>{game.title}</span>
          </nav>

          <div className={`${styles.layout} ${fullscreen ? styles.fullscreenLayout : ''}`}>
            {/* Game Embed */}
            <div className={styles.gameSection}>
              <div className={styles.gameHeader}>
                <div>
                  <h1 className={styles.gameTitle}>{game.title}</h1>
                  <div className={styles.gameMeta}>
                    {game.categories.map(cat => (
                      <a key={cat._id} href={`/${cat.slug}`} className="badge badge-cyan">
                        {cat.icon} {cat.name}
                      </a>
                    ))}
                    <span className={styles.playCount}>🎮 {game.playCount.toLocaleString()} plays</span>
                  </div>
                </div>
                <button
                  className={styles.fullscreenBtn}
                  onClick={toggleFullscreen}
                  title="Toggle fullscreen"
                >
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-orbitron), sans-serif', fontWeight: 'bold', letterSpacing: '1px' }}>
                    {fullscreen ? 'EXIT FULLSCREEN' : 'FULLSCREEN'}
                  </span>
                  <span>{fullscreen ? '⊡' : '⊞'}</span>
                </button>
              </div>

              {/* Game Area */}
              <div
                ref={gameAreaRef}
                className={`${styles.gameArea} ${game.slug === 'bubble-shooter' ? styles.bubbleShooterArea : ''}`}
              >
                {game.gameType === 'phaser' ? (
                  <PhaserGameEngine
                    gameKey={game.phaserGameKey || 'snake'}
                    width={game.width}
                    height={game.height}
                  />
                ) : game.iframeUrl ? (
                  <iframe
                    src={game.iframeUrl}
                    width="100%"
                    height="100%"
                    style={{
                      border: 'none',
                      borderRadius: '12px',
                      minHeight: '500px',
                      display: 'block',
                    }}
                    allow="fullscreen; autoplay"
                    allowFullScreen
                    title={game.title}
                    loading="lazy"
                  />
                ) : (
                  <div className={styles.noEmbed}>
                    <span>🎮</span>
                    <p>Game unavailable</p>
                  </div>
                )}
              </div>

              {/* Instructions */}
              {game.instructions && (
                <div className={styles.instructions}>
                  <h3>📋 How to Play</h3>
                  <p>{game.instructions}</p>
                </div>
              )}

              {/* Description */}
              {game.description && (
                <div className={styles.description}>
                  <h3>About this Game</h3>
                  <p>{game.description}</p>
                  {game.developer && (
                    <p className={styles.developer}>👨‍💻 Developer: {game.developer}</p>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar — More Games & Leaderboard */}
            {!fullscreen && (
              <aside className={styles.sidebar}>
                {/* Tab buttons — always visible */}
                <div className={styles.tabsHeader}>
                  <button
                    className={`${styles.tabBtn} ${activeTab === 'more' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('more')}
                  >
                    🎮 More Games
                  </button>
                  <button
                    className={`${styles.tabBtn} ${activeTab === 'leaderboard' ? styles.tabActive : ''}`}
                    onClick={() => {
                      setActiveTab('leaderboard');
                      if (scores.length === 0) fetchLeaderboard();
                    }}
                  >
                    🏆 Leaderboard
                  </button>
                </div>

                {activeTab === 'more' ? (
                  <div className={styles.relatedGrid}>
                    {relatedLoading ? (
                      // Skeleton cards while loading
                      Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className={styles.skeletonCard} />
                      ))
                    ) : related.length > 0 ? (
                      related.slice(0, 8).map((g: any) => (
                        <GameCard key={g._id} game={g} />
                      ))
                    ) : (
                      <div className={styles.noScores}>
                        <p>No related games found.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.leaderboardSection}>
                    {scoresLoading ? (
                      <div className={styles.scoresLoading}>
                        <div className={styles.smallSpinner} />
                        <p>Loading rankings...</p>
                      </div>
                    ) : scores.length === 0 ? (
                      <div className={styles.noScores}>
                        <p>No scores yet.</p>
                        <p className={styles.noScoresSubtitle}>Be the first to claim the top spot!</p>
                      </div>
                    ) : (
                      <div className={styles.scoresTable}>
                        <div className={styles.tableHeader}>
                          <span>Rank</span>
                          <span>Player</span>
                          <span>Score</span>
                        </div>
                        <div className={styles.tableBody}>
                          {scores.map((s, index) => {
                            let rankIcon = '';
                            if (index === 0) rankIcon = '🥇';
                            else if (index === 1) rankIcon = '🥈';
                            else if (index === 2) rankIcon = '🥉';
                            return (
                              <div key={s._id} className={styles.tableRow}>
                                <span className={styles.rankCol}>
                                  {rankIcon ? <span className={styles.rankEmoji}>{rankIcon}</span> : index + 1}
                                </span>
                                <span className={styles.nameCol} title={s.name}>{s.name}</span>
                                <span className={styles.scoreCol}>{s.score.toLocaleString()}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </aside>
            )}
          </div>
        </div>
      </main>

      {/* Score Submission Modal */}
      {showSubmitModal && submitScore !== null && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>🏆 NEW SCORE RECORDED</h2>
              <button
                className={styles.modalCloseBtn}
                onClick={() => { setShowSubmitModal(false); setSubmitScore(null); }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitScore} className={styles.modalForm}>
              <div className={styles.scoreDisplay}>
                <span className={styles.scoreVal}>{submitScore.toLocaleString()}</span>
                <span className={styles.scoreLabel}>POINTS ACHIEVED</span>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="player-name">Player Name (Unique)</label>
                <input
                  id="player-name"
                  type="text"
                  placeholder="e.g. NeoCoder"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={15}
                  required
                  className={styles.modalInput}
                  autoFocus
                />
                <span className={styles.inputHelp}>Alphanumeric, max 15 characters</span>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="player-email">Email (Optional - To Lock Name)</label>
                <input
                  id="player-email"
                  type="email"
                  placeholder="e.g. player@example.com"
                  value={playerEmail}
                  onChange={(e) => setPlayerEmail(e.target.value)}
                  className={styles.modalInput}
                />
                <span className={styles.inputHelp}>Secure your name so others cannot overwrite your high score</span>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setShowSubmitModal(false); setSubmitScore(null); }}
                  disabled={submitting}
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Save to Leaderboard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
