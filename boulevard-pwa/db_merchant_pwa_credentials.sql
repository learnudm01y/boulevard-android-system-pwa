-- ============================================================
-- Migration: Add PWA credentials columns to Merchants table
-- Run once on the production/development database
-- ============================================================

-- Add PwaUsername column (plain-text, unique per merchant)
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Merchants' AND COLUMN_NAME = 'PwaUsername'
)
BEGIN
    ALTER TABLE dbo.Merchants
        ADD PwaUsername NVARCHAR(100) NULL;
    PRINT 'Column PwaUsername added to Merchants.';
END
ELSE
    PRINT 'Column PwaUsername already exists – skipped.';

-- Add PwaPassword column (plain-text as requested)
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Merchants' AND COLUMN_NAME = 'PwaPassword'
)
BEGIN
    ALTER TABLE dbo.Merchants
        ADD PwaPassword NVARCHAR(100) NULL;
    PRINT 'Column PwaPassword added to Merchants.';
END
ELSE
    PRINT 'Column PwaPassword already exists – skipped.';

-- Add PwaSessionToken column (used by the API to validate active sessions)
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Merchants' AND COLUMN_NAME = 'PwaSessionToken'
)
BEGIN
    ALTER TABLE dbo.Merchants
        ADD PwaSessionToken NVARCHAR(100) NULL;
    PRINT 'Column PwaSessionToken added to Merchants.';
END
ELSE
    PRINT 'Column PwaSessionToken already exists – skipped.';

PRINT 'Migration complete.';
