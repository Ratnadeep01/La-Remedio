-- ============================================
-- 15. Add Image Type (Normal/Banner)
-- ============================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'image_type') THEN
    CREATE TYPE image_type AS ENUM ('normal', 'banner');
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE business_images ADD COLUMN IF NOT EXISTS type image_type DEFAULT 'normal';
