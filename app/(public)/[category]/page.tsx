import { Metadata } from 'next';
import Navbar from '@/components/portal/Navbar';
import Footer from '@/components/portal/Footer';
import GameCard from '@/components/portal/GameCard';
import { connectDB } from '@/lib/db';
import CategoryModel from '@/lib/models/Category';
import GameModel from '@/lib/models/Game';

export const revalidate = 60; // Revalidate category pages every 60 s

interface Props {
  params: { category: string };
}

async function getCategoryData(slug: string) {
  try {
    await connectDB();
    const category = await CategoryModel.findOne({ slug, isActive: true }).lean();
    if (!category) return { category: null, games: [] };
    const games = await GameModel
      .find({ categories: (category as any)._id, isActive: true })
      .sort({ playCount: -1 })
      .lean();
    return {
      category: JSON.parse(JSON.stringify(category)),
      games: JSON.parse(JSON.stringify(games)),
    };
  } catch {
    return { category: null, games: [] };
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await getCategoryData(params.category);
  const title = category ? `${category.name} Games — FlipTrip Games` : 'Category — FlipTrip Games';
  const description = category?.description || `Play free ${params.category} games online. No downloads required!`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.fliptripgames.com/${params.category}`,
      type: 'website',
      images: [
        {
          url: '/fliptrip_logo.png',
          width: 1024,
          height: 1024,
          alt: category?.name || 'FlipTrip Games',
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/fliptrip_logo.png'],
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category, games } = await getCategoryData(params.category);

  if (!category) {
    return (
      <>
        <Navbar />
        <main style={{ paddingTop: 'var(--nav-height)', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>😕</div>
            <h1 style={{ fontFamily: 'Orbitron', marginBottom: '12px' }}>Category Not Found</h1>
            <a href="/" className="btn btn-primary" style={{ display: 'inline-flex' }}>Back to Home</a>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 'var(--nav-height)' }}>
        {/* Category Header */}
        <section style={{
          background: 'linear-gradient(180deg, rgba(0,212,255,0.05) 0%, transparent 100%)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '48px 0 32px'
        }}>
          <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
              <span style={{ fontSize: '3rem' }}>{category.icon}</span>
              <div>
                <h1 style={{ fontFamily: 'Orbitron', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', marginBottom: '8px' }}>
                  <span className="text-gradient-cyan">{category.name}</span> Games
                </h1>
                {category.description && (
                  <p style={{ color: 'var(--text-secondary)' }}>{category.description}</p>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <a href="/" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Home</a>
              <span style={{ color: 'var(--text-muted)' }}>›</span>
              <span style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem' }}>{category.name}</span>
            </div>
          </div>
        </section>

        {/* Games Grid */}
        <section className="section">
          <div className="container">
            {games.length > 0 ? (
              <>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
                  {games.length} game{games.length !== 1 ? 's' : ''} found
                </p>
                <div className="grid-games stagger-children">
                  {games.map((game: any) => (
                    <GameCard key={game._id} game={game} />
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎮</div>
                <h2 style={{ fontFamily: 'Orbitron', marginBottom: '12px' }}>No Games Yet</h2>
                <p>Check back soon for new {category.name} games!</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
