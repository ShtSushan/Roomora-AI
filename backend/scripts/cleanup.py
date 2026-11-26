"""Remove files nothing refers to any more.

Run from the backend folder with the venv active:
    python -m scripts.cleanup              dry run: only lists what would go
    python -m scripts.cleanup --apply      really deletes
    python -m scripts.cleanup --hours 1    change the grace period (default 24)
"""
import argparse

from app.database.database import SessionLocal, init_db
from app.services.cleanup_service import run_cleanup


def main() -> None:
    parser = argparse.ArgumentParser(description="Roomora file clean-up")
    parser.add_argument("--apply", action="store_true", help="really delete the files")
    parser.add_argument("--hours", type=float, default=24.0, help="only touch files older than this")
    args = parser.parse_args()

    init_db()
    with SessionLocal() as db:
        report = run_cleanup(db, apply=args.apply, grace_hours=args.hours)

    print("DELETED:" if args.apply else "DRY RUN (nothing deleted). Would delete:")
    total_files = total_bytes = 0
    for name, info in report.items():
        mb = info["bytes"] / 1024 / 1024
        print(f"\n{name}: {len(info['files'])} files, {mb:.1f} MB")
        for path in info["files"][:10]:
            print(f"   {path}")
        if len(info["files"]) > 10:
            print(f"   ... and {len(info['files']) - 10} more")
        total_files += len(info["files"])
        total_bytes += info["bytes"]
    print(f"\nTotal: {total_files} files, {total_bytes / 1024 / 1024:.1f} MB")
    if not args.apply and total_files:
        print("Run again with --apply to delete them.")


if __name__ == "__main__":
    main()