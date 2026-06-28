import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { connectDB } from '@/lib/db';
import Game from '@/lib/models/Game';
import Category from '@/lib/models/Category'; // Register Category model for populate


export async function GET(req: NextRequest) {
  try {
    await connectDB();
    // Prevent treeshaking of Category model import
    const _ = Category;
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const activeOnly = searchParams.get('active') !== 'false';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || '-createdAt';
    const search = searchParams.get('search') || '';

    const query: any = {};
    if (activeOnly) query.isActive = true;
    if (category) query.categories = category;
    if (featured === 'true') query.featured = true;
    if (search) query.title = { $regex: search, $options: 'i' };

    const total = await Game.countDocuments(query);
    const games = await Game.find(query)
      .populate('categories', 'name slug icon')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    const response = NextResponse.json({
      success: true,
      data: games,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
    // Cache for 30 s, serve stale for up to 5 min while revalidating in background
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=300');
    return response;
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch games' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { title, slug } = body;

    if (!title || !slug) {
      return NextResponse.json({ success: false, error: 'Title and slug are required' }, { status: 400 });
    }

    const existing = await Game.findOne({ slug });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Slug already exists' }, { status: 409 });
    }

    const game = await Game.create(body);
    await game.populate('categories', 'name slug icon');
    revalidateTag('games');
    return NextResponse.json({ success: true, data: game }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
