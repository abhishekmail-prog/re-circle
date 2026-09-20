# RE-CIRCLE — Structured Datasets

Every dataset RE-CIRCLE generates, stores, and consumes.

## 1. Material Dataset
Table: material_lots + material_categories
Fields: lotId, imageUrl, weightKg, condition, sourceType, estimatedValue
Created by: POST /lots
Validated by: weight > 0, category must exist

## 2. Price Dataset
Table: bids + material_categories
Fields: amountPerKg, createdAt, finalPricePerKg
Created by: POST /lots/{lotId}/bids
Validated by: amount > 0, auction must be open

## 3. Recycler Dataset
Table: recyclers
Fields: companyName, facilityAddress, latitude, longitude, authorizationNumber, authorized, pickupAvailable, serviceRadiusKm
Created by: DataSeeder + admin
Validated by: admin-only verify

## 4. Transaction Dataset
Table: material_lots + bids
Lifecycle: CREATED -> BIDDING -> MATCHED -> HANDED_OVER -> PAYMENT_PENDING -> PAID -> COMPLETED
Every transition stores a timestamp. State machine enforced in services.

## 5. Traceability Dataset
Derived from material_lots + qrCodeData
1. Collector creates lot -> lotId, photo, weight, location
2. Recyclers bid -> bidder, amount, timestamp
3. Collector accepts -> winner, price
4. Physical handover -> QR scan, timestamp
5. Recycler verifies -> weight, final value
6. Payment -> status
Rendered by TraceabilityTimeline on LotDetail.

## 6. Collector Dataset
Table: users (minimal)
Fields: email, fullName, phoneNumber, role
NOT collected: address, ID number, bank details, device IDs
History: derived from material_lots by collector_id

## 7. AI/ML Training Dataset
Current: /ai/classify uses filename keyword matching (demo)
Roadmap: TensorFlow Lite MobileNet trained on collector uploads + public datasets

## Data Flow
Collector -> POST /lots -> material_lots (+ imageUrl)
Recycler -> POST /lots/{id}/bids -> bids (+ WebSocket push)
Auction close -> status MATCHED
Handover -> POST /lots/{id}/handover -> verifiedWeightKg, finalValue, PAID
All events -> WebSocket /topic/lots -> live UI refresh
