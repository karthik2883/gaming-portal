import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Menu from '@/lib/models/Menu';
import Category from '@/lib/models/Category'; // Register Category model for populate

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    // Prevent treeshaking of Category model import
    const _ = Category;
    const menu = await Menu.findById(params.id).populate('categoryRef', 'name slug');
    if (!menu) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: menu });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const body = await req.json();
    const menu = await Menu.findByIdAndUpdate(params.id, body, { new: true, runValidators: true });
    if (!menu) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: menu });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const menu = await Menu.findByIdAndDelete(params.id);
    if (!menu) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Menu deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete' }, { status: 500 });
  }
}
