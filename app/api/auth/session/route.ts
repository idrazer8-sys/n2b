import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/src/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json(
        {
          authenticated: false,
        },
        {
          status: 401,
        }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
      portal: session.portal,
    });
  } catch (err) {
    console.error('Auth session error:', err);

    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      {
        status: 500,
      }
    );
  }
}