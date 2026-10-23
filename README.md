📦 OISM - Hệ thống quản lý bán hàng và tồn kho đa kênh

(Omnichannel Inventory and Sales Management System)

📖 1. Giới thiệu dự án

Trong bối cảnh bán lẻ hiện đại, việc bán hàng đa kênh (Cửa hàng vật lý, Shopee, TikTok, Lazada) gây ra nhiều thách thức như bán vượt số lượng tồn (overselling), sai lệch giá vốn (COGS) và dữ liệu tồn kho thiếu đồng bộ.

OISM là giải pháp phần mềm SaaS Multi-tenant chịu tải cao được thiết kế để giải quyết triệt để các vấn đề trên. Hệ thống cốt lõi sử dụng cơ chế Inventory Ledger (Sổ cái tồn kho Append-only), kết hợp với bộ tính toán Giá vốn bình quân gia quyền tự động, cơ chế khóa chống bán vượt (Anti-Oversell), và ứng dụng điểm bán hàng PWA POS.

🛠 2. Công nghệ sử dụng

Backend: .NET 8 Web API (Clean Architecture).

Frontend: ReactJS (Admin Dashboard) & ReactJS PWA (POS App).

Database: PostgreSQL (EF Core Global Query Filters cho Data Isolation).

Real-time & Background: SignalR, Hangfire.

DevOps & Deployment: Docker, Docker Compose, GitHub Actions (CI/CD).

Bảo mật: JWT Authentication, BCrypt/Argon2.

🔥 3. Tính năng cốt lõi (Core Functional Requirements)

🏢 Module 1: Multi-tenant & Auth (FR-AUTH)

Tạo và quản lý các cửa hàng độc lập (Tenant Isolation).

Xác thực người dùng (JWT) và Phân quyền RBAC (Owner, Staff, Cashier).

📦 Module 2: Product & Inventory Ledger (FR-PROD & FR-INV)

Quản lý danh mục, biến thể sản phẩm (SKU) và tự động tạo mã vạch (Barcode).

Append-Only Inventory Ledger: Mọi thay đổi tồn kho (nhập, xuất, bán, kiểm kê, chuyển kho) đều được ghi vào sổ cái. Tuyệt đối cấm Update trực tiếp cột số lượng.

💰 Module 3: Centralized Order & Anti-Oversell (FR-ORD & FR-RSE)

Đồng bộ đơn hàng đa kênh về một Hub duy nhất với State Machine chặt chẽ.

Anti-Oversell Engine: Tự động tính Available = On_hand - Reserved. Sử dụng Database Locking để khóa tồn kho, ngăn chặn bán âm.

Tự động tính lại giá vốn hàng bán (Weighted Average Cost) mỗi khi nhập hàng.

🛒 Module 4: Counter Sales PWA POS (FR-POS)

Giao diện bán hàng tại quầy siêu tốc, tối ưu cho quét mã vạch và phím tắt.

Hỗ trợ in hóa đơn tự động (Browser Print API) và thanh toán QR.

📊 Module 5: Simulator & Reports (FR-SIM & FR-REP)

E-commerce Webhook Simulator: Công cụ giả lập bắn đơn từ Shopee/TikTok để test chịu tải.

Báo cáo doanh thu, lợi nhuận gộp (Gross Profit) và cảnh báo sắp hết hàng.

🚀 4. Khởi tạo dự án (Project Setup)

Dự án được cấu trúc theo dạng Monorepo. Dưới đây là các lệnh để cài đặt môi trường.

Cài đặt Backend (.NET 8 Clean Architecture)

mkdir backend && cd backend
dotnet new sln -n OISM
dotnet new webapi -n OISM.API
dotnet new classlib -n OISM.Application
dotnet new classlib -n OISM.Domain
dotnet new classlib -n OISM.Infrastructure
dotnet sln add OISM.API/OISM.API.csproj
dotnet sln add OISM.Application/OISM.Application.csproj
dotnet sln add OISM.Domain/OISM.Domain.csproj
dotnet sln add OISM.Infrastructure/OISM.Infrastructure.csproj


Cài đặt Frontend (ReactJS Admin & POS)

npm create vite@latest frontend-admin -- --template react-ts
npm create vite@latest frontend-pos -- --template react-ts
cd frontend-admin
npm install
npm install axios react-router-dom zustand tailwindcss


👥 5. Đội ngũ phát triển

Dự án được thực hiện bởi nhóm gồm 7 thành viên (4 Frontend, 3 Backend) áp dụng quy trình Agile/Scrum.

BE 1, 2, 3: Xử lý hệ thống lõi (.NET 8), Anti-Oversell Database Locking, và luồng Inventory Ledger.

FE 1, 2, 3, 4: Phát triển Admin Dashboard và hệ thống PWA POS bán hàng tại quầy.

⚙️ 6. Triển khai nhanh (Deployment)

Hệ thống cung cấp sẵn file docker-compose.yml để chạy toàn bộ dịch vụ chỉ với 1 lệnh duy nhất:

docker-compose up -d --build


API Swagger: http://localhost:5000/swagger

Admin Web: http://localhost:3000

POS Web: http://localhost:3001
