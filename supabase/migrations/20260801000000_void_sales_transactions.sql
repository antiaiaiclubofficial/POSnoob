-- Add status and void-related columns to sales_transactions
ALTER TABLE "public"."sales_transactions" 
  ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'completed'::text,
  ADD COLUMN IF NOT EXISTS "void_reason" text,
  ADD COLUMN IF NOT EXISTS "voided_by" text,
  ADD COLUMN IF NOT EXISTS "voided_at" timestamp with time zone;

-- Add a comment for clarity
COMMENT ON COLUMN "public"."sales_transactions"."status" IS 'completed, voided';
