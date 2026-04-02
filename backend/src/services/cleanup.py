"""Cleanup service: deletes expired files from Supabase Storage and processed_files table."""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from src.services.usage import get_supabase

logger = logging.getLogger(__name__)


def cleanup_expired_files():
    """Delete all processed files past their 2-hour expiry."""
    sb = get_supabase()
    now = datetime.now(timezone.utc).isoformat()

    # Get expired file records
    result = (
        sb.table("processed_files")
        .select("id, storage_path")
        .lte("expires_at", now)
        .limit(100)
        .execute()
    )

    if not result.data:
        logger.info("No expired files to clean up")
        return 0

    deleted = 0
    for record in result.data:
        path = record["storage_path"]
        record_id = record["id"]
        try:
            # Delete from storage bucket
            sb.storage.from_("temp-pdfs").remove([path])
            # Delete from database
            sb.table("processed_files").delete().eq("id", record_id).execute()
            deleted += 1
        except Exception as e:
            logger.error("Failed to delete %s: %s", path, e)

    logger.info("Cleaned up %d expired files", deleted)
    return deleted
