import { NextRequest, NextResponse } from 'next/server';
import { generateTestsFromUrl } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

    const result = await generateTestsFromUrl(url);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Generate error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
