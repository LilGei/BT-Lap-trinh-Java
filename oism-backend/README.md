# OISM backend (BE3, Spring Boot / Java 21)

The backend uses the schema and Flyway migrations from `oism-database`. Its order, stock, payment, and report queries always scope by `tenant_id`. Stock reservations and deductions use PostgreSQL row locks inside Spring transactions.

## Run with Docker Compose

Run from the repository root. Set a Base64 encoded JWT key containing at least 32 random bytes before starting the stack:

```powershell
$env:JWT_SECRET = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
docker compose -f oism-backend/docker-compose.yml up --build
```

The API listens on `http://localhost:8080`; health check: `GET /actuator/health`. PostgreSQL is initialized with the migrations in `oism-database/src/main/resources/db/migration`.

## Build and tests

```powershell
mvn -f oism-backend/pom.xml test
mvn -f oism-backend/pom.xml package
```

The Flash Sale test uses Testcontainers and skips when Docker is unavailable. It submits 50 simultaneous reservations against one unit and expects exactly one to succeed.

## Authentication

BE3 endpoints require `Authorization: Bearer <JWT>`. The JWT must be signed with `JWT_SECRET` and contain tenant (`tenantId` or `tenant_id`), user (`userId`, `user_id`, `id`, or `sub`) and `role` (`OWNER`, `STAFF`, or `CASHIER`) claims. The BE1 authentication module is a separate assignment responsibility.

## BE3 API

- `POST /api/orders` — create an order and reserve all requested SKU quantities.
- `GET /api/orders?branchId=&status=&limit=` and `GET /api/orders/{id}` — list and inspect tenant-owned orders.
- `PATCH /api/orders/{id}/status` with `{"status":"CONFIRMED"}` or `{"status":"CANCELLED"}` — enforce `DRAFT → RESERVED → CONFIRMED → COMPLETED`; cancellation releases held stock or writes a compensating return ledger row after confirmation.
- `POST /api/webhooks/{SHOPEE|TIKTOK|LAZADA}/orders` — idempotent external order ingestion using `externalOrderId`.
- `POST /api/pos/checkout` — reserve, confirm, deduct, snapshot COGS, record payment and complete in one database transaction. `paymentMethod` is `CASH` or `QR_TRANSFER`.
- `GET /api/reports/gross-profit?from=&to=&branchId=&channel=&skuId=` — completed order revenue, COGS and gross profit.
- `GET /api/reports/low-stock?branchId=` — available stock at or below the SKU reorder threshold.

Order notifications are published after commit on `/topic/tenants/{tenantId}/orders` through the authenticated STOMP endpoint `/ws`. Connect with a native `Authorization: Bearer <JWT>` header; subscriptions outside the token tenant are rejected. Reserved orders expire after `ORDER_RESERVATION_MINUTES` (default 15); a scheduled job releases their stock. Low-stock notifications are generated every five minutes.

The project proposal document lists .NET 8 for the final product, while `khung be.txt` and the repository's existing Maven/JPA code specify Java Spring Boot. This BE3 implementation follows the Java Spring Boot assignment scaffold.
