import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Score from '@/lib/models/Score';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const gameSlug = searchParams.get('gameSlug');

    if (!gameSlug) {
      return NextResponse.json({ success: false, error: 'gameSlug is required' }, { status: 400 });
    }

    // Fetch top 10 scores, sorting by score descending, then createdAt ascending (older is better for ties)
    // Explicitly do not select email to keep it secure
    const topScores = await Score.find({ gameSlug: gameSlug.toLowerCase() })
      .sort({ score: -1, createdAt: 1 })
      .limit(10);

    return NextResponse.json({
      success: true,
      data: topScores,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch scores' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { gameSlug, name, email, score } = body;

    // Basic Validation
    if (!gameSlug || !name || score === undefined) {
      return NextResponse.json({ success: false, error: 'gameSlug, name, and score are required' }, { status: 400 });
    }

    const cleanName = name.trim();
    if (cleanName.length === 0 || cleanName.length > 15) {
      return NextResponse.json({ success: false, error: 'Name must be between 1 and 15 characters' }, { status: 400 });
    }

    const nameRegex = /^[a-zA-Z0-9 ]+$/;
    if (!nameRegex.test(cleanName)) {
      return NextResponse.json({ success: false, error: 'Name can only contain letters, numbers, and spaces' }, { status: 400 });
    }

    const numericScore = Number(score);
    if (isNaN(numericScore) || numericScore < 0) {
      return NextResponse.json({ success: false, error: 'Score must be a positive number' }, { status: 400 });
    }

    const cleanEmail = email ? email.trim().toLowerCase() : null;
    const slug = gameSlug.trim().toLowerCase();

    // Check if player name already exists for this game (fetching select:false email field explicitly)
    const existing = await Score.findOne({ gameSlug: slug, name: cleanName }).select('+email');

    if (existing) {
      // Name exists. Check if it's protected by an email
      if (existing.email) {
        // If protected, require the correct matching email to proceed
        if (!cleanEmail || existing.email !== cleanEmail) {
          return NextResponse.json({
            success: false,
            error: 'This name is registered with an email. Please provide the correct email to update your score.'
          }, { status: 400 });
        }
      }

      // If email matches OR existing entry was not protected by an email
      let updated = false;
      let msg = 'Score submitted!';

      // If they provided an email now, but the existing entry had none, we register it
      if (cleanEmail && !existing.email) {
        existing.email = cleanEmail;
        updated = true;
      }

      if (numericScore > existing.score) {
        existing.score = numericScore;
        updated = true;
        msg = 'New high score saved!';
      } else {
        msg = 'Score submitted, but your existing high score is higher!';
      }

      if (updated) {
        await existing.save();
      }

      return NextResponse.json({
        success: true,
        updated,
        msg,
        data: {
          name: existing.name,
          score: existing.score,
        }
      });
    }

    // Name does not exist. Create new entry
    const newScore = await Score.create({
      gameSlug: slug,
      name: cleanName,
      email: cleanEmail || undefined,
      score: numericScore,
    });

    return NextResponse.json({
      success: true,
      updated: true,
      msg: 'Score saved to leaderboard!',
      data: {
        name: newScore.name,
        score: newScore.score,
      }
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to submit score' }, { status: 500 });
  }
}
