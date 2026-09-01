import { NextResponse } from 'next/server';
import { clearStaffSession } from '@/src/lib/auth';

export async function POST() {
  clearStaffSession();
  return NextResponse.json({ ok: true });
}
