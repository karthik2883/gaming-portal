import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { connectDB } from '@/lib/db';
import Game from '@/lib/models/Game';
import Category from '@/lib/models/Category'; // Register Category model for populate

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    // Prevent treeshaking of Category model import
    const _ = Category;
    // Support both ID and slug lookup
    const isObjectId = params.id.match(/^[a-f\d]{24}$/i);
    const query = isObjectId ? { _id: params.id } : { slug: params.id };
    const game = await Game.findOne(query).populate('categories', 'name slug icon').lean();
    if (!game) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    const response = NextResponse.json({ success: true, data: game });
    // Cache for 60 s at the edge, serve stale for 10 min while revalidating
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=600');
    return response;
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const body = await req.json();
    const game = await Game.findByIdAndUpdate(params.id, body, { new: true, runValidators: true })
      .populate('categories', 'name slug icon');
    if (!game) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    revalidateTag('games');
    return NextResponse.json({ success: true, data: game });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const game = await Game.findByIdAndDelete(params.id);
    if (!game) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    revalidateTag('games');
    return NextResponse.json({ success: true, message: 'Game deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete' }, { status: 500 });
  }
}
