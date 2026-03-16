import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 413 });
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are accepted' }, { status: 415 });
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Process and resize image using sharp
    const processed = await sharp(buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const filepath = join(UPLOAD_DIR, filename);
    await writeFile(filepath, processed);

    return NextResponse.json({ url: `/uploads/${filename}` }, { status: 201 });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
