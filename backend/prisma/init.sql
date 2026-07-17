-- COSMAN Database Initialization
-- This runs once on first container start.
-- All schema changes are handled by Prisma migrations.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for full-text search
