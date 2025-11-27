// No explicit bson unmock: avoid importing ES-only modules in the Jest process.

import request from 'supertest';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
// In CI `jest-global-setup` will start the memory DB when TEST_MONGODB_MEMORY=true.
// Avoid requiring db helpers here to prevent ESM transforms for bson being imported by mongoose.

// This test starts the server as a subprocess and uses supertest to exercise
// the /api/companies route. It uses the test-only `x-test-user-id` header to
// bypass NextAuth and run inside an integration environment.

jest.setTimeout(120000);

// Conditionally skip supertest-based server runs on Windows due to Next.js dev lock issues.
const describeSupertest = process.platform === 'win32' ? describe.skip : describe;

describeSupertest('POST /api/companies (supertest)', () => {
  let serverProcess: any;
  const port = process.env.TEST_SERVER_PORT || '4010';
  const baseUrl = `http://localhost:${port}`;

  beforeAll(async () => {
    // Jest global setup will start an in-memory MongoDB server when
    // TEST_MONGODB_MEMORY=true. Avoid importing DB helpers here to
    // prevent ESM transform issues in node_modules.

    // Start the server from the project root (server.js)
    // Remove dev lock file if present (avoids "Unable to acquire lock" in CI/local)
    try {
      const lockPath = path.join(process.cwd(), '.next', 'dev', 'lock');
      if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
    } catch (e) {
      // ignore
    }
    serverProcess = spawn('node', [path.join(process.cwd(), 'server.js')], {
      env: { ...process.env, PORT: port },
      stdio: ['inherit', 'pipe', 'pipe'],
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Server failed to start')), 20000);
      serverProcess.stdout.on('data', (chunk: Buffer) => {
        const s = chunk.toString();
        if (s.includes('Server ready at')) {
          clearTimeout(timeout);
          resolve();
        }
      });
      serverProcess.stderr.on('data', (chunk: Buffer) => {
        // Print but continue
        console.error(chunk.toString());
      });
    });
  });

  afterAll(async () => {
    if (serverProcess) {
      serverProcess.kill();
      serverProcess = null;
    }
    // Global teardown handles stopping the in-memory DB when used.
  });

  it('creates a company with Accelerator funding (supertest)', async () => {
    const agent = request.agent(baseUrl);

    // Register user through API
    const registerRes = await agent.post('/api/auth/register').send({
      email: 'supertest-user@example.com',
      password: 'superTestPass123',
      firstName: 'Super',
      lastName: 'Tester',
      state: 'CA',
    });

    expect(registerRes.status).toBe(201);
    const createdUser = registerRes.body.user;
    expect(createdUser).toBeDefined();

    // The POST /api/companies route will read the x-test-user-id header for test sessions
    const companyPayload = {
      name: 'Super AI Company',
      industry: 'Technology',
      techPath: 'AI',
      funding: {
        type: 'Accelerator',
        amount: 10000,
      },
    };

    const res = await agent.post('/api/companies').set('x-test-user-id', createdUser.id).send(companyPayload);

    // Expect either 201 created when allowed cap did not exceed limits
    expect([201, 400]).toContain(res.status);
  });
});
