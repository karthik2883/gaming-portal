import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import HomepageConfig from '@/lib/models/HomepageConfig';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    let config = await HomepageConfig.findOne({ key: 'main' });
    if (!config) {
      config = await HomepageConfig.create({ key: 'main' });
    }
    return NextResponse.json({ success: true, data: config });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { title, subtitle, ads } = body;

    let config = await HomepageConfig.findOne({ key: 'main' });
    if (!config) {
      config = new HomepageConfig({ key: 'main' });
    }

    config.title = title || '';
    config.subtitle = subtitle || '';
    if (ads) {
      config.ads = ads;
    }

    await config.save();
    return NextResponse.json({ success: true, data: config });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to save settings' }, { status: 500 });
  }
}
