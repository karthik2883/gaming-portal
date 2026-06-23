import Link from 'next/link';
import Image from 'next/image';
import styles from './GameCard.module.css';

interface Game {
  _id: string;
  title: string;
  slug: string;
  thumbnail: string;
  categories: Array<{ name: string; slug: string; icon: string }>;
  featured: boolean;
  playCount: number;
  rating: number;
  gameType: string;
}

interface GameCardProps {
  game: Game;
  size?: '1x1' | '2x2' | '2x1' | '1x2';
  priority?: boolean; // pass true for above-the-fold cards
}

export default function GameCard({ game, size = '1x1', priority = false }: GameCardProps) {
  const primaryCategory = game.categories?.[0];

  const spanClass =
    size === '2x2' ? styles.card2x2 :
    size === '2x1' ? styles.card2x1 :
    size === '1x2' ? styles.card1x2 :
    styles.card1x1;

  return (
    <Link href={`/game/${game.slug}`} className={`${styles.card} ${spanClass}`} id={`game-${game.slug}`}>
      <div className={styles.thumbnailWrap}>
        {game.thumbnail ? (
          <Image
            src={game.thumbnail}
            alt={game.title}
            fill
            sizes={
              size === '2x2' ? '(max-width:768px) 100vw, 300px' :
              size === '2x1' ? '(max-width:768px) 100vw, 280px' :
              '(max-width:768px) 50vw, 140px'
            }
            className={styles.thumbnail}
            loading={priority ? 'eager' : 'lazy'}
            priority={priority}
            fetchPriority={priority ? 'high' : 'auto'}
          />
        ) : (
          <div className={styles.thumbnailFallback}>
            <span>🎮</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className={styles.overlay}>
          <div className={styles.playBtn}>
            <span>▶</span>
          </div>
        </div>

        {/* Badges (only show on larger cards) */}
        {size !== '1x1' && (
          <div className={styles.badges}>
            {game.featured && (
              <span className={`${styles.badge} ${styles.badgeFeatured}`}>⭐ Featured</span>
            )}
            {game.gameType === 'phaser' && (
              <span className={`${styles.badge} ${styles.badgePhaser}`}>⚡ Built-in</span>
            )}
          </div>
        )}

        {/* Bottom text overlay */}
        <div className={styles.infoOverlay}>
          <h3 className={styles.title}>{game.title}</h3>
          {size !== '1x1' && (
            <div className={styles.meta}>
              {primaryCategory && (
                <span className={styles.category}>
                  {primaryCategory.icon} {primaryCategory.name}
                </span>
              )}
              {game.playCount > 0 && (
                <span className={styles.plays}>
                  🎮 {game.playCount >= 1000
                    ? `${(game.playCount / 1000).toFixed(1)}k`
                    : game.playCount}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
