ALTER TABLE content_item
    ADD COLUMN IF NOT EXISTS media_processing_status VARCHAR(20) NOT NULL DEFAULT 'NOT_REQUIRED',
    ADD COLUMN IF NOT EXISTS media_processing_error TEXT,
    ADD COLUMN IF NOT EXISTS media_processing_started_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS media_processing_completed_at TIMESTAMPTZ;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_content_item_media_processing_status') THEN
        ALTER TABLE content_item
            ADD CONSTRAINT chk_content_item_media_processing_status
            CHECK (media_processing_status IN ('NOT_REQUIRED', 'QUEUED', 'PROCESSING', 'READY', 'FAILED'));
    END IF;
END $$;

UPDATE content_item
SET media_processing_status = CASE
    WHEN type::TEXT = 'VIDEO' AND hls_url IS NOT NULL THEN 'READY'
    WHEN type::TEXT = 'VIDEO' AND file_path IS NOT NULL THEN 'QUEUED'
    WHEN type::TEXT = 'VIDEO' THEN 'QUEUED'
    ELSE 'NOT_REQUIRED'
END
WHERE media_processing_status = 'NOT_REQUIRED';
