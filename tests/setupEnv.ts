import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load env from .env.test, then .env.local, then .env (first found wins)
const root = process.cwd();
const candidates = ['.env.test', '.env.local', '.env'];
for (const file of candidates) {
  const full = path.join(root, file);
  if (fs.existsSync(full)) {
    dotenv.config({ path: full });
    break;
  }
}

// Ensure required envs have sensible defaults for local test runs
if (!process.env.MONGODB_URI) {
  // Local default avoids immediate crash for suites that import DB layer
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/test';
}
