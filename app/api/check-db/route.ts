import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Game from '@/lib/models/Game';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const games = await Game.find({}, 'title slug width height').lean();
    return NextResponse.json({ success: true, games });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
