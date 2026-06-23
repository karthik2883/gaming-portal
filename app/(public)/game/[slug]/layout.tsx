import { Metadata } from 'next';
import { connectDB } from '@/lib/db';
import Game from '@/lib/models/Game';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  await connectDB();
  const game = await Game.findOne({ slug: params.slug }).lean() as any;

  if (!game) {
    return {
      title: 'Game Not Found',
    };
  }

  return {
    title: game.seoTitle || `${game.title} - Play Free Online`,
    description: game.seoDescription || game.description || `Play ${game.title} online for free.`,
    keywords: game.seoKeywords || game.tags?.join(', ') || 'games, online games',
    openGraph: {
      title: game.seoTitle || game.title,
      description: game.seoDescription || game.description,
      images: [
        {
          url: game.thumbnail,
          width: 800,
          height: 600,
        },
      ],
    },
  };
}

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
