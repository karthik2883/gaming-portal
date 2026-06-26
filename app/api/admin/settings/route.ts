import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Settings from '@/lib/models/Settings';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const doc = await Settings.findOne({ key: 'social_credentials' });
    
    const settingsObj: Record<string, string> = {};
    if (doc && doc.value) {
      // Convert Map to plain object
      doc.value.forEach((val: string, key: string) => {
        settingsObj[key] = val;
      });
    }

    return NextResponse.json({ success: true, settings: settingsObj });
  } catch (error: any) {
    console.error('Settings GET Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { value } = await req.json();

    if (!value || typeof value !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid settings body' }, { status: 400 });
    }

    let doc = await Settings.findOne({ key: 'social_credentials' });
    if (!doc) {
      doc = new Settings({ key: 'social_credentials', value: new Map() });
    }

    // Update the values in the map
    Object.keys(value).forEach((k) => {
      doc.value.set(k, value[k] || '');
    });

    await doc.save();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Settings POST Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
