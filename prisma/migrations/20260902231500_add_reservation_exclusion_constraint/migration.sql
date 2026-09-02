-- Enable the operator classes an EXCLUDE constraint needs to mix an
-- equality column (tableId, btree) with a range-overlap column (tsrange,
-- gist) in one index.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Per-row snapshot of the restaurant's reservationBufferMinutes at the time
-- a reservation was created/edited. An EXCLUDE constraint can only build its
-- range from a real column on the row itself, not a live join to
-- Restaurant, so this is what the constraint below actually reads.
ALTER TABLE "Reservation" ADD COLUMN "bufferMinutesSnapshot" INTEGER NOT NULL DEFAULT 15;

-- Backfill existing rows from their restaurant's current buffer setting.
UPDATE "Reservation" r
SET "bufferMinutesSnapshot" = COALESCE(
  (SELECT rest."reservationBufferMinutes" FROM "Restaurant" rest WHERE rest.id = r."restaurantId"),
  15
);

-- The application-level check in findConflictingReservation() already
-- covers the real-world race (two near-simultaneous booking clicks), but
-- isn't a mathematical guarantee under extreme concurrency. This constraint
-- makes "no two CONFIRMED reservations on the same table with overlapping
-- buffer windows" a fact the database itself enforces, independent of
-- application code.
ALTER TABLE "Reservation"
  ADD CONSTRAINT "reservation_no_overlapping_bookings"
  EXCLUDE USING gist (
    "tableId" WITH =,
    tsrange(
      "startsAt" - ("bufferMinutesSnapshot" * interval '1 minute'),
      "startsAt" + ("bufferMinutesSnapshot" * interval '1 minute'),
      '[]'
    ) WITH &&
  )
  WHERE ("status" = 'CONFIRMED');
