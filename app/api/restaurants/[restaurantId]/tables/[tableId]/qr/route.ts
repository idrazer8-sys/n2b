import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';

// Returns a printable PNG QR code that encodes the exact same URL the NFC
// tag should be programmed with: {APP_URL}/r/{slug}?t={table.token}
export async function GET(
  _req: NextRequest,
  { params }: { params: { restaurantId: string; tableId: string } }
) {
  const access = await requireRestaurantAccess(params.restaurantId, 'STAFF');
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status });

  const table = await db.table.findFirst({
    where: { id: params.tableId, restaurantId: params.restaurantId },
    include: { restaurant: true },
  });
  if (!table) return NextResponse.json({ error: 'Table not found' }, { status: 404 });

  const url = `${process.env.NEXT_PUBLIC_APP_URL}/r/${table.restaurant.slug}?t=${table.token}`;
  const png = await QRCode.toBuffer(url, { width: 600, margin: 2 });

return new NextResponse(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `inline; filename="table-${table.label.replace(/\s+/g, '-')}-qr.png"`,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
