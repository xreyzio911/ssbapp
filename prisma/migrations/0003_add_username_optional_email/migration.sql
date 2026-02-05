ALTER TABLE "User" ADD COLUMN "username" TEXT;

ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

WITH base AS (
  SELECT
    id,
    CASE
      WHEN email IS NOT NULL THEN lower(split_part(email, '@', 1))
      ELSE lower(regexp_replace(name, '\\s+', ' ', 'g'))
    END AS base_username
  FROM "User"
),
dedup AS (
  SELECT
    id,
    CASE
      WHEN count(*) OVER (PARTITION BY base_username) = 1 THEN base_username
      ELSE base_username || '-' || substring(id, 1, 6)
    END AS final_username
  FROM base
)
UPDATE "User" u
SET username = d.final_username
FROM dedup d
WHERE u.id = d.id;

ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
