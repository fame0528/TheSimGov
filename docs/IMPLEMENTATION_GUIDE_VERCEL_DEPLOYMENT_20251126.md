# Vercel Deployment Guide (Hosting Decision Recorded)

**Date:** 2025-11-26  
**Decision:** Project will be hosted on Vercel (Next.js App Router) with external managed services. Deployment not executed yet; this document records the plan and required configuration.

---
## 1. Overview
This project uses Next.js (App Router), NextAuth (credentials), MongoDB Atlas, Socket.io (separate real-time server), and Resend for email. Chosen strategy:
- Frontend + API (Next.js, NextAuth) deployed on Vercel.
- Separate Socket.io server (keep locally for now; can later move to Railway/Fly/Render).
- MongoDB Atlas M0 free cluster.
- Resend for email delivery (already integrated).

## 2. Repository Structure Impact
Only the Next.js portion (`src/app/**`, `next.config.ts`) is built on Vercel. Files not included in the build output:
- `server.js` (Socket.io) — will NOT run on Vercel; requires separate deployment.
- Local assets in `public/` deployed automatically.
- `docs/` not served publicly by default (unless routed explicitly).

## 3. Environment Variables (Vercel Project Settings)
Add these under Project Settings → Environment Variables:
| Variable | Purpose | Example / Value |
|----------|---------|-----------------|
| `NEXTAUTH_URL` | Public base URL for NextAuth callbacks | `https://yourdomain.com` |
| `NEXT_PUBLIC_APP_URL` | Public base URL for links (password reset) | `https://yourdomain.com` |
| `NEXTAUTH_SECRET` | Crypto secret for JWT/session | Generate securely (`openssl rand -hex 32`) |
| `MONGODB_URI` | Connection string to Atlas | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `RESEND_API_KEY` | Resend API key | Provided key (keep secret) |
| `RESEND_FROM` | Verified sender email/domain | `no-reply@yourdomain.com` |
| `SOCKET_PORT` | Useful locally; not needed on Vercel | (omit or leave) |
| `NODE_ENV` | Set automatically by Vercel | (no need to set) |

### Optional / Future
| Variable | Use Case |
|----------|----------|
| `RATE_LIMIT_WINDOW_MS` | Externalize rate limiter window settings |
| `RATE_LIMIT_MAX_ATTEMPTS` | Externalize login attempts threshold |

## 4. Build & Output Configuration
Default Vercel Settings are acceptable:
- **Framework Preset:** Next.js
- **Build Command:** `npm run build` (auto-detected)
- **Output Directory:** `.next` (auto)
- **Install Command:** `npm install`
- **Development Command:** `npm run dev`

No custom `vercel.json` required unless you add redirects or edge/runtime overrides.

## 5. Socket.io Strategy
`server.js` contains Socket.io setup which Vercel cannot host (no long-lived WebSocket server in standard Node runtime). Options:
1. **Railway (recommended)**: Deploy `server.js` as a Node service; set `SOCKET_URL` in frontend.
2. **Fly.io**: Containerize the Socket.io server.
3. **Render**: Web Service deployment.
4. **Later Consolidation**: Move real-time logic to an Edge-compatible pattern (requires redesign). 

Frontend will need a config constant (e.g. `process.env.NEXT_PUBLIC_SOCKET_URL`) once deployed.

## 6. Password Reset & Email
Already implemented:
- Request route logs + sends email (`/api/auth/password/reset/request`).
- Confirm route updates password.
On Vercel ensure `RESEND_API_KEY` and `RESEND_FROM` are set before deploying to avoid fallback logging only.

## 7. Security & Secrets
- Rotate `NEXTAUTH_SECRET` before production.
- Use a dedicated MongoDB user with least privilege (read/write on target DB only).
- Set proper SPF + DKIM records for your domain to improve email deliverability (Resend dashboard).
- Enforce HTTPS via Vercel (automatic with custom domain linking).

## 8. DNS Setup (High-Level)
1. Add domain in Vercel dashboard.
2. If using Vercel nameservers: update registrar to point to Vercel NS; automatic provisioning.  
   If keeping registrar DNS: create a CNAME for `www` → `cname.vercel-dns.com` and optionally an apex A/ALIAS per Vercel instructions.
3. Wait for propagation; verify domain status in Vercel.

## 9. Deployment Checklist (Pre-Deployment)
| Step | Status |
|------|--------|
| Atlas cluster created (M0) | Pending/Verify |
| `.env.local` mirrored to Vercel env vars | To do |
| Domain added in Vercel | To do |
| Resend sender domain verified | To do |
| `NEXTAUTH_SECRET` rotated (prod value) | To do |
| Socket.io hosting decision finalized | Pending |
| Add `NEXT_PUBLIC_SOCKET_URL` if real-time used | Pending |

## 10. Post-Deployment Validation
After first deploy visit:
- `/login` – confirm NextAuth page renders.
- `/register` – validate registration flow.
- Password reset request → ensure email received (or link logged if misconfigured).
- Check Vercel logs for environment variable presence (no undefined). 
- Inspect Network tab for any failing API calls (CORS should not be an issue internally on Vercel).

## 11. Cost Summary (Initial)
| Component | Tier | Monthly Cost |
|-----------|------|--------------|
| Vercel | Hobby | $0 |
| MongoDB Atlas | M0 | $0 |
| Resend | Free tier | $0 (quota applies) |
| Socket.io host (later Railway free) | Starter | $0 |
| Domain | Registrar | Already purchased |

Upgrade triggers: Atlas storage growth, Resend email volume, traffic/compute limits on Vercel or Railway.

## 12. Future Enhancements
- Add `vercel.json` for custom redirects or headers.
- Introduce Edge Functions for low-latency auth decisions.
- Migrate Socket.io to a scalable pub/sub (e.g., Ably or Pusher) for simplicity.
- Add monitoring (Logtail / Better Stack) and error tracking (Sentry) via environment variables.

## 13. Action Items (Deferred)
| Action | Owner | Target |
|--------|-------|--------|
| Populate Vercel env vars | You | Before deploy |
| Verify Resend domain (SPF/DKIM) | You | Before email tests |
| Decide Socket.io hosting provider | You | Pre real-time feature release |
| Add `NEXT_PUBLIC_SOCKET_URL` constant | Dev | With Socket deploy |

---
**Status:** Hosting decision recorded (Vercel). Not deployed yet.  
**Next:** Mirror env vars to Vercel and deploy when ready.

*Document generated to capture deployment intent before execution.*
