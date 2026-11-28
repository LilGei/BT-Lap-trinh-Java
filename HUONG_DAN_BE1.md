# BE1 - ghi chú

- Đăng ký / đăng nhập / refresh / logout + JWT: AuthController, AuthService
- CRUD chi nhánh, danh mục, thương hiệu, sản phẩm, SKU, mã vạch: thư mục branch, catalog
- Chạy: copy .env.example thành .env rồi docker compose up --build
- Mình có sửa 4 file của BE3: OismApplication (bỏ exclude JPA), SecurityConfig (mở /api/auth),
  JwtAuthenticationFilter, CurrentUser
- Code BE2 đang lỗi chung với entity (Long vs UUID, trùng tên entity) nên build tạm dùng
  profile be1-only. BE2 sửa xong thì bỏ profile này.
- FE: đổi baseURL của axios thành /api
