# RE-CIRCLE — Complete Technical Documentation

A vernacular, offline-tolerant web platform connecting India's informal e-waste
collectors (kabadiwalas) to CPCB-authorized recyclers via reverse-auction bidding,
QR-verified handovers, and a 7-language UI.

---

## 1. Executive Overview

RE-CIRCLE is a full-stack web application that bridges the informal e-waste
collection sector and India's formal EPR recycling chain.

**The problem:** ~90% of India's e-waste is collected by informal kabadiwalas.
They have no access to fair prices, no visibility into which recyclers are
CPCB-authorized, and no documented handover trail. Material ends up in backyard
processing — open-air cable burning, acid leaching of PCBs — poisoning workers
and losing valuable rare earths.

**What RE-CIRCLE does:**
- Lets collectors photograph, categorize, and list e-waste as digital "lots"
- Runs a reverse auction — recyclers bid per-kg, highest bid wins
- Enforces a 24-hour auction window with auto-close, or collector can close early
- Generates a QR code the recycler scans at physical handover
- Records verified weight, final price, payment method (Cash / UPI / Bank Transfer)
- Maintains an earnings ledger per collector
- Speaks Hindi, Marathi, Tamil, Telugu, Kannada, Malayalam, English
- Works offline — collector can create lots with no internet; syncs on reconnect

**Intended users:** informal scrap collectors, licensed recyclers, platform admins.

---

## 2. Problem Statement

Formal statement: Design a vernacular, low-literacy, offline-tolerant mobile
platform that enables informal scrap collectors to:
- Discover fair prices
- Connect directly with authorized recyclers
- Complete a documented, traceable handover
- Receive payment

**What this software actually implements:**
- Reverse auction for price discovery
- Recycler matching by bid amount (with distance chip as informational signal)
- QR-verified handover with weight + timestamp + status chain
- Vernacular UI in 7 languages
- Offline queue with auto-sync

**What remains outside scope:**
- Legal EPR filing on behalf of producers
- Actual payment processing (records method, does not move money)
- Real-time GPS tracking during transit
- AI-based price prediction

---

## 3. Project Objectives

### Primary (implemented)
- Enable collector to recycler transactions via auction
- Provide price discovery through competitive bidding
- Generate verifiable handover receipts via QR
- Support Hindi + Marathi (+5 more)
- Offline-first lot creation

### Secondary (implemented)
- Role-based dashboards (collector, recycler, admin)
- Admin verification of recyclers
- Photo upload + AI category suggestion
- Spoken price readout (browser TTS)

### Future (planned, not implemented)
- Real ML image classification (MobileNet v2 in-browser)
- PWA install / native Android app
- Distance-based backend ranking of recyclers
- Unit economics + field research documentation

---

## 4. Target Users and Roles

| Role | Purpose | Permissions | Main Features |
|---|---|---|---|
| COLLECTOR (kabadiwala) | Sell e-waste | Create lots, view own lots, accept bids, view earnings, copy QR, share via WhatsApp | Dashboard, CreateLot, Prices, Earnings, Safety, Profile, LotDetail |
| RECYCLER | Buy e-waste | View open lots, place bids, scan QR, confirm handover, set payment method | Dashboard, Lots, Handovers, Spending, Profile |
| ADMIN | Platform ops | View all users, verify recyclers, see platform stats | AdminDashboard, Users, Recyclers, Stats |

Roles stored as User.role enum: COLLECTOR, RECYCLER, ADMIN.
Access enforced by ProtectedRoute.jsx (frontend) + Spring Security (backend).

---

## 5. System Features

### 5.1 Authentication (JWT)
Purpose: Issue 24h JWT tokens for stateless auth across 3 roles.
Flow: POST /auth/login, verify BCrypt hash, issue JWT with role and sub claims.
Files: AuthController.java, AuthService.java, JwtUtil.java, JwtRequestFilter.java,
AuthContext.jsx.
Security: Passwords hashed with BCrypt. JWT signed HS256. Password field annotated
@JsonIgnore so it never leaves the API.

### 5.2 Create Lot with Photo + AI Suggest
Purpose: Collector uploads photo, gets suggested category, submits lot.
Flow: Collector picks image, POST /ai/classify saves file to uploads/ returns
/uploads/<ts>_<name> and a filename-based category hint. Indicative value shown:
DEFAULT_PRICE_PER_KG[category] * weightKg. On submit, POST /lots with imageUrl,
weight, category, location. Lot enters status BIDDING with auctionEndsAt = now + 24h.
Validation: weight > 0; category must exist.
Files: CreateLot.jsx, AIController.java, LotService.createLot, WebConfig.java.
Note: AI classification is currently a filename heuristic, not real image analysis.

### 5.3 Reverse Auction
Purpose: Multiple recyclers compete for the collector's lot.
Flow: Recyclers see open lots on /recycler/lots and type rupee-per-kg bid. Frontend
shows live total: x weightKg = total. POST /lots/{lotId}/bids saves Bid, moves lot
to BIDDING, broadcasts on /topic/lots/{lotId}/bids. Collector sees live bids in
BidPanel on LotDetail. Collector clicks Close Auction Now, POST /lots/{lotId}/close-auction.
BidService.finalizeAuction picks top bid, sets winner ACCEPTED, others REJECTED, lot
status to MATCHED with selectedRecycler, offeredPricePerKg, estimatedValue set.
Auto-close: AuctionScheduler runs every 60s, finds lots past auctionEndsAt, calls
finalizeAuction.
Empty auction: If no bids, finalizeAuction deletes the lot and broadcasts LOT_DELETED.
Files: BidController.java, BidService.java, AuctionScheduler.java, Bid.java,
BidPanel.jsx, RecyclerLots.jsx, AuctionTimer.jsx.

### 5.4 QR Handover + Scan
Purpose: Physical proof-of-receipt at handover.
Flow: Collector views lot, Show QR Code, QR contains the lotId string. Recycler
navigates to Handovers, clicks Scan Lot QR. QRScanner opens camera via html5-qrcode,
extracts RC-YYYY-NNNNNN from decoded text. On match, opens confirm modal, recycler
enters verified weight, final price, payment method. POST /lots/{lotId}/handover,
status to PAID (or PAYMENT_PENDING), timestamps handoverAt + completedAt set.
Fallback: Manual lot ID entry inside scanner modal.
Files: QRScanner.jsx, useScanner.js, ScanFAB.jsx, RecyclerHandovers.jsx,
LotService.confirmHandover.

### 5.5 Live Updates (WebSocket)
Purpose: Bid updates, lot status changes, notifications without page refresh.
Topics: /topic/lots (global), /topic/lots/{lotId}/bids (per-lot bid feed).
Files: WebSocketConfig.java, WebSocketContext.jsx (exposes client, connected,
clientVersion).

### 5.6 Offline Queue
Purpose: Allow lot creation without internet.
Flow: CreateLot detects network error, calls addPendingAction({type:'CREATE_LOT',
data:lotData}). OfflineDB (localStorage-backed) persists queue. On online event or
every 20s, autoSync iterates queue, POSTs each action, removes on success. New lot
appears on Dashboard after syncDone counter bumps.
Files: services/db.js, OfflineContext.jsx.

### 5.7 Spoken Prices
Purpose: Low-literacy access to price info.
Implementation: On Prices page, Listen button calls window.speechSynthesis.speak
with language-matched voice. Utterance text composed from SPEAK_LABELS[language].
Files: Prices.jsx.
Limitation: Depends on OS-installed TTS voices. On Fedora/Firefox without Indian
voices, falls back to default voice.

### 5.8 Admin Panel
Purpose: Platform ops.
Features: Real stats (collector count, recycler count, lot count, paid total,
pending verifications), user list, recycler list, recent activity (last 5 lots).
Files: AdminController.java, AdminDashboard.jsx.

---

## 6. Complete System Workflow

Collector logs in, receives JWT. Creates lot with photo. Lot enters BIDDING with
24h timer. Recyclers see lot, place bids. WebSocket pushes bids live to collector.
Collector closes auction manually or scheduler closes at expiry. Top bid wins, lot
becomes MATCHED with winner assigned. Physical meetup happens. Recycler scans QR,
submits verified weight + final price + payment method. Lot becomes PAID. Collector
earnings update.

---

## 7. High-Level Architecture

Three-tier: React SPA on localhost:5173, Spring Boot API on localhost:8080,
PostgreSQL on localhost:5432. Browser talks to backend via REST + JWT for CRUD and
STOMP over SockJS for WebSocket live updates. Backend writes uploaded images to
backend/uploads/ and serves them at /uploads/**. No external services or cloud
dependencies at runtime.

---

## 8. Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Frontend | React | 18 | UI |
| Build | Vite | 5.4 | Dev server + bundler |
| Language | JavaScript | ES2022 | No TypeScript |
| i18n | Custom hook | - | 7-language dictionary |
| QR generate | qrcode.react | 3.1 | Canvas QR rendering |
| QR scan | html5-qrcode | latest | Camera scan |
| WS client | @stomp/stompjs + sockjs-client | - | Live updates |
| Backend | Spring Boot | 3.2.0 | REST + WS server |
| Language | Java | 21 Temurin | - |
| Security | Spring Security + jjwt | 6.2 / 0.11.5 | JWT auth |
| ORM | Spring Data JPA + Hibernate | 3.2 / 6.3.1 | Entity mapping |
| DB | PostgreSQL | 16+ | Persistent storage |
| Build | Maven | 3.9.11 | Backend build |
| Auth | BCrypt + HS256 JWT | - | Password + token |

---

## 9. Repository Structure

~/projects/re-circle/
- DATASETS.md
- documentation.md
- backend/
  - pom.xml
  - uploads/                      served at /uploads/**
  - src/main/java/com/recircle/
    - RecircleApplication.java    @EnableScheduling
    - config/                     WebConfig, WebSocketConfig
    - controller/                 13 controllers
    - dto/                        AuthRequest, CreateLotRequest, BidRequest
    - entity/                     User, MaterialLot, Recycler, Bid
    - repository/                 8 repos
    - scheduler/                  AuctionScheduler
    - security/                   SecurityConfig, JwtRequestFilter, JwtUtil
    - service/                    AuthService, BidService, LotService
- frontend/
  - src/
    - api/                        axios, bids, lots, ai, prices, recyclers
    - components/common/          BidPanel, QRScanner, ScanFAB, AuctionTimer, CopyButton
    - components/layout/          Layout, Navbar
    - context/                    Auth, Language, WebSocket, Offline
    - hooks/                      useScanner, useTranslation
    - pages/                      CreateLot, Dashboard, LotDetail, ...
      - admin/AdminDashboard.jsx
      - recycler/                 RecyclerDashboard, RecyclerLots, RecyclerHandovers
    - services/db.js              offline queue
    - translations/index.js       7 languages

---

## 10. Frontend Architecture

Router: React Router v6, App.jsx defines routes + role guards.
Auth context: AuthContext.jsx holds user, isAuthenticated, login, logout. JWT in
localStorage.
Language context: LanguageContext.jsx whitelists en, hi, mr, ta, te, kn, ml.
WebSocket context: exposes client, connected, clientVersion. Value memoized so
consumers do not re-render on every notification.
Offline context: exposes isOnline, pendingSyncCount, syncDone, addPendingAction,
syncNow.
Protected route: <ProtectedRoute allowedRoles={['RECYCLER']}> redirects if role
mismatches.
API layer: axios.js adds JWT header on every request. bids.js, lots.js, ai.js
wrap specific endpoints.

---

## 11. Backend Architecture

Request lifecycle:
HTTP -> JwtRequestFilter -> SecurityConfig (authorize rules) -> Controller ->
Service -> Repository (JPA) -> PostgreSQL -> DTO/entity -> JSON via Jackson ->
response.

All controllers under com.recircle.controller.
Business logic in com.recircle.service.
JPA repositories in com.recircle.repository.
Scheduled task: AuctionScheduler.closeExpiredAuctions() every 60s.
WebSocket broadcast via SimpMessagingTemplate to /topic/*.

---

## 12. API Documentation

### Auth
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /auth/login | none | Issue JWT |
| POST | /auth/register | none | Register user |

### Lots
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /lots | COLLECTOR | Create lot (enters BIDDING) |
| GET | /lots | any | List all lots |
| GET | /lots/my | COLLECTOR | Collector's own lots |
| GET | /lots/{id} | any | Get by lotId |
| GET | /lots/lot/{lotId} | any | Get by lotId alias |
| GET | /lots/recycler/pending-handovers | RECYCLER | Assigned lots |
| POST | /lots/{lotId}/close-auction | COLLECTOR | Early close |
| POST | /lots/{lotId}/handover | RECYCLER | Confirm handover |

### Bids
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /lots/{lotId}/bids | RECYCLER | Place bid |
| GET | /lots/{lotId}/bids | any | List bids |
| POST | /lots/{lotId}/bids/{bidId}/accept | COLLECTOR | Accept manually |

### Admin
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | /admin/stats | ADMIN | Platform stats |
| GET | /admin/users | ADMIN | User list |
| GET | /admin/recyclers | ADMIN | Recycler list |
| GET | /admin/activity/recent | ADMIN | Recent 5 lots |
| PUT | /admin/recyclers/{id}/verify | ADMIN | Mark authorized |

### AI and Files
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /ai/classify | any | Upload image, get category hint |
| GET | /uploads/** | public | Serve uploaded images |

### Earnings
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | /earnings/summary | COLLECTOR | Aggregated stats |
| GET | /earnings/transactions?period= | COLLECTOR | Filtered tx list |

### Misc
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | /health | none | Liveness |
| GET | /prices?category= | any | Price lookup |

---

## 13. Database Architecture

Tables (from entities):
- users: id, email, password (bcrypt), full_name, phone_number, role, enabled,
  created_at
- material_lots: id, lot_id, collector_id, material_category_id, recycler_id,
  image_url, description, weight_kg, verified_weight_kg, condition, source_type,
  collection_lat/lng/address, offered_price_per_kg, final_price_per_kg,
  estimated_value, final_value, transport_cost, net_earnings, status,
  payment_method, qr_code_data, auction_ends_at, created_at, updated_at,
  handover_at, completed_at, is_synced
- material_categories: id, name, description, default_price_per_kg, active,
  safety_guidance
- recyclers: id, user_id, company_name, facility_address, lat, lng,
  authorization_number, authorized, contact_person, contact_phone,
  pickup_available, service_area, service_radius_km, is_active, created_at,
  updated_at
- bids: id, lot_id, recycler_id, amount_per_kg, total_amount, status, created_at,
  updated_at
- recycler_offers: id, recycler_id, material_category_id, price_per_kg,
  min_weight_kg, max_weight_kg, is_active
- price_records: historical price snapshots
- collector_profiles: additional collector data

Relationships:
- users 1:N material_lots (as collector)
- recyclers 1:1 users
- material_lots N:1 material_categories
- material_lots N:1 recyclers (selected recycler)
- material_lots 1:N bids
- recyclers 1:N bids
- recyclers 1:N recycler_offers

Critical constraint:
CHECK (status IN ('CREATED','BIDDING','MATCHED','PICKUP_SCHEDULED','IN_TRANSIT',
                  'HANDED_OVER','RECEIVED','PAYMENT_PENDING','PAID','COMPLETED'))

---

## 14. Data Models

### User
| Field | Type | Required | Description |
|---|---|---|---|
| id | UUID | yes | PK |
| email | String | yes | Unique login |
| password | String | yes | BCrypt hash (@JsonIgnore) |
| fullName | String | yes | Display |
| phoneNumber | String | no | Contact |
| role | enum | yes | COLLECTOR / RECYCLER / ADMIN |
| enabled | boolean | yes | Account active |
| createdAt | LocalDateTime | auto | - |

### MaterialLot
Full field list in section 13.

### Bid
| Field | Type | Required |
|---|---|---|
| id | UUID | yes |
| lot | FK | yes (@JsonIgnore serialization) |
| recycler | FK | yes |
| amountPerKg | Double | yes |
| totalAmount | Double | yes |
| status | PENDING / ACCEPTED / REJECTED | yes |
| createdAt | LocalDateTime | auto |

---

## 15. Authentication and Authorization

Implemented:
- BCrypt password hashing
- JWT tokens, HS256 signed, 24h expiry, carry sub (email) + role
- JwtRequestFilter reads Authorization: Bearer <token>, validates, sets
  SecurityContextHolder
- SecurityConfig rules: /auth/**, /ws/**, /health, /error, /uploads/** permitAll;
  OPTIONS /** permitAll; everything else authenticated
- Frontend: ProtectedRoute with allowedRoles prop, redirects to role home
- Frontend: axios.js interceptor adds Authorization header

Limitations:
- No refresh tokens (re-login after 24h)
- No token revocation list (logout is client-side localStorage.clear())
- No rate limiting on login
- localStorage shared across tabs of same origin (demo issue)
- CORS enabled for localhost origins only

---

## 16. Security Architecture

| Concern | Status | Notes |
|---|---|---|
| Password hashing | Implemented | BCrypt |
| JWT auth | Implemented | HS256, 24h |
| Password in JSON | Implemented | @JsonIgnore on User.password |
| SQL injection | Prevented | JPA parameterized queries |
| CORS | Implemented | Origin patterns whitelist |
| CSRF | Disabled | Stateless JWT |
| XSS | Partial | React escapes by default |
| Input validation | Partial | Basic weight/amount checks |
| Rate limiting | Not implemented | - |
| Secrets management | Not implemented | JWT secret in application.properties |
| File upload safety | Partial | MIME check only |
| Role escalation | Partial | Register accepts role from client |

---

## 17. Error Handling

Frontend:
- Axios interceptor logs responses and errors
- Pages wrap fetches in try/catch, set error state
- No React error boundary (recommended addition)

Backend:
- Controllers catch Exception and return ResponseEntity.badRequest with error map
- JWT failures return 401 via Spring Security default
- Role failures return 403
- Constraint violations return 500
- No global @ControllerAdvice

---

## 18. Validation

| Field | Rule | Where |
|---|---|---|
| weightKg | > 0 | Frontend + backend |
| amountPerKg (bid) | > 0 | BidService.placeBid |
| materialCategoryName | must exist in material_categories | Backend |
| paymentStatus | PAID / PAYMENT_PENDING | Backend default |
| paymentMethod | CASH / UPI / BANK_TRANSFER | Backend default CASH |
| verifiedWeight | > 0 | confirmHandover |
| finalPrice | > 0 | confirmHandover |
| auction open state | lot.status in {CREATED, BIDDING} | Backend |

---

## 19. Configuration and Environment Variables

application.properties (backend):
- server.port=8080
- spring.datasource.url=jdbc:postgresql://localhost:5432/recircle_db
- spring.datasource.username=postgres
- spring.datasource.password=<your-db-password>
- spring.jpa.hibernate.ddl-auto=update
- jwt.secret=<your-jwt-secret>
- jwt.expiration=86400000
- spring.servlet.multipart.max-file-size=10MB
- spring.servlet.multipart.max-request-size=10MB

Frontend: axios.js hardcodes http://localhost:8080. No .env file used.

---

## 20. Local Development Setup

1. Clone
git clone https://github.com/abhishekmail-prog/re-circle.git
cd re-circle

2. PostgreSQL
sudo systemctl start postgresql
sudo -i -u postgres psql
  CREATE DATABASE recircle_db;
  ALTER USER postgres WITH PASSWORD 'Recircle@2024';
  \q

3. Fix status constraint
sudo -i -u postgres psql recircle_db -c "
  ALTER TABLE material_lots DROP CONSTRAINT IF EXISTS material_lots_status_check;
  ALTER TABLE material_lots ADD CONSTRAINT material_lots_status_check
    CHECK (status IN ('CREATED','BIDDING','MATCHED','PICKUP_SCHEDULED','IN_TRANSIT',
                      'HANDED_OVER','RECEIVED','PAYMENT_PENDING','PAID','COMPLETED'));
"

4. Extra columns
sudo -i -u postgres psql recircle_db -c "
  ALTER TABLE material_lots ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20);
  ALTER TABLE material_lots ADD COLUMN IF NOT EXISTS auction_ends_at TIMESTAMP;
"

5. Backend
cd backend
mvn clean install -DskipTests
mvn spring-boot:run

6. Frontend (new terminal)
cd ../frontend
npm install
npm run dev

7. Login at http://localhost:5173
collector@recircle.demo / Collector@123
recycler@recircle.demo  / Recycler@123
admin@recircle.demo     / Admin@123

Prerequisites: Java 21, Maven 3.9+, Node 20+, PostgreSQL 16+.

---

## 21. Deployment

Current state: Not deployed. Runs on localhost only. Earlier attempts at Railway,
Render, Koyeb, Fly.io failed (documented in session handoff).

Future: Backend to Render/Fly.io with managed Postgres. Frontend to Vercel/Netlify.
Requires refactoring axios.js to use import.meta.env.VITE_API_BASE_URL.

---

## 22. Testing

Current state: No automated tests exist.
- No JUnit tests in backend
- No Vitest/Jest tests in frontend
- No integration suite
- Manual testing only

Known gap expected for hackathon project. Should be listed as technical debt.

---

## 23. Performance Considerations

Implemented:
- WebSocket broadcast for real-time updates (no polling)
- Repository queries use Spring Data derived queries
- @JsonIgnore on bidirectional relationships prevents Jackson recursion
- Frontend avoids fan-out API calls (RecyclerLots fixed from 32 calls to 1)

Potential bottlenecks:
- findAll() on lots in AdminController (no pagination)
- No caching layer
- Bid list not paginated
- WebSocket broadcasts go to all subscribers

---

## 24. Scalability

Current: Single-instance Spring Boot + single Postgres. Fine for demo, not scale.

Would need for production:
- Horizontal scaling: JWT already stateless
- Message broker (RabbitMQ / Kafka) instead of in-memory STOMP
- Redis for caching
- Object storage (S3) instead of local uploads/
- Read replicas for Postgres
- CDN for frontend assets

---

## 25. Reliability and Fault Tolerance

- No retry on external calls (no external calls)
- Offline queue provides resilience for lot creation
- WebSocket reconnect with 5s delay
- @Transactional on services rolls back on exception
- No circuit breakers (no external deps)

---

## 26. Business Logic

Collector creates lot, enters BIDDING, gets 24h timer.
Collector receives bids via WebSocket.
Collector closes auction (manual or auto), lot becomes MATCHED with winner set.
Recycler meets collector physically.
Recycler scans QR (proof of receipt).
Recycler submits verified weight + final price + payment method.
Lot becomes PAID (or PAYMENT_PENDING).
Collector earnings ledger updates.

Key rule: Earnings only count PAID/COMPLETED lots. MATCHED lots show as pending.

---

## 27. EPR / Regulatory Context

RE-CIRCLE is not an EPR compliance tool. It is a channel that could feed one.

- The E-Waste (Management) Rules, 2022 require producers to fund formal recycling
  via EPR certificates.
- CPCB-authorized recyclers issue those certificates.
- RE-CIRCLE provides the traceability chain (QR + timestamp + status) that could be
  used to justify EPR credits. No formal EPR filing or certificate generation is
  implemented.

---

## 28. User Journey

Collector: Open app, login, Dashboard, Create Lot (photo + category + weight),
LotDetail shows timer + live bids + QR section, Close Auction, lot becomes MATCHED,
meet recycler, show QR, earnings updates after payment.

Recycler: Login, Dashboard, Lots page shows open lots, type rupee-per-kg, live total
shown, Place Bid. WebSocket pushes bid to collector. Auction closes, lot appears in
My Matched Lots. Handovers page, Scan QR or manual entry, confirm weight/price/method.
Spending page shows transaction.

Admin: Login, Admin Dashboard, Stats shows collector count, recycler count, lot count,
total paid. Users tab lists all users. Recyclers tab verify/delete. Stats tab same as
Dashboard.

---

## 29. Sequence Diagram - Bid and Accept

Recycler types bid in frontend. Frontend POSTs to /lots/{lotId}/bids. BidController
calls BidService.placeBid. Service saves Bid (PENDING), updates lot to BIDDING,
broadcasts to /topic/lots/{lotId}/bids. Frontend receives 200. WebSocket pushes live
bid to collector view.

---

## 30. State / Lifecycle Diagram (MaterialLot)

CREATED (createLot before BIDDING)
BIDDING (first bid OR create)
MATCHED (closeAuction with winner)
deleted (closeAuction with no bids)
HANDED_OVER (implicit at handover)
PAID (confirmHandover PAID)
PAYMENT_PENDING (confirmHandover PENDING)
PAID (later, from PAYMENT_PENDING)
COMPLETED (manual)

Only CREATED to BIDDING to MATCHED to PAID/PAYMENT_PENDING transitions are actually
exercised by the current UI.

---

## 31. Business Rules

| Rule | Where enforced |
|---|---|
| Weight must be > 0 | CreateLot.jsx, LotService |
| Category must exist | LotService.createLot |
| Only collector can close their own auction | BidService.closeAuction |
| Only recycler can place a bid | SecurityConfig role check |
| Bid after auctionEndsAt rejected | BidService.placeBid |
| Only assigned recycler can confirm handover | LotService.confirmHandover |
| Earnings count only PAID/COMPLETED | Earnings.jsx filter |
| Auction auto-closes at auctionEndsAt | AuctionScheduler (60s) |
| Empty auctions delete the lot | BidService.finalizeAuction |

---

## 32. Algorithms

Haversine distance (frontend BidPanel.jsx):
- Input: lot lat/lng, recycler lat/lng
- Output: km (rounded int)
- Used for distance chip on bid rows

Auction winner selection (BidService.finalizeAuction):
- Query bids by lot, sorted by amountPerKg DESC
- Take top, set ACCEPTED, others REJECTED

---

## 33. Third-Party Services

Current: None. Everything runs on localhost.

TensorFlow.js CDN was planned but not yet integrated.

---

## 34. Logging and Monitoring

- Backend: SLF4J via Logback, default Spring Boot levels
- Frontend: console.log / console.error for API + WebSocket events
- No structured logs, no Sentry, no metrics endpoint beyond /health

---

## 35. Privacy and Data Handling

| Data | Where stored | Notes |
|---|---|---|
| Email, name, phone | users table | PII |
| Password | users table | BCrypt hash only |
| Lot details | material_lots | Includes lat/lng of collection |
| Images | backend/uploads/ | Local disk |
| JWT | Browser localStorage | - |

Not collected: Aadhaar, PAN, bank details, device IDs.

---

## 36. Known Limitations

- No automated tests
- No CI/CD
- No deployment
- AI classification is filename-based, not visual
- No rate limiting
- No HTTPS (localhost only)
- No pagination on most list endpoints
- No PWA / installable app
- No field research or unit economics documented
- Two-tab same-browser identity collision (localStorage)
- Tamil/Telugu/Kannada/Malayalam safety strings fall back to English
- Admin delete recycler is client-only (no backend endpoint)
- Notification dropdown strings are hardcoded English

---

## 37. Future Improvements

Short-term:
- TF.js MobileNet v2 in-browser classifier with backend fallback
- PWA manifest + service worker
- Distance-based backend ranking of recyclers
- Field research + unit economics docs

Medium-term:
- Play Store Android app via Capacitor
- Refresh tokens
- Rate limiting on auth
- Backend recycler CRUD endpoints

Long-term:
- EPR certificate generation
- Payment gateway integration (Razorpay / UPI)
- Real-time GPS tracking
- Managed cloud deployment
- ML fine-tuning on labeled e-waste images

---

## 38. Technical Debt

| Area | Why it matters | Suggested fix |
|---|---|---|
| No tests | Regression risk | Add JUnit + Vitest |
| No @ControllerAdvice | Inconsistent errors | Add global handler |
| Secrets in properties | jwt.secret plaintext | Env vars + @Value |
| findAll() on admin | Slow at scale | Add pagination |
| No CI | Manual deploy risk | GitHub Actions |

---

## 39. Contribution Guide (recommended)

- Fork + branch per feature: feat/<short-name>
- Commit convention: feat: / fix: / chore: / docs:
- PR requires: mvn -q compile passes + npm run dev boots
- No automated test requirement yet

---

## 40. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Backend fails on port 8080 | Process already running | fuser -k 8080/tcp |
| material_lots_status_check violation on bid | Missing BIDDING in constraint | Run section 20 step 3 SQL |
| Login OK but POST /lots 403 | Wrong role JWT | Log out, log back in as collector |
| Recyclers 403 on pending-handovers | Not logged in as recycler | Log out, log in as recycler |
| QR scan opens blank | Camera permission denied | Allow camera in browser |
| navigator.share unavailable | Desktop Firefox | Copy button still works |
| Blank page after Create Lot | Component crash | Check browser console for JS error |
| Recycler sees no lots | No lots in DB or role mismatch | Check JWT role, refresh |
| WebSocket disconnects | Backend restarted | Auto-reconnects in 5s |

---

## 41. Hackathon Demonstration Flow

1. Slide: The problem - informal kabadiwalas, unfair prices, no traceability
2. Slide: RE-CIRCLE - auction + QR + 7 languages
3. Live: Log in as collector, Create Lot (5 kg PCB, with photo)
4. Live: LotDetail opens, timer shows 23:59:xx
5. Live: Second window (private), log in as recycler, see lot appear live
6. Live: Recycler bids 500, live total: 2500
7. Live: Collector sees bid stream in real time
8. Live: Collector closes auction early, lot flips to MATCHED
9. Live: Recycler scans QR, confirms weight + price + Cash, PAID
10. Live: Collector Earnings page shows completed transaction
11. Slide: Architecture + tech stack
12. Slide: DATASETS.md (7 documented datasets)
13. Slide: Roadmap + unit economics + field research plan

---

## 42. Judge-Focused Technical Highlights

- Reverse auction with WebSocket live updates (real-time multi-user)
- 24h auto-close scheduler (Spring @Scheduled, 60s cadence)
- QR-verified handover with state machine
- 7-language i18n with English fallback (custom hook, not library)
- Offline-first lot creation (localStorage queue + auto-sync)
- Photo upload + AI hint pipeline
- Spoken prices via Web Speech API

---

## 43. Project Metrics

| Metric | Count |
|---|---|
| Backend controllers | 13 |
| Backend service classes | ~6 |
| Backend entities | ~8 |
| Backend repositories | 8 |
| Frontend pages | ~20 |
| Frontend components (common) | ~9 |
| Languages supported | 7 |
| Auth roles | 3 |
| REST endpoints (approx.) | ~30 |
| WebSocket topics | 2 |
| DB tables | 8 |

---

## 44. Glossary

| Term | Meaning |
|---|---|
| Kabadiwala | Informal scrap collector |
| EPR | Extended Producer Responsibility |
| CPCB | Central Pollution Control Board (India) |
| Lot | A declared batch of e-waste material |
| Bid | Per-kg offer by a recycler on a lot |
| Auction window | The 24h period a lot accepts bids |
| Handover | Physical transfer of material to recycler |
| Match | Lot assigned to a winning recycler |
| PAID | Fully settled transaction |

---

## 45. Final Architecture Summary

RE-CIRCLE is a two-tier application: React SPA + Spring Boot REST/STOMP API, backed
by PostgreSQL. Runs entirely on localhost for demo purposes. Core flow is a reverse
auction with WebSocket-driven live updates, followed by a QR-verified handover and
status transition to PAID. State stored in JPA entities with a small state machine on
MaterialLot. Authentication is JWT + BCrypt. Offline tolerance via localStorage queue
with auto-sync on reconnect. UI available in 7 languages with English fallback. No
automated test suite, no CI/CD, no production deployment. These are primary gaps for
v2.

---

## 46. Source Code Reference

| Feature | Files |
|---|---|
| Auth | AuthController.java, AuthService.java, JwtUtil.java, JwtRequestFilter.java, SecurityConfig.java, AuthContext.jsx |
| Lot CRUD | LotController.java, LotService.java, MaterialLot.java, MaterialLotRepository.java |
| Auction | BidController.java, BidService.java, AuctionScheduler.java, Bid.java, BidRepository.java, AuctionTimer.jsx, BidPanel.jsx |
| Handover | RecyclerHandovers.jsx, LotService.confirmHandover, QRScanner.jsx, useScanner.js |
| Scanner FAB | ScanFAB.jsx, ScanFAB.css, Layout.jsx |
| Offline | services/db.js, OfflineContext.jsx |
| i18n | hooks/useTranslation.js, context/LanguageContext.jsx, translations/index.js |
| Photo + AI | CreateLot.jsx, api/ai.js, AIController.java, WebConfig.java |
| Admin | AdminController.java, AdminDashboard.jsx |
| Earnings | EarningsController.java, EarningsService.java, Earnings.jsx |
| Prices | PriceController.java, PriceService.java, Prices.jsx |
| Datasets | DATASETS.md |

---

*End of documentation.*
