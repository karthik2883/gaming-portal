import { Metadata } from 'next';
import Navbar from '@/components/portal/Navbar';
import GameCard from '@/components/portal/GameCard';
import AdSkyscrapers from '@/components/portal/AdSkyscrapers';
import GridAdCard from '@/components/portal/GridAdCard';
import styles from './page.module.css';
import Link from 'next/link';
import { connectDB } from '@/lib/db';
import GameModel from '@/lib/models/Game';
import { getCachedGames, getCachedCategories, getCachedHomepageConfig } from '@/lib/cache';

// Revalidate every 30 seconds — serves cached HTML instantly, refreshes in background.
export const revalidate = 30;

export const metadata: Metadata = {
  title: 'FlipTrip Games — Play Free Online Games Instantly',
  description: 'Discover and play hundreds of free online games. Action, puzzle, racing, sports, and more. No downloads needed!',
  openGraph: {
    title: 'FlipTrip Games — Play Free Online Games Instantly',
    description: 'Discover and play hundreds of free online games. Action, puzzle, racing, sports, and more. No downloads needed!',
    url: 'https://www.fliptripgames.com',
    type: 'website',
    images: [
      {
        url: '/fliptrip_logo.png',
        width: 1024,
        height: 1024,
        alt: 'FlipTrip Games',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FlipTrip Games — Play Free Online Games Instantly',
    description: 'Discover and play hundreds of free online games. Action, puzzle, racing, sports, and more. No downloads needed!',
    images: ['/fliptrip_logo.png'],
  },
};

interface GridItem {
  type: 'game' | 'category' | 'ad';
  size: '1x1' | '2x2' | '2x1' | '1x2';
  data: any;
}

async function getHomeData(searchQuery?: string) {
  try {
    if (searchQuery) {
      // Search bypasses cache since query is dynamic
      await connectDB();
      const games = await GameModel.find({
        isActive: true,
        title: { $regex: searchQuery, $options: 'i' },
      })
        .populate('categories', 'name slug icon')
        .lean();

      return {
        games: JSON.parse(JSON.stringify(games)),
        categories: [],
        homepageConfig: null,
        isSearch: true,
      };
    }

    // Use cached versions — DB is only hit once per revalidation window
    const [games, categories, homepageConfig] = await Promise.all([
      getCachedGames(40),
      getCachedCategories(),
      getCachedHomepageConfig(),
    ]);

    return { games, categories, homepageConfig, isSearch: false };
  } catch (err) {
    console.error('Error fetching home data:', err);
    return { games: [], categories: [], homepageConfig: null, isSearch: false };
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: { search?: string };
}) {
  const searchQuery = searchParams?.search || '';
  const { games, categories, homepageConfig, isSearch } = await getHomeData(searchQuery);

  const defaultTitle = 'FLIPTRIP GAMES';
  const defaultSubtitle = 'Play free online games instantly. No downloads, no signup!';
  const defaultAds = [
    {
      position: 'leaderboard',
      title: 'NEON RIDER OUT NOW',
      description: 'Rev your lightcycle in a stunning cyber-grid synthwave racer!',
      icon: '🏎️',
      link: '/game/neon-rider',
      colorTheme: 'cyan',
      isActive: true
    },
    {
      position: 'skyscraper-left',
      title: 'NEON RIDER',
      description: 'Race through the grid in pseudo-3D lightcycle action!',
      icon: '🕹️',
      link: '/game/neon-rider',
      colorTheme: 'cyan',
      isActive: true
    },
    {
      position: 'skyscraper-right',
      title: 'BREAKOUT',
      description: 'Break glowing blocks with real particle trail physics!',
      icon: '🧱',
      link: '/game/breakout',
      colorTheme: 'green',
      isActive: true
    },
    {
      position: 'in-grid',
      gridIndex: 3,
      size: '2x2',
      title: 'NEON RIDER',
      description: 'Speed through 3D hills, hills, and sharp bends in our cyber-synthwave racing adventure.',
      icon: '🏎️',
      link: '/game/neon-rider',
      colorTheme: 'cyan',
      isActive: true
    },
    {
      position: 'in-grid',
      gridIndex: 14,
      size: '2x1',
      title: 'TETRIS NEO',
      description: 'Stack colorful blocks and clear lines with a smooth drop guide and delay mechanics.',
      icon: '🕹️',
      link: '/game/tetris-neo',
      colorTheme: 'default',
      isActive: true
    },
    {
      position: 'in-grid',
      gridIndex: 27,
      size: '2x2',
      title: 'SUDOKU NEO',
      description: 'Challenge your mind with recursive solver matrices and 8-bit synthetic soundscapes.',
      icon: '⬡',
      link: '/game/sudoku-neo',
      colorTheme: 'cyan',
      isActive: true
    }
  ];

  const pageTitle = homepageConfig?.title || defaultTitle;
  const pageSubtitle = homepageConfig?.subtitle || defaultSubtitle;
  const ads = homepageConfig?.ads || defaultAds;

  const leaderboardAd = ads.find((a: any) => a.position === 'leaderboard' && a.isActive);
  const leftAd = ads.find((a: any) => a.position === 'skyscraper-left' && a.isActive);
  const rightAd = ads.find((a: any) => a.position === 'skyscraper-right' && a.isActive);

  // Build Poki Grid Items mixing games, categories, and ads
  const gridItems: GridItem[] = [];
  if (!isSearch) {
    let gameIdx = 0;
    let catIdx = 0;
    const maxItems = 45;

    for (let i = 0; i < maxItems; i++) {
      const gridAd = ads.find((a: any) => a.position === 'in-grid' && a.gridIndex === i && a.isActive);
      if (gridAd) {
        gridItems.push({
          type: 'ad',
          size: gridAd.size || '2x1',
          data: gridAd,
        });
      } else if (
        [4, 8, 12, 18, 22, 26, 32, 36, 40].includes(i) &&
        catIdx < categories.length
      ) {
        gridItems.push({
          type: 'category',
          size: '1x1',
          data: categories[catIdx++],
        });
      } else {
        if (gameIdx < games.length) {
          let size: '1x1' | '2x2' | '2x1' | '1x2' = '1x1';
          if (i === 0 || i === 6 || i === 20 || i === 30 || i === 42) {
            size = '2x2';
          } else if (i === 9 || i === 17 || i === 33 || i === 41) {
            size = '2x1';
          } else if (i === 11 || i === 23 || i === 37) {
            size = '1x2';
          }
          gridItems.push({
            type: 'game',
            size,
            data: games[gameIdx++],
          });
        } else if (catIdx < categories.length) {
          gridItems.push({
            type: 'category',
            size: '1x1',
            data: categories[catIdx++],
          });
        }
      }
    }

    // Append any leftover games with a visual pattern
    while (gameIdx < games.length) {
      let size: '1x1' | '2x2' | '2x1' | '1x2' = '1x1';
      const idx = gridItems.length;
      if (idx % 15 === 0) {
        size = '2x2';
      } else if (idx % 15 === 7) {
        size = '2x1';
      } else if (idx % 15 === 11) {
        size = '1x2';
      }
      gridItems.push({
        type: 'game',
        size,
        data: games[gameIdx++],
      });
    }

    // Append any leftover categories
    while (catIdx < categories.length) {
      gridItems.push({
        type: 'category',
        size: '1x1',
        data: categories[catIdx++],
      });
    }
  }

  const firstWord = pageTitle.split(' ')[0];
  const restWords = pageTitle.split(' ').slice(1).join(' ');

  return (
    <>
      <Navbar />
      <AdSkyscrapers leftAd={leftAd} rightAd={rightAd} />
      
      <main className={styles.main}>
        {/* Top Leaderboard Ad */}
        {leaderboardAd && (
          <div className="container" style={{ paddingTop: '20px' }}>
            <div className={styles.leaderboardAd}>
              <div style={{
                position: 'absolute',
                top: '4px',
                left: '8px',
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}>
                Advertisement
              </div>
              <div className={styles.leaderboardContent}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '2rem' }}>{leaderboardAd.icon || '📢'}</span>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-orbitron)',
                      fontSize: '1rem',
                      fontWeight: 800,
                      color: leaderboardAd.colorTheme === 'green' ? '#39ff14' : (leaderboardAd.colorTheme === 'cyan' ? '#00d4ff' : '#ff0055'),
                      textShadow: `0 0 10px ${leaderboardAd.colorTheme === 'green' ? 'rgba(57, 255, 20, 0.5)' : (leaderboardAd.colorTheme === 'cyan' ? 'rgba(0, 212, 255, 0.5)' : 'rgba(255, 0, 85, 0.5)')}`
                    }}>
                      {leaderboardAd.title}
                    </div>
                    <div className={styles.leaderboardAdText}>
                      {leaderboardAd.description}
                    </div>
                  </div>
                </div>
                <a href={leaderboardAd.link} className={`${styles.adBtn} ${leaderboardAd.colorTheme === 'cyan' ? styles.adBtnCyan : ''}`} style={{ textDecoration: 'none' }}>
                  PLAY NOW
                </a>
              </div>
            </div>
          </div>
        )}

        {isSearch ? (
          <section className="section" style={{ minHeight: '60vh' }}>
            <div className="container">
              <h2 className="section-title">
                <span>🔍</span> Search Results for <span className="text-gradient-cyan">"{searchQuery}"</span>
              </h2>
              {games.length > 0 ? (
                <div className="grid-games">
                  {games.map((game: any) => (
                    <GameCard key={game._id} game={game} size="1x1" />
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '16px' }}>😢</div>
                  <h3 style={{ fontFamily: 'var(--font-orbitron)' }}>No Games Found</h3>
                  <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
                    We couldn't find any games matching "{searchQuery}". Try a different keyword!
                  </p>
                  <Link href="/" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>
                    Back to Homepage
                  </Link>
                </div>
              )}
            </div>
          </section>
        ) : (
          <>
            {/* Poki Title Badge */}
            <div className="container" style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h1 style={{ fontFamily: 'var(--font-orbitron)', fontSize: '1.8rem', fontWeight: 800, margin: '10px 0 5px' }}>
                <span className="text-gradient-cyan">{firstWord}</span>{' '}
                {restWords}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                {pageSubtitle}
              </p>
            </div>

            {/* Poki Dense Grid */}
            <section className="section" style={{ paddingTop: '0' }}>
              <div className="container">
                {gridItems.length > 0 ? (
                  <div className={styles.pokiGrid}>
                    {gridItems.map((item, index) => {
                      if (item.type === 'game') {
                        return <GameCard key={`game-${item.data._id}-${index}`} game={item.data} size={item.size} priority={index < 8} />;
                      }
                      if (item.type === 'category') {
                        return (
                          <Link
                            key={`cat-${item.data._id}-${index}`}
                            href={`/${item.data.slug}`}
                            className={styles.categoryCard}
                            id={`cat-${item.data.slug}`}
                          >
                            <span className={styles.catIcon}>{item.data.icon}</span>
                            <span className={styles.catName}>{item.data.name}</span>
                          </Link>
                        );
                      }
                      if (item.type === 'ad') {
                        return (
                          <GridAdCard
                            key={`ad-${index}`}
                            size={item.size as '2x2' | '2x1'}
                            ad={item.data}
                          />
                        );
                      }
                      return null;
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎮</div>
                    <h2 style={{ fontFamily: 'var(--font-orbitron)' }}>No Games Yet</h2>
                    <p style={{ color: 'var(--text-muted)' }}>
                      Check back soon as we load up new games!
                    </p>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerContent}>
            <div className={styles.footerBrand}>
              <img src="/fliptrip_logo.png" alt="FlipTrip Games" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'contain' }} />
              <span className={styles.footerLogo}>
                <span className="text-gradient-cyan">FlipTrip</span>
                <span style={{ color: '#a78bfa' }}> Games</span>
              </span>
            </div>
            <p className={styles.footerText}>
              &copy; 2026 FlipTrip Games. Play free online games, no download required.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
