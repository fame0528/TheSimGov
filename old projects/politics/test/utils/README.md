# Test DB and local integration test guide

This directory contains helpers and utilities for running integration tests that need MongoDB.

### startTestDB / stopTestDB / clearTestDB
- `startTestDB()` — Spins up `mongodb-memory-server` and sets `process.env.MONGODB_URI` so `connectDB()` uses the in-memory DB.
- `stopTestDB()` — Stops the memory server and clears `process.env.MONGODB_URI`.
- `clearTestDB()` — Clears every collection in the Mongoose connection.

### Local usage
1. Install dependencies:

```powershell
npm i -D mongodb-memory-server
```

2. Run tests with in-memory DB:

```powershell
$env:TEST_MONGODB_MEMORY = 'true'; npm test -- route.company-api.test
```

This sets up the memory server automatically through Jest global setup if `TEST_MONGODB_MEMORY` is true.

### CI usage
For CI, two options:
1. Use `mongodb-memory-server` in CI (same as local). Ensure it's installed in the CI environment.
2. Provide an external test DB and set `MONGODB_URI` in CI, but keep `TEST_MONGODB_MEMORY=false`.

If your CI produces ESM parsing errors due to packages like `bson`, ensure `babel-jest` and related presets are installed and configured in `jest.config.js` and `.babelrc` (already included in this repo). If you prefer to avoid ESM transforms, run integration tests in a separate job with Node + script that runs `server.js` and `supertest` against the running server.

### Additional notes
- You can opt into automatic memory server lifecycle via Jest global setup/teardown. See `jest.config.js` for details.
- `connectDB()` will use the `MONGODB_URI` that the memory server sets.
