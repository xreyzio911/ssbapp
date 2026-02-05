-- Add signature fields for one-time employee signature setup
ALTER TABLE "User"
ADD COLUMN "signaturePath" TEXT,
ADD COLUMN "signatureFilename" TEXT,
ADD COLUMN "signatureMime" TEXT,
ADD COLUMN "signatureUpdatedAt" TIMESTAMP(3);
