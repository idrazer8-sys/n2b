-- Bar / kitchen / entrance stop being hardcoded decoration and become real
-- objects the manager places only if the restaurant actually has them.
-- Existing rows are all real table-grouping zones, so they default to ZONE.

CREATE TYPE "TableZoneKind" AS ENUM ('ZONE', 'BAR', 'KITCHEN', 'ENTRANCE');

ALTER TABLE "TableZone" ADD COLUMN "kind" "TableZoneKind" NOT NULL DEFAULT 'ZONE';
