-- Nullable, no default: self-registration stays off for every existing
-- restaurant until its manager explicitly sets a join password.
ALTER TABLE "Restaurant" ADD COLUMN "staffJoinPasswordHash" TEXT;
