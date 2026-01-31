-- Fix Invalid Emails in Database
-- This script will update or delete records with invalid emails

-- OPTION 1: Update invalid emails to a placeholder
-- Uncomment and modify as needed

-- Update Users with invalid emails
UPDATE "User"
SET email = CONCAT('invalid_', id, '@placeholder.local')
WHERE email IS NULL 
   OR email = '' 
   OR email NOT LIKE '%@%' 
   OR email NOT LIKE '%@%.%';

-- Update Recipients with invalid emails
UPDATE "Recipient"
SET email = CONCAT('invalid_recipient_', id, '@placeholder.local')
WHERE email IS NULL
   OR email = ''
   OR email NOT LIKE '%@%'
   OR email NOT LIKE '%@%.%';

-- OPTION 2: Delete records with invalid emails (USE WITH CAUTION!)
-- Uncomment only if you want to delete these records

-- Delete Users with invalid emails (will cascade to related records)
-- DELETE FROM "User"
-- WHERE email IS NULL 
--    OR email = '' 
--    OR email NOT LIKE '%@%' 
--    OR email NOT LIKE '%@%.%';

-- Delete Recipients with invalid emails
-- DELETE FROM "Recipient"
-- WHERE email IS NULL
--    OR email = ''
--    OR email NOT LIKE '%@%'
--    OR email NOT LIKE '%@%.%';

-- Verify the fix
SELECT 'Users with valid emails' as check_type, COUNT(*) as count
FROM "User"
WHERE email LIKE '%@%.%';

SELECT 'Recipients with valid emails' as check_type, COUNT(*) as count
FROM "Recipient"
WHERE email LIKE '%@%.%';

SELECT 'Users with invalid emails' as check_type, COUNT(*) as count
FROM "User"
WHERE email IS NULL 
   OR email = '' 
   OR email NOT LIKE '%@%' 
   OR email NOT LIKE '%@%.%';

SELECT 'Recipients with invalid emails' as check_type, COUNT(*) as count
FROM "Recipient"
WHERE email IS NULL
   OR email = ''
   OR email NOT LIKE '%@%'
   OR email NOT LIKE '%@%.%';
