import { config } from 'dotenv';
import path from 'path';

// Vitest doesn't read .env the way Next.js does — the DB-backed tests need
// DATABASE_URL loaded before any test file imports src/lib/db.
config({ path: path.resolve(__dirname, '../.env') });
