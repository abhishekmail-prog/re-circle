# RE-CIRCLE — Complete Technical Documentation

A vernacular, offline-tolerant platform connecting India's informal e-waste
collectors (kabadiwalas) to CPCB-authorized recyclers via reverse-auction bidding,
QR-verified handovers, and a 7-language UI. Deployed as a PWA + Android APK.

**Last updated:** 2026-09-24
**Status:** Deployed, live, demo-ready

**Live URLs:**
- Frontend PWA: https://re-circle-psi.vercel.app
- Backend API: https://re-circle-api.onrender.com
- Health check: https://re-circle-api.onrender.com/health
- Database: Render Postgres (Singapore region)
- Android APK: built via PWABuilder from the Vercel URL

---

## 1. Executive Overview

RE-CIRCLE bridges the informal e-waste collection sector and India's formal EPR
recycling chain. ~90% of India's e-waste is collected by informal kabadiwalas who
have no fair-price visibility, no authorized-recycler directory, and no documented
handover trail. Material ends up in backyard processing — open-air cable burning,
acid leaching — poisoning workers and losing rare earths.

What RE-CIRCLE does:
- Digital "lots" from photo + category + weight
- Reverse auction — recyclers bid per-kg, highest wins
- 24h auction window with auto-close, or collector closes early
- QR handover: recycler scans at physical meetup
- Verified weight + final price + payment method (Cash / UPI / Bank Transfer)
- Earnings ledger per collector
- 7 languages: en, hi, mr, ta, te, kn, ml
- Offline-first: create lots with no internet, sync on reconnect
- Installable PWA + Android APK

## 2. Problem Statement

Design a vernacular, low-literacy, offline-tolerant platform enabling informal
scrap collectors to (a) discover fair prices, (b) connect directly with authorized
recyclers, (c) complete a documented, traceable handover, (d) receive payment.

Implemented: reverse auction for price discovery, distance chip as matching signal,
QR-verified handover with status chain, 7-language UI, offline queue with auto-sync.

Out of scope: legal EPR filing, actual money movement, real-time GPS tracking,
AI-based price prediction.

## 3. Project Objectives

Primary (done):
- Collector→recycler transactions via auction
- Price discovery through competitive bidding
- Verifiable handover receipts via QR
- 7 languages (PS asked minimum 2)
- Offline-first lot creation with photo

Secondary (done):
- 3-role dashboards (collector, recycler, admin)
- Admin verification of recyclers
- Photo upload + AI category suggestion (filename-based, demo mode)
- Spoken price readout (browser TTS)
- PWA install + Android APK

Future (not done):
- Real ML image classification (MobileNet v2)
- Distance-based backend ranking of recyclers
- Field research + unit economics docs
- Cloudinary/S3 image storage

## 4. Target Users and Roles

| Role | Purpose | Main Features |
|---|---|---|
| COLLECTOR (kabadiwala) | Sell e-waste | CreateLot, LotDetail, Earnings, Safety, Dashboard, Profile |
| RECYCLER | Buy e-waste | Lots, Handovers, Spending, Dashboard, Profile |
| ADMIN | Platform ops | Stats, Users, Recyclers, Activity |

Enforced by ProtectedRoute.jsx (allowedRoles prop) + Spring Security.

---

## 5. System Features

### 5.1 Authentication (JWT)

Purpose: 24h JWT tokens for 3 roles.
Flow: POST /auth/login → BCrypt verify → JWT with sub(email) + role claims.
Files: AuthController.java, AuthService.java, JwtUtil.java, JwtRequestFilter.java,
AuthContext.jsx.
Security: BCrypt passwords, HS256 JWT, @JsonIgnore on User.password.

### 5.2 Create Lot with Multi-Photo + AI Suggest

Purpose: Collector uploads up to 10 photos, gets category hint, submits lot.
Flow: Collector picks images → POST /ai/classify returns { suggestedCategory,
confidence, imageUrl } where imageUrl is a base64 data URL. Indicative value shown:
DEFAULT_PRICE_PER_KG[category] * weightKg * conditionMultiplier. On submit,
POST /lots with imageUrl + imageUrls (newline-separated), weight, category.
Lot enters BIDDING with auctionEndsAt = now + 24h.
Validation: weight > 0, category exists, at least one photo.
Files: CreateLot.jsx, ImageGallery.jsx, AIController.java, LotService.createLot.

Important — image storage is base64 data URLs in Postgres:
- Survives Render redeploys (free tier wipes /uploads/ on restart)
- MaterialLot.imageUrl and imageUrls are TEXT columns
- imageUrls uses NEWLINE separator (base64 contains commas)
- Frontend ImageGallery splits on '\n', falls back to comma-split for legacy rows

AI classification is a filename heuristic + demo mode flag, not visual analysis.

### 5.3 Reverse Auction

Purpose: Multiple recyclers compete per-kg for a lot.
Flow: Recyclers see open lots on /recycler/lots, type ₹/kg bid. Frontend shows
live total: amount × weightKg. POST /lots/{lotId}/bids saves Bid, moves lot to
BIDDING, broadcasts on /topic/lots/{lotId}/bids. Strict-increase rule: backend
rejects bids ≤ current highest.
Collector sees live bids in BidPanel + LotPreviewModal. Close Auction Now →
POST /lots/{lotId}/close-auction. BidService.finalizeAuction picks top bid →
winner ACCEPTED, others REJECTED, lot → MATCHED with selectedRecycler set.
Auto-close: AuctionScheduler runs every 60s, closes lots past auctionEndsAt.
Empty auction: lot is deleted and LOT_DELETED broadcast.
Batch summaries: POST /lots/bids-summary returns highest bid + bidder for many lots.
Files: BidController.java, BidService.java, AuctionScheduler.java, Bid.java,
BidPanel.jsx, RecyclerLots.jsx, AuctionTimer.jsx, LotPreviewModal.jsx.

### 5.4 QR Handover + Scan

Purpose: Physical proof-of-receipt at handover.
Flow: Collector views lot → Show QR (lotId encoded). Recycler → Handovers →
Scan Lot QR (html5-qrcode camera) or manual entry. On match, recycler enters
verified weight, final price, payment method (Cash / UPI / Bank Transfer).
POST /lots/{lotId}/handover → status PAID or PAYMENT_PENDING.
Live "Payment Received" banner appears on collector's LotDetail.
Files: QRScanner.jsx, useScanner.js, ScanFAB.jsx, RecyclerHandovers.jsx,
LotService.confirmHandover.

### 5.5 Live Updates (WebSocket)

Purpose: Bid updates, lot status changes, notifications without refresh.
Topics: /topic/lots (global), /topic/lots/{lotId}/bids (per-lot).
Files: WebSocketConfig.java (reads CORS_ALLOWED_ORIGINS env var),
WebSocketContext.jsx (exposes client, connected, clientVersion).

### 5.6 Offline Queue (localStorage)

Purpose: Lot creation without internet.
Flow: CreateLot detects network error → addPendingAction({ type: 'CREATE_LOT',
data }). OfflineDB in services/db.js persists queue in localStorage (including
base64 photos as data URLs).
On 'online' event + every 20s sweep + visibilitychange: autoSync iterates queue.
For CREATE_LOT: photos are already base64 — no /ai/classify round-trip. POST /lots
directly. On success, action deleted + syncDone++ (triggers refetch in Dashboard).
On failure: action stays queued for retry. Backend 500 aborts sync — no partial
lot without photo.
Files: services/db.js, OfflineContext.jsx.

### 5.7 Spoken Prices

Purpose: Low-literacy access to price info.
Implementation: Prices page Listen button → window.speechSynthesis.speak with
language-matched voice. SPEAK_LABELS[language].
Limitation: Depends on OS-installed TTS voices. On Linux without Indian voices,
falls back to default.
Note: Prices.jsx was removed from main nav; auction replaced it. Spoken price
still available.

### 5.8 PWA + Android APK

Manifest: frontend/public/manifest.webmanifest (name, icons 192/512/maskable,
theme, display=standalone).
Service worker: frontend/public/sw.js — cache-first for assets.
InstallPrompt.jsx: banner prompting "Add to Home Screen".
Registered in main.jsx on load.
APK: built via PWABuilder.com from the Vercel URL. Installable on Android.

### 5.9 Admin Panel

Purpose: Platform ops.
Features: Real stats (collector count, recycler count, lot count, paid total,
pending verifications), user list, recycler list, recent activity (last 5 lots).
Files: AdminController.java, AdminDashboard.jsx.

### 5.10 Mobile Layout

Top bar: online/bell/language/logout.
Bottom nav: 5 icons (Home, CreateLot, Earnings/Lots, Handovers, Profile).
Responsive CSS in styles/mobile-fix.css. AutoFitNumber component for long ₹ values.
Files: Navbar.jsx, Layout.jsx, mobile-fix.css, AutoFitNumber.jsx.

---

## 6. Complete Workflow

Collector logs in (JWT) → Create Lot with photo → BIDDING with 24h timer →
Recyclers see lot (WS live), place bids → Collector sees bids live → Collector
closes auction or scheduler auto-closes → Top bid wins → MATCHED with winner set
→ Physical meetup → Recycler scans QR → submits verified weight + final price +
payment method → PAID → Collector earnings update.

## 7. High-Level Architecture

Three-tier + CDN:
- Frontend: React SPA on Vercel (global CDN)
- Backend: Spring Boot REST/STOMP on Render (Docker, Singapore)
- Database: PostgreSQL on Render
- Images: base64 data URLs stored in Postgres (no filesystem dependency)

Local dev mirrors this: Vite on :5173, Spring Boot on :8080, Postgres on :5432.

## 8. Technology Stack

| Layer | Tech | Version |
|---|---|---|
| Frontend | React | 18 |
| Build | Vite | 5.4 |
| Language | JavaScript | ES2022 |
| i18n | Custom hook | - |
| QR generate | qrcode.react | 3.1 |
| QR scan | html5-qrcode | latest |
| WS client | @stomp/stompjs + sockjs-client | - |
| Backend | Spring Boot | 3.2.0 |
| Language | Java | 21 Temurin |
| Security | Spring Security + jjwt | 6.2 / 0.11.5 |
| ORM | Spring Data JPA + Hibernate | 3.2 / 6.3.1 |
| DB | PostgreSQL | 16 |
| Build | Maven | 3.9.11 |
| Container | Docker (multi-stage) | - |
| Frontend host | Vercel | - |
| Backend host | Render | - |
| APK builder | PWABuilder.com | - |

## 9. Repository Structure

Two dev machines, same repo:
- User's Mint laptop: ~/projects/re-circle
- Friend's Fedora laptop: ~/re-circle

Key directories:
- backend/Dockerfile (multi-stage: maven → temurin-jre-alpine)
- backend/src/main/java/com/recircle/
  - config/ (WebConfig, WebSocketConfig, DatabaseConfig, DataSeeder)
  - controller/ (13 controllers)
  - dto/, entity/, repository/, scheduler/, security/, service/
- frontend/public/ (manifest.webmanifest, sw.js, icons)
- frontend/src/
  - config.js (API_URL, WS_URL from VITE_* env vars)
  - ai/, api/, components/common/, components/layout/, context/, hooks/,
    pages/ (incl. admin/, recycler/), services/, styles/, translations/

## 10. Frontend Architecture

- Router: React Router v6, guards in App.jsx
- AuthContext: user, isAuthenticated, login, logout, JWT in localStorage
- LanguageContext: whitelist en/hi/mr/ta/te/kn/ml
- WebSocketContext: client, connected, clientVersion
- OfflineContext: isOnline, pendingSyncCount, syncDone, addPendingAction, syncNow
- ProtectedRoute: allowedRoles prop
- axios.js: adds Authorization header, uses config.API_URL
- config.js: reads VITE_API_URL / VITE_WS_URL (baked at build time)

## 11. Backend Architecture

Request lifecycle:
HTTP → JwtRequestFilter → SecurityConfig → Controller → Service → Repository
(JPA) → Postgres → DTO/entity → Jackson → JSON.

DatabaseConfig.java: parses Render's postgres:// URL into a JDBC URL.
WebSocketConfig.java: reads origins from app.cors.allowed-origins (env var).
AuctionScheduler: @Scheduled every 60s.

## 12. API Documentation

Auth:
- POST /auth/login — issue JWT
- POST /auth/register

Lots:
- POST /lots — create
- GET /lots — list
- GET /lots/my — collector's own
- GET /lots/{id} — by lotId
- GET /lots/recycler/pending-handovers
- POST /lots/{lotId}/close-auction
- POST /lots/{lotId}/handover
- POST /lots/bids-summary — batch summaries for open lots

Bids:
- POST /lots/{lotId}/bids
- GET /lots/{lotId}/bids
- POST /lots/{lotId}/bids/{bidId}/accept

Admin:
- GET /admin/stats, /admin/users, /admin/recyclers, /admin/activity/recent
- PUT /admin/recyclers/{id}/verify

AI / files:
- POST /ai/classify — returns base64 data URL + category hint

Earnings:
- GET /earnings/summary
- GET /earnings/transactions?period=

Misc:
- GET /health
- GET /prices?category=

---

## 13. Database Architecture

Tables: users, material_lots, material_categories, recyclers, bids,
recycler_offers, price_records, collector_profiles.

Key columns on material_lots:
- image_url TEXT (was VARCHAR(255) — base64 needs TEXT)
- image_urls TEXT (newline-separated list of base64 data URLs)
- status CHECK includes 10 values (see section 8 in handoff)
- payment_method VARCHAR(20) (CASH / UPI / BANK_TRANSFER)
- auction_ends_at TIMESTAMP

Critical constraint:
CHECK (status IN ('CREATED','BIDDING','MATCHED','PICKUP_SCHEDULED','IN_TRANSIT',
                  'HANDED_OVER','RECEIVED','PAYMENT_PENDING','PAID','COMPLETED'))

## 14. Data Models (MaterialLot excerpt)

| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| lotId | String | RC-YYYY-NNNNNN format |
| imageUrl | TEXT | base64 data URL or path |
| imageUrls | TEXT | newline-separated base64 data URLs |
| weightKg | Double | > 0 |
| condition | enum | GOOD / MIXED / DAMAGED |
| status | enum | 10-value state machine |
| auctionEndsAt | LocalDateTime | now + 24h on create |
| paymentMethod | String | Cash / UPI / Bank Transfer |

Full field list in section 13 of source.

## 15. Authentication and Authorization

- BCrypt password hashing
- JWT HS256, 24h expiry
- JwtRequestFilter reads Bearer token
- SecurityConfig: /auth/**, /ws/**, /health, /error, /uploads/** permitAll;
  OPTIONS /** permitAll; rest authenticated
- ProtectedRoute + axios interceptor on frontend

Limitations: no refresh tokens, no revocation, no rate limit on login,
localStorage shared across tabs (demo constraint).

## 16. Security Architecture

| Concern | Status |
|---|---|
| Password hashing | BCrypt |
| JWT auth | HS256, 24h |
| Password in JSON | @JsonIgnore |
| SQL injection | JPA parameterized |
| CORS | Env-var allowlist (Vercel + localhost) |
| CSRF | Disabled (stateless) |
| XSS | React escaping |
| Rate limiting | NOT IMPLEMENTED |
| Secrets | Render env vars (JWT_SECRET, DATABASE_URL, CORS_ALLOWED_ORIGINS) |
| File upload | MIME check + size cap 10MB |

## 17. Error Handling

Frontend: axios interceptor logs; pages wrap in try/catch.
Backend: controllers return ResponseEntity; no global @ControllerAdvice.
Known: Render free tier returns 503 during cold start (15 min idle → sleep).
Fix in app: offline queue retries on next 20s sweep.

## 18. Validation

| Field | Rule | Where |
|---|---|---|
| weightKg | > 0 | Front + back |
| amountPerKg (bid) | > current highest | BidService |
| materialCategoryName | must exist | LotService |
| verifiedWeight | > 0 | confirmHandover |
| finalPrice | > 0 | confirmHandover |
| auction open | status in {CREATED, BIDDING} | BidService |

## 19. Configuration

Local application.properties (backend):
- server.port=8080
- spring.datasource.url=jdbc:postgresql://localhost:5432/recircle_db
- jwt.secret=<local>
- spring.jpa.hibernate.ddl-auto=update

Render env vars:
- DATABASE_URL (parsed by DatabaseConfig.java)
- JWT_SECRET
- CORS_ALLOWED_ORIGINS=https://re-circle-psi.vercel.app,http://localhost:5173,...

Vercel env vars:
- VITE_API_URL=https://re-circle-api.onrender.com
- VITE_WS_URL=https://re-circle-api.onrender.com

---

## 20. Local Development Setup

Prereqs: Java 21, Maven 3.9+, Node 20+, PostgreSQL 16+.

Backend:
  cd ~/re-circle/backend  (or ~/projects/re-circle/backend)
  mvn clean install -DskipTests
  mvn spring-boot:run
  # Wait for: Started RecircleApplication in XX seconds

Frontend:
  cd ~/re-circle/frontend
  npm install
  npm run dev
  # http://localhost:5173

Postgres: sudo systemctl start postgresql

Demo logins (all password listed):
- admin@recircle.demo / Admin@123
- collector@recircle.demo / Collector@123
- recycler@recircle.demo / Recycler@123
- 6 test recyclers + 6 test collectors / 12345678

Test accounts created by DataSeeder.seedTestAccounts() idempotently on every boot.

## 21. Deployment

Frontend — Vercel:
- Import GitHub repo, Root Directory: frontend, Framework: Vite
- Build: npm run build
- Env vars: VITE_API_URL + VITE_WS_URL (both = backend URL)
- Auto-deploys on push to master

Backend — Render:
- Web Service, Root Directory: backend, Runtime: Docker
- Env vars: DATABASE_URL, JWT_SECRET, CORS_ALLOWED_ORIGINS
- Auto-deploys on push to master
- Free tier: sleeps after 15 min idle; cold start ~30-60s

Database — Render Postgres:
- Free tier, no backups
- Connection: use External URL from Render dashboard
- ALTER via psql on local machine (see section 24 troubleshooting)

APK — PWABuilder:
- Feed https://re-circle-psi.vercel.app → build → download APK
- Rebuild after each frontend change (baked bundle)

## 22. Testing

No automated tests. Manual verification only.
Technical debt — should be listed for v2.

## 23. Performance Considerations

Implemented: WebSocket broadcasts, batch /lots/bids-summary, silent background
polls in RecyclerLots (no more blink), @JsonIgnore preventing recursion.

Bottlenecks: findAll() on admin, no pagination, no caching, base64 images
inflate payloads (acceptable for demo).

## 24. Scalability

Current: single-instance Spring Boot + single Postgres. Fine for demo.
Production would need: broker (RabbitMQ), object storage (S3/Cloudinary),
CDN for uploads, read replicas, horizontal scaling (JWT already stateless).

## 25. Reliability

- Offline queue provides resilience for lot creation
- WebSocket auto-reconnect ~5s
- @Transactional on services rolls back on failure
- Render cold start (503) → offline queue retries

## 26. Business Logic

Lot lifecycle: CREATED → BIDDING → MATCHED → HANDED_OVER → PAID (or
PAYMENT_PENDING → PAID) → COMPLETED.

Key rule: Earnings only count PAID/COMPLETED lots. MATCHED shows as pending.

---

## 27. EPR / Regulatory Context

RE-CIRCLE is not an EPR compliance tool — it's a channel that could feed one.
E-Waste (Management) Rules 2022 require producers to fund formal recycling via
EPR certificates. CPCB-authorized recyclers issue certificates. RE-CIRCLE
provides the traceability chain (QR + timestamp + status) that could justify
EPR credits. No formal EPR filing is implemented.

## 28. User Journey

Collector: Login → Dashboard → Create Lot (multi-photo) → LotDetail shows timer
+ live bids + QR → Close Auction → MATCHED → meet recycler → show QR → Earnings
updates when PAID.

Recycler: Login → Dashboard → Lots page → bid ₹/kg → live total → auction closes
→ My Matched Lots → Handovers → scan QR → confirm weight/price/method → Spending.

Admin: Login → Stats / Users / Recyclers.

## 29. Sequence — Bid and Accept

Recycler types bid → POST /lots/{lotId}/bids → BidService.placeBid saves Bid,
updates lot to BIDDING, broadcasts /topic/lots/{lotId}/bids → frontend receives
200 → WS pushes live bid to collector's BidPanel.

## 30. Lot State Machine

CREATED → BIDDING (first bid or create)
BIDDING → MATCHED (closeAuction with winner)
BIDDING → deleted (closeAuction with no bids)
MATCHED → HANDED_OVER → PAID (confirmHandover)
MATCHED → PAYMENT_PENDING → PAID (deferred)
PAID → COMPLETED (manual)

Currently exercised: CREATED → BIDDING → MATCHED → PAID.

## 31. Business Rules

| Rule | Where |
|---|---|
| Weight > 0 | CreateLot.jsx + LotService |
| Category must exist | LotService |
| Bid > current highest | BidService.placeBid |
| Only owning collector closes auction | BidService.closeAuction |
| Only recycler bids | SecurityConfig |
| Only assigned recycler confirms handover | LotService.confirmHandover |
| Earnings count only PAID/COMPLETED | Earnings.jsx |
| Empty auctions delete the lot | BidService.finalizeAuction |

## 32. Algorithms

Haversine distance (BidPanel.jsx): lot lat/lng → recycler lat/lng → km (int).
Used for distance chip on bid rows.

Auction winner (BidService.finalizeAuction): top by amountPerKg DESC → ACCEPTED,
others REJECTED.

Image separator fix: imageUrls uses '\n' not ',' because base64 payloads contain
commas. Frontend ImageGallery splits on '\n', falls back to ',' for legacy rows.

## 33. Third-Party Services

Runtime: none (all on Render/Vercel/PWABuilder).
Dev: none.
Planned: TF.js MobileNet v2 via CDN; Cloudinary for image storage.

## 34. Logging and Monitoring

Backend: SLF4J/Logback default levels.
Frontend: console.log/error for API + WS + sync events.
No structured logs, no Sentry, only /health for liveness.
Render logs viewable in dashboard.

## 35. Privacy and Data Handling

| Data | Where |
|---|---|
| Email, name, phone | users table |
| Password | BCrypt hash only |
| Lot details | material_lots |
| Images | material_lots.image_url(s) as base64 TEXT |
| JWT | Browser localStorage |

Not collected: Aadhaar, PAN, bank details, device IDs.

---

## 36. Known Limitations

- No automated tests
- No CI/CD (Render + Vercel auto-deploy on push, but no test gate)
- AI classification is filename heuristic
- No rate limiting
- Render free tier: 503 on cold start, no backups, ephemeral filesystem
- No pagination on admin endpoints
- Two-tab same-browser JWT collision
- Notification dropdown hardcoded English
- Safety translations complete in 7 languages, but material-specific guidance
  falls back to English for ta/te/kn/ml
- Admin delete recycler is client-only (no backend endpoint)
- Base64 images inflate payloads (~130 KB per photo)

## 37. Future Improvements

Short-term:
- Real TF.js MobileNet v2 classifier (in-browser, ~30s warm-up)
- Cloudinary/S3 for image storage
- Field research docs + unit economics slide
- Pitch deck + demo script

Medium-term:
- Play Store submission via Capacitor
- Refresh tokens
- Rate limiting on auth
- Backend admin CRUD endpoints
- Web Push notifications

Long-term:
- EPR certificate generation
- Razorpay/UPI payment integration
- Real-time GPS tracking
- ML fine-tuning on labeled e-waste photos

## 38. Technical Debt

| Area | Why | Fix |
|---|---|---|
| No tests | Regression risk | JUnit + Vitest |
| No @ControllerAdvice | Inconsistent errors | Global handler |
| Base64 in DB | Bloats rows | Object storage |
| Render ephemeral FS | uploads wiped | Cloudinary |
| No CI | Manual deploy risk | GitHub Actions |
| Hardcoded strings | Navbar notifications | Extend translations |

## 39. Contribution Guide

Branch per feature: feat/<short-name>.
Commit: feat: / fix: / chore: / docs:.
PR requires: mvn -q compile passes + npm run dev boots.

## 40. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Backend 500 on POST /lots | image_url VARCHAR(255) | ALTER COLUMN image_url TYPE TEXT |
| Images show 2/2 but blank | base64 comma split | Newline separator in imageUrls |
| Sync never finishes | Render cold start 503 | Wait 20s, retry fires automatically |
| CORS error from Vercel | Missing origin in env var | Add to CORS_ALLOWED_ORIGINS on Render |
| WebSocket blocked | WebSocketConfig hardcoded localhost | Read from app.cors.allowed-origins |
| Login 400 Bad credentials | DataSeeder guard blocked extras | seedTestAccounts runs before guard |
| Recycler lots blink | setLoading every 3s poll | silent flag on fetchAll |
| APK can't reach backend | VITE_API_URL not set at build | Set in Vercel, rebuild APK |
| Photo 404 after redeploy | Render wiped /uploads/ | Base64 fix — new photos survive |
| Brute-force test loops | 400 auth | Check credentials vs seeder |

## 41. Hackathon Demonstration Flow (3 min)

1. Problem slide
2. Solution slide
3. Live: collector login → Create Lot (5 kg PCB + photo)
4. LotDetail opens, 24h timer counting down
5. Second window (private): recycler login → lot appears live via WS
6. Recycler bids ₹500 → live total shows ₹2,500
7. Collector sees bid stream in real time
8. Collector → Close Auction Now → lot flips to MATCHED
9. Recycler → Handovers → scan QR → weight + price + Cash → PAID
10. Collector → Earnings → shows completed transaction
11. Architecture + tech stack slide
12. Roadmap slide (field research + unit economics + AI v2)

## 42. Judge-Focused Highlights

- Reverse auction (better than PS "recycler matching") — collective bargaining
- Real-time WebSocket multi-user flow
- 24h auto-close scheduler (@Scheduled 60s)
- QR handover with EPR-ready state machine
- 7 languages (PS asked min 2)
- Offline-first with auto-sync and photo persistence
- PWA installable + Android APK
- Photo + AI classification pipeline (baseline, honest about v2)

## 43. Project Metrics

| Metric | Count |
|---|---|
| Backend controllers | 13 |
| Backend service classes | ~6 |
| Backend entities | ~8 |
| Frontend pages | ~20 |
| Languages | 7 |
| Auth roles | 3 |
| REST endpoints | ~30 |
| WebSocket topics | 2 |
| DB tables | 8 |
| Test accounts | 20+ |

## 44. Glossary

Kabadiwala = informal scrap collector
EPR = Extended Producer Responsibility
CPCB = Central Pollution Control Board (India)
Lot = declared batch of e-waste
Bid = per-kg offer by recycler
Handover = physical transfer
Match = lot assigned to winning recycler
PAID = fully settled transaction

## 45. Final Summary

RE-CIRCLE is a two-tier React SPA + Spring Boot REST/STOMP API, backed by
PostgreSQL, deployed on Vercel + Render, installable as PWA + APK. Core flow
is a reverse auction with WebSocket live updates, followed by a QR-verified
handover and status transition to PAID. JWT + BCrypt auth. Offline queue with
auto-sync. 7 languages. Base64 image storage to survive ephemeral hosting.
Primary gaps: no automated tests, no field research docs, no unit economics
slide — all on the near-term roadmap.

## 46. Source Code Reference

| Feature | Files |
|---|---|
| Auth | AuthController, AuthService, JwtUtil, JwtRequestFilter, SecurityConfig, AuthContext.jsx |
| Lot CRUD | LotController, LotService, MaterialLot, MaterialLotRepository |
| Auction | BidController, BidService, AuctionScheduler, Bid, BidRepository, AuctionTimer.jsx, BidPanel.jsx, LotPreviewModal.jsx |
| Handover | RecyclerHandovers.jsx, LotService.confirmHandover, QRScanner.jsx, useScanner.js |
| Scanner FAB | ScanFAB.jsx, Layout.jsx |
| Offline | services/db.js, OfflineContext.jsx |
| i18n | hooks/useTranslation.js, LanguageContext.jsx, translations/index.js |
| Photo + AI | CreateLot.jsx, ImageGallery.jsx, api/ai.js, AIController.java |
| PWA | manifest.webmanifest, sw.js, InstallPrompt.jsx, main.jsx |
| Admin | AdminController.java, AdminDashboard.jsx |
| Earnings | EarningsController, EarningsService, Earnings.jsx |
| Deploy | backend/Dockerfile, frontend/config.js, DatabaseConfig.java |

---

*End of documentation.*
