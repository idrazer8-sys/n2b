-- Nullable, no default: null means "use the platform default look"
-- (Fraunces/Inter), which is exactly how every existing restaurant already
-- renders today — nothing changes for them until they opt into a pairing.
ALTER TABLE "Restaurant" ADD COLUMN "brandFontPairing" TEXT;
