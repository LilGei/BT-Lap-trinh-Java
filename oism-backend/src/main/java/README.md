# OISM Backend (Spring Boot 3 / Java 21)

## Chạy nhanh
    docker compose up --build        # Postgres + API (Flyway tự tạo schema)
    # Swagger UI: http://localhost:8080/swagger-ui.html

## Thử API
    curl -X POST localhost:8080/api/auth/register-tenant -H 'Content-Type: application/json' \
      -d '{"tenantCode":"shop1","storeName":"Shop 1","ownerName":"An","email":"an@shop1.vn","password":"12345678"}'
    # lấy accessToken rồi:
    curl -X POST localhost:8080/api/branches -H "Authorization: Bearer <TOKEN>" -H 'Content-Type: application/json' \
      -d '{"code":"HCM01","name":"Chi nhánh Q7"}'

## Cấu trúc
    common/     exception, handler
    tenant/     TenantContext, @TenantId resolver, Tenant
    auth/       JWT, RBAC, đăng ký tenant, login
    branch/     FR-AUTH-04
    inventory/  StockLevel + Ledger append-only + reserve/release/deduct (pessimistic lock)
    db/migration/V1__init_schema.sql   toàn bộ schema
