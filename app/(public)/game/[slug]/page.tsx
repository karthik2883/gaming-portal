import { Metadata } from 'next';
import { getCachedGame } from '@/lib/cache';
import GamePlayPageClient from './GamePlayPageClient';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const game = await getCachedGame(params.slug);
  if (!game) {
    return {
      title: 'Game Not Found — FlipTrip Games',
      description: 'The requested game could not be found.',
    };
  }

  const title = game.seoTitle || `${game.title} — Play Free Online Game | FlipTrip Games`;
  const description = game.seoDescription || game.description || `Play ${game.title} for free in your browser. No downloads or installs required!`;
  const keywords = game.seoKeywords || (game.tags ? game.tags.join(', ') : undefined);
  const thumbnailUrl = game.thumbnail || '/fliptrip_logo.png';
  const ogImageUrl = thumbnailUrl.startsWith('http') ? thumbnailUrl : `https://www.fliptripgames.com${thumbnailUrl}`;

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      url: `https://www.fliptripgames.com/game/${game.slug}`,
      type: 'video.other',
      images: [
        {
          url: ogImageUrl,
          alt: game.title,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    }
  };
}

export default async function GamePlayPage({ params }: Props) {
  const game = await getCachedGame(params.slug);
  if (!game) {
    return <GamePlayPageClient game={null} params={params} />;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.fliptripgames.com';
  const genre = game.categories && game.categories.length > 0
    ? game.categories.map((c: any) => c.name).join(', ')
    : 'Online Game';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    'name': game.title,
    'description': game.seoDescription || game.description || `Play ${game.title} online for free in your browser.`,
    'genre': genre,
    'image': game.thumbnail ? (game.thumbnail.startsWith('http') ? game.thumbnail : `${baseUrl}${game.thumbnail}`) : `${baseUrl}/fliptrip_logo.png`,
    'url': `${baseUrl}/game/${game.slug}`,
    'playMode': game.tags?.includes('multiplayer') ? 'MultiPlayer' : 'SinglePlayer',
    'applicationCategory': 'Game',
    'operatingSystem': 'Windows, macOS, Linux, iOS, Android',
    'author': {
      '@type': 'Organization',
      'name': game.developer || 'FlipTrip Games'
    },
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': game.rating || 4.8,
      'ratingCount': game.playCount ? Math.floor(game.playCount / 10) + 12 : 38
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GamePlayPageClient game={game} params={params} />
    </>
  );
}
