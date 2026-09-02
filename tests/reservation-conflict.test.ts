import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from '../src/lib/db';
import { findConflictingReservation } from '../src/lib/reservations';

// Integration test against the real DB: Reservation has real foreign keys
// to Restaurant/Table, so this spins up (and tears down) a throwaway
// restaurant + table rather than mocking Prisma.
let restaurantId: string;
let tableId: string;
let otherTableId: string;

beforeAll(async () => {
  const restaurant = await db.restaurant.create({
    data: {
      name: `Test Audit Restaurant ${Date.now()}`,
      slug: `test-audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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
  // Children first — no ON DELETE CASCADE relied on here on purpose, to
  // keep this test explicit about what it created.
  await db.reservation.deleteMany({ where: { restaurantId } });
  await db.table.deleteMany({ where: { restaurantId } });
  await db.restaurant.delete({ where: { id: restaurantId } });
});

describe('findConflictingReservation', () => {
  it('finds no conflict on an empty table', async () => {
    const conflict = await findConflictingReservation(
      restaurantId,
      tableId,
      new Date('2027-01-01T20:00:00Z'),
      15
    );

    expect(conflict).toBeNull();
  });

  it('flags an exact-same-time booking on the same table as a conflict', async () => {
    const startsAt = new Date('2027-01-02T20:00:00Z');

    const existing = await db.reservation.create({
      data: { restaurantId, tableId, startsAt, partySize: 2 },
    });

    const conflict = await findConflictingReservation(
      restaurantId,
      tableId,
      startsAt,
      15
    );

    expect(conflict?.id).toBe(existing.id);
  });

  it('flags a booking inside the buffer window (not just an exact match)', async () => {
    const existingStart = new Date('2027-01-03T20:00:00Z');
    const nearbyStart = new Date('2027-01-03T20:10:00Z'); // 10 min later, buffer is 15

    await db.reservation.create({
      data: { restaurantId, tableId, startsAt: existingStart, partySize: 2 },
    });

    const conflict = await findConflictingReservation(
      restaurantId,
      tableId,
      nearbyStart,
      15
    );

    expect(conflict).not.toBeNull();
  });

  it('does not flag a booking outside the buffer window', async () => {
    const existingStart = new Date('2027-01-04T20:00:00Z');
    const farStart = new Date('2027-01-04T21:00:00Z'); // 60 min later, buffer is 15

    await db.reservation.create({
      data: { restaurantId, tableId, startsAt: existingStart, partySize: 2 },
    });

    const conflict = await findConflictingReservation(
      restaurantId,
      tableId,
      farStart,
      15
    );

    expect(conflict).toBeNull();
  });

  it('does not flag the same time on a DIFFERENT table', async () => {
    const startsAt = new Date('2027-01-05T20:00:00Z');

    await db.reservation.create({
      data: { restaurantId, tableId, startsAt, partySize: 2 },
    });

    const conflict = await findConflictingReservation(
      restaurantId,
      otherTableId,
      startsAt,
      15
    );

    expect(conflict).toBeNull();
  });

  it('ignores a CANCELLED reservation at the same time', async () => {
    const startsAt = new Date('2027-01-06T20:00:00Z');

    await db.reservation.create({
      data: {
        restaurantId,
        tableId,
        startsAt,
        partySize: 2,
        status: 'CANCELLED',
      },
    });

    const conflict = await findConflictingReservation(
      restaurantId,
      tableId,
      startsAt,
      15
    );

    expect(conflict).toBeNull();
  });

  it('excludes the reservation being edited from conflicting with itself', async () => {
    const startsAt = new Date('2027-01-07T20:00:00Z');

    const reservation = await db.reservation.create({
      data: { restaurantId, tableId, startsAt, partySize: 2 },
    });

    const conflict = await findConflictingReservation(
      restaurantId,
      tableId,
      startsAt,
      15,
      reservation.id
    );

    expect(conflict).toBeNull();
  });
});
