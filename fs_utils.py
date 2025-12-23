from pathlib import Path
import time
import logging

# Allow imports inside function scope for optional dependencies (Werkzeug)
# and to avoid heavy top-level imports
# pylint: disable=import-outside-toplevel

logger = logging.getLogger(__name__)


def safe_unlink(path: Path, retries: int = 3, delay: float = 0.5) -> bool:
    """Attempt to unlink a path with retries to handle transient filesystem locks."""
    try:
        path.unlink()
        logger.info("Deleted file: %s", path)
        return True
    except OSError as initial_err:
        logger.warning("Initial unlink failed for %s: %s", path, initial_err)
        for i in range(retries):
            try:
                time.sleep(delay)
                path.unlink()
                logger.info("Deleted file after retry %d: %s", i + 1, path)
                return True
            except OSError as err:
                logger.warning("Retry %d failed for %s: %s", i + 1, path, err)
        logger.warning(
            "Failed to delete %s after %d retries; leaving it for cleanup",
            path,
            retries)
        return False


def _save_uploaded_file(file) -> tuple[Path, str, str]:
    """Save uploaded file and return (path, extension, filename).

    Ensures type-safety for uploads and centralizes unique naming and saving logic.
    """
    from werkzeug.datastructures import FileStorage
    from werkzeug.utils import secure_filename
    import uuid
    assert isinstance(file, FileStorage), "Expected FileStorage for uploaded file"
    original_filename = secure_filename(file.filename or 'upload')
    source_ext = original_filename.rsplit('.', 1)[1].lower() if '.' in original_filename else ''
    unique_id = str(uuid.uuid4())
    input_filename = f"{unique_id}-{original_filename}"
    base_dir = Path(__file__).parent
    upload_dir = base_dir / 'uploads'
    upload_dir.mkdir(exist_ok=True)
    input_path = upload_dir / input_filename
    file.save(str(input_path))
    logger.info("File uploaded: %s", input_filename)
    return input_path, source_ext, input_filename


def _check_file_size(file_path: Path, max_size: int = 100 * 1024 * 1024):
    """Check if file size is within limit and remove it if it's too large."""
    if file_path.stat().st_size > max_size:
        safe_unlink(file_path)
        raise ValueError('File size exceeds 100MB limit')


def cleanup_old_files(
        upload_dir: Path,
        output_dir: Path,
        max_age_seconds: int = 86400):
    """Clean up files older than `max_age_seconds` in given directories."""
    current_time = time.time()
    for directory in [upload_dir, output_dir]:
        for file_path in Path(directory).glob('*'):
            if not file_path.is_file():
                continue
            file_age = current_time - file_path.stat().st_mtime
            if file_age > max_age_seconds:
                safe_unlink(file_path)
                logger.info("Cleaned up old file: %s", file_path)
