import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from '../src/lib/db';
import { isReservationExclusionViolation } from '../src/lib/reservations';

// Integration test against the real DB: this exercises the Postgres
// EXCLUDE constraint directly (bypassing findConflictingReservation, which
// is only the fast-path application-level check) to prove the database
// itself refuses an overlapping booking under a genuine race, not just
// whatever the app happens to check first.
let restaurantId: string;
let tableId: string;
let otherTableId: string;

beforeAll(async () => {
  const restaurant = await db.restaurant.create({
    data: {
      name: `Test Exclusion Restaurant ${Date.now()}`,
      slug: `test-exclusion-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    },
  });
  restaurantId = restaurant.id;

  const table = await db.table.create({
    data: { restaurantId, label: 'T1' },
  });
  tableId = table.id;

  const otherTable = await db.table.create({
    data: { restaurantId, label: 'T2' },
  });
  otherTableId = otherTable.id;
});

afterAll(async () => {
  await db.reservation.deleteMany({ where: { restaurantId } });
  await db.table.deleteMany({ where: { restaurantId } });
  await db.restaurant.delete({ where: { id: restaurantId } });
});

describe('reservation_no_overlapping_bookings EXCLUDE constraint', () => {
  it('rejects an overlapping CONFIRMED booking on the same table', async () => {
    const startsAt = new Date('2027-08-01T20:00:00Z');

    await db.reservation.create({
      data: { restaurantId, tableId, startsAt, bufferMinutesSnapshot: 15, partySize: 2 },
    });

    await expect(
      db.reservation.create({
        data: {
          restaurantId,
          tableId,
          startsAt: new Date('2027-08-01T20:05:00Z'), // 5 min later, buffer 15
          bufferMinutesSnapshot: 15,
          partySize: 4,
        },
      })
    ).rejects.toSatisfy((err: unknown) => isReservationExclusionViolation(err));
  });

  it('allows a non-overlapping booking on the same table', async () => {
    const first = new Date('2027-08-02T20:00:00Z');

    await db.reservation.create({
      data: { restaurantId, tableId, startsAt: first, bufferMinutesSnapshot: 15, partySize: 2 },
    });

    const second = await db.reservation.create({
      data: {
        restaurantId,
        tableId,
        startsAt: new Date('2027-08-02T22:00:00Z'),
        bufferMinutesSnapshot: 15,
        partySize: 2,
      },
    });

    expect(second.id).toBeTruthy();
  });

  it('allows the same time on a different table', async () => {
    const startsAt = new Date('2027-08-03T20:00:00Z');

    await db.reservation.create({
      data: { restaurantId, tableId, startsAt, bufferMinutesSnapshot: 15, partySize: 2 },
    });

    const onOtherTable = await db.reservation.create({
      data: {
        restaurantId,
        tableId: otherTableId,
        startsAt,
        bufferMinutesSnapshot: 15,
        partySize: 2,
      },
    });

    expect(onOtherTable.id).toBeTruthy();
  });

  it('does not count a CANCELLED reservation as an overlap', async () => {
    const startsAt = new Date('2027-08-04T20:00:00Z');

    const cancelled = await db.reservation.create({
      data: { restaurantId, tableId, startsAt, bufferMinutesSnapshot: 15, partySize: 2 },
    });

    await db.reservation.update({
      where: { id: cancelled.id },
      data: { status: 'CANCELLED' },
    });

    const confirmed = await db.reservation.create({
      data: { restaurantId, tableId, startsAt, bufferMinutesSnapshot: 15, partySize: 2 },
    });

    expect(confirmed.id).toBeTruthy();
  });

  it('rejects a concurrent double-booking race (two inserts at once)', async () => {
    const startsAt = new Date('2027-08-05T20:00:00Z');

    const results = await Promise.allSettled([
      db.reservation.create({
        data: { restaurantId, tableId, startsAt, bufferMinutesSnapshot: 15, partySize: 2 },
      }),
      db.reservation.create({
        data: { restaurantId, tableId, startsAt, bufferMinutesSnapshot: 15, partySize: 2 },
      }),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
  });
});
