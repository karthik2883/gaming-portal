import { Metadata } from 'next';
import { connectDB } from '@/lib/db';
import Category from '@/lib/models/Category';

export async function generateMetadata({ params }: { params: { category: string } }): Promise<Metadata> {
  await connectDB();
  const cat = await Category.findOne({ slug: params.category }).lean() as any;

  if (!cat) {
    return {
      title: 'Category Not Found',
    };
  }

  return {
    title: cat.seoTitle || `${cat.name} Games - Play Free Online`,
    description: cat.seoDescription || cat.description || `Play the best free online ${cat.name} games.`,
    keywords: cat.seoKeywords || `${cat.name} games, free online games, browser games`,
  };
}

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
