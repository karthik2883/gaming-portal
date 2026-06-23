import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Game from '@/lib/models/Game';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const game = await Game.findByIdAndUpdate(
      params.id,
      { $inc: { playCount: 1 } },
      { new: true }
    );
    if (!game) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, playCount: game.playCount });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update play count' }, { status: 500 });
  }
}
