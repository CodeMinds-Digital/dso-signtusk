-- Update service account emails from @documenso.com to @signtusk.com
UPDATE "User" SET "email" = 'serviceaccount@signtusk.com'
WHERE "email" = 'serviceaccount@documenso.com';

UPDATE "User" SET "email" = 'deleted-account@signtusk.com'
WHERE "email" = 'deleted-account@documenso.com';
