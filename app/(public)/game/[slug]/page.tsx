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

  const title = `${game.title} — Play Free Online Game | FlipTrip Games`;
  const description = game.description || `Play ${game.title} for free in your browser. No downloads or installs required!`;
  const thumbnailUrl = game.thumbnail || '/fliptrip_logo.png';

  return {
    title,
    description,
    keywords: game.tags ? game.tags.join(', ') : undefined,
    openGraph: {
      title,
      description,
      url: `https://www.fliptripgames.com/game/${game.slug}`,
      type: 'video.other',
      images: [
        {
          url: thumbnailUrl,
          alt: game.title,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [thumbnailUrl],
    }
  };
}

export default async function GamePlayPage({ params }: Props) {
  const game = await getCachedGame(params.slug);
  return <GamePlayPageClient game={game} params={params} />;
}
