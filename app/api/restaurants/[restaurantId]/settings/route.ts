import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { FONT_PAIRING_KEYS } from '@/src/lib/fontPairings';

const schema = z.object({
  googleReviewUrl: z.string().url().nullable().optional(),
  acceptanceSlaSeconds: z.number().int().min(30).max(1800).nullable().optional(),
  kitchenSlaSeconds: z.number().int().min(60).max(3600).nullable().optional(),
  waiterSlaSeconds: z.number().int().min(30).max(1800).nullable().optional(),
  allowPayAtRestaurant: z.boolean().optional(),
  reservationBufferMinutes: z.number().int().min(0).max(240).optional(),
  isOpen: z.boolean().optional(),
  // #rgb or #rrggbb — never trust arbitrary CSS (e.g. `javascript:...` or a
  // gradient) since this value is later interpolated into inline styles.
  brandPrimaryColor: z.string().regex(/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/).optional(),
  // Closed list, not free text — see FONT_PAIRING_KEYS in fontPairings.ts.
  brandFontPairing: z.enum(FONT_PAIRING_KEYS as [string, ...string[]]).nullable().optional(),
  // A data: URL, not an arbitrary external URL — this is always a photo
  // the manager themselves uploaded (via the menu-photo-import flow),
  // re-submitted as base64. 4M chars (~3MB raw) is generous headroom over
  // what the import flow's own client-side resize (max 1600px, JPEG q=0.82)
  // actually produces.
  menuBackgroundUrl: z
    .string()
    .regex(/^data:image\/(jpeg|jpg|png|webp);base64,/)
    .max(4_000_000)
    .nullable()
    .optional(),
});

type RouteContext = {
  params: {
    restaurantId: string;
  };
};

export async function GET(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const access = await requireRestaurantAccess(
      params.restaurantId,
      'MANAGER'
    );

    if (!access.ok) {
      return NextResponse.json(
        { error: access.message },
        { status: access.status }
      );
    }

    const restaurant = await db.restaurant.findUnique({
      where: { id: params.restaurantId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        coverUrl: true,
        address: true,
        phone: true,
        currency: true,
        timezone: true,
        brandPrimaryColor: true,
        brandFontPairing: true,
        menuBackgroundUrl: true,
        isOpen: true,
        isActive: true,
        googleReviewUrl: true,
        acceptanceSlaSeconds: true,
        kitchenSlaSeconds: true,
        waiterSlaSeconds: true,
        allowPayAtRestaurant: true,
        reservationBufferMinutes: true,
      },
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    const totalServiceSlaSeconds =
      restaurant.acceptanceSlaSeconds !== null &&
      restaurant.kitchenSlaSeconds !== null &&
      restaurant.waiterSlaSeconds !== null
        ? restaurant.acceptanceSlaSeconds +
          restaurant.kitchenSlaSeconds +
          restaurant.waiterSlaSeconds
        : null;

    return NextResponse.json({
      ...restaurant,
      totalServiceSlaSeconds,
    });
  } catch (err) {
    console.error('Settings GET error:', err);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const access = await requireRestaurantAccess(
      params.restaurantId,
      'MANAGER'
    );

    if (!access.ok) {
      return NextResponse.json(
        { error: access.message },
        { status: access.status }
      );
    }

    const body = schema.parse(await req.json());

    const current = await db.restaurant.findUnique({
      where: { id: params.restaurantId },
      select: {
        acceptanceSlaSeconds: true,
        kitchenSlaSeconds: true,
        waiterSlaSeconds: true,
      },
    });

    if (!current) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    const acceptance =
      body.acceptanceSlaSeconds !== undefined
        ? body.acceptanceSlaSeconds
        : current.acceptanceSlaSeconds;

    const kitchen =
      body.kitchenSlaSeconds !== undefined
        ? body.kitchenSlaSeconds
        : current.kitchenSlaSeconds;

    const waiter =
      body.waiterSlaSeconds !== undefined
        ? body.waiterSlaSeconds
        : current.waiterSlaSeconds;

    const total =
      acceptance !== null &&
      kitchen !== null &&
      waiter !== null
        ? acceptance + kitchen + waiter
        : null;

    const updated = await db.restaurant.update({
      where: { id: params.restaurantId },
      data: {
        ...(body.googleReviewUrl !== undefined
          ? { googleReviewUrl: body.googleReviewUrl }
          : {}),
        ...(body.acceptanceSlaSeconds !== undefined
          ? { acceptanceSlaSeconds: body.acceptanceSlaSeconds }
          : {}),
        ...(body.kitchenSlaSeconds !== undefined
          ? { kitchenSlaSeconds: body.kitchenSlaSeconds }
          : {}),
        ...(body.waiterSlaSeconds !== undefined
          ? { waiterSlaSeconds: body.waiterSlaSeconds }
          : {}),
        ...(body.allowPayAtRestaurant !== undefined
          ? { allowPayAtRestaurant: body.allowPayAtRestaurant }
          : {}),
        ...(body.reservationBufferMinutes !== undefined
          ? { reservationBufferMinutes: body.reservationBufferMinutes }
          : {}),
        ...(body.isOpen !== undefined ? { isOpen: body.isOpen } : {}),
        ...(body.brandPrimaryColor !== undefined
          ? { brandPrimaryColor: body.brandPrimaryColor }
          : {}),
        ...(body.brandFontPairing !== undefined
          ? { brandFontPairing: body.brandFontPairing }
          : {}),
        ...(body.menuBackgroundUrl !== undefined
          ? { menuBackgroundUrl: body.menuBackgroundUrl }
          : {}),
        totalServiceSlaSeconds: total,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        coverUrl: true,
        address: true,
        phone: true,
        currency: true,
        timezone: true,
        brandPrimaryColor: true,
        brandFontPairing: true,
        menuBackgroundUrl: true,
        isOpen: true,
        isActive: true,
        googleReviewUrl: true,
        acceptanceSlaSeconds: true,
        kitchenSlaSeconds: true,
        waiterSlaSeconds: true,
        allowPayAtRestaurant: true,
        reservationBufferMinutes: true,
      },
    });

    const totalServiceSlaSeconds =
      updated.acceptanceSlaSeconds !== null &&
      updated.kitchenSlaSeconds !== null &&
      updated.waiterSlaSeconds !== null
        ? updated.acceptanceSlaSeconds +
          updated.kitchenSlaSeconds +
          updated.waiterSlaSeconds
        : null;

    return NextResponse.json({
      ...updated,
      totalServiceSlaSeconds,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          issues: err.errors,
        },
        { status: 400 }
      );
    }

    console.error('Settings PATCH error:', err);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
