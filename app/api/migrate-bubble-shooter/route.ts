import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Game from '@/lib/models/Game';
import { revalidateTag } from 'next/cache';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    console.log("migrate-bubble-shooter: Connected to production DB");

    const game = await Game.findOne({ slug: 'bubble-shooter' });
    if (!game) {
      return NextResponse.json({ success: false, error: 'Game bubble-shooter not found' });
    }

    const oldWidth = game.width;
    const oldHeight = game.height;

    game.width = 800;
    game.height = 600;
    await game.save();

    revalidateTag('games');

    console.log("migrate-bubble-shooter: Updated bubble-shooter successfully!", { oldWidth, oldHeight });

    return NextResponse.json({
      success: true,
      message: 'bubble-shooter dimensions updated successfully to 800x600!',
      details: {
        gameId: game._id,
        oldWidth,
        oldHeight,
        newWidth: game.width,
        newHeight: game.height
      }
    });
  } catch (error: any) {
    console.error("migrate-bubble-shooter error:", error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
