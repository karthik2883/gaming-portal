import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Game from '@/lib/models/Game';
import { revalidateTag } from 'next/cache';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    console.log("temp-migrate: Connected to production DB");

    const game = await Game.findOne({ slug: 'unblock-me' });
    if (!game) {
      return NextResponse.json({ success: false, error: 'Game unblock-me not found' });
    }

    const oldWidth = game.width;
    const oldHeight = game.height;

    game.width = 800;
    game.height = 600;
    await game.save();

    revalidateTag('games');

    console.log("temp-migrate: Updated unblock-me successfully!", { oldWidth, oldHeight });

    return NextResponse.json({
      success: true,
      message: 'unblock-me dimensions updated successfully to 800x600!',
      details: {
        gameId: game._id,
        oldWidth,
        oldHeight,
        newWidth: game.width,
        newHeight: game.height
      }
    });
  } catch (error: any) {
    console.error("temp-migrate error:", error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
