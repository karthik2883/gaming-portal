import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Menu from '@/lib/models/Menu';
import Category from '@/lib/models/Category'; // Register Category model for populate


export async function GET(req: NextRequest) {
  try {
    await connectDB();
    // Prevent treeshaking of Category model import
    const _ = Category;
    const { searchParams } = new URL(req.url);
    const position = searchParams.get('position');
    const activeOnly = searchParams.get('active') === 'true';

    const query: any = {};
    if (position) query.position = position;
    if (activeOnly) query.isActive = true;

    const menus = await Menu.find(query)
      .populate('categoryRef', 'name slug')
      .sort({ sortOrder: 1 })
      .lean(); // Return plain JS objects — much faster than Mongoose docs
    const response = NextResponse.json({ success: true, data: menus });
    // Menus rarely change — cache for 5 min at edge, serve stale for 1 hr
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    return response;
  } catch (error) {
    console.error("GET /api/menus error:", error);
    return NextResponse.json({ success: false, error: 'Failed to fetch menus' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const menu = await Menu.create(body);
    return NextResponse.json({ success: true, data: menu }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
