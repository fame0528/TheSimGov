# Deleting Players (Users) - Developer Guide

This document describes the `scripts/cleanup-financials.js --deleteAllUsers` instrument used in development to delete all players and related documents. This operation is irreversible and should NEVER be run against production.

Steps
1. Ensure you have a backup of the database or a dump before running.
2. Run `npm run diag:delete-users` to run a dry-run that prints the counts for users and related data without deleting anything.
3. If you are confident, run the script with confirmation flags:
   - `node scripts/cleanup-financials.js --deleteAllUsers --confirm --dryRun` to see what would be deleted.
   - `node scripts/cleanup-financials.js --deleteAllUsers --confirm` to actually delete everything.

Safety Features
- Requires `--confirm` to run deletions.
- Respects `NODE_ENV === 'production'` and will abort if set to production.
- Creates a JSON backup of users (without passwords) to `./backups/users-backup-<timestamp>.json` before deletion.

Related collections deleted:
- `users`
- `companies`
- `transactions`
- `loans`
- `creditScores`
- `employees`

Note: Customize the script if you want to keep some artifacts (e.g., `companies`), but do so with caution and additional backups.
