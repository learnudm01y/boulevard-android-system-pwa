-- ============================================================
-- Test Credentials – Merchant PWA Portal
-- Sets PwaUsername = 'AFM' for the merchant whose
-- MerchantAbbreviation = 'AFM' (or whichever matches).
-- Run AFTER db_merchant_pwa_credentials.sql has been applied.
-- ============================================================

-- Option A: Update by abbreviation (recommended)
UPDATE dbo.Merchants
SET
    PwaUsername = 'AFM',
    PwaPassword = 'AFM@2026'
WHERE MerchantAbbreviation = 'AFM'
  AND Status = 'Active';

-- Option B: Update by merchant title (fallback if abbreviation differs)
-- UPDATE dbo.Merchants
-- SET PwaUsername = 'AFM', PwaPassword = 'AFM@2026'
-- WHERE Title LIKE '%AFM%' AND Status = 'Active';

-- Option C: Update by known MerchantId (most explicit)
-- UPDATE dbo.Merchants
-- SET PwaUsername = 'AFM', PwaPassword = 'AFM@2026'
-- WHERE MerchantId = <YOUR_MERCHANT_ID>;

-- Verify the result
SELECT MerchantId, Title, MerchantAbbreviation, PwaUsername, PwaPassword
FROM   dbo.Merchants
WHERE  PwaUsername IS NOT NULL;
