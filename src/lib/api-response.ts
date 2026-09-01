import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { PricingError } from './pricing';

// Small helper so every route returns errors in the same shape, and so we
// never accidentally leak a raw error/stack trace to the client.
export function errorResponse(err: unknown) {
  if (err instanceof PricingError) {
    return NextResponse.json({ error: err.message, code: err.code }, { status: 400 });
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: 'Invalid request', issues: err.flatten() },
      { status: 400 }
    );
  }
  console.error(err);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
